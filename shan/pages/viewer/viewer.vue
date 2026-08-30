<template>
	<view class="viewer-page" :class="{ viewing: phase === 'viewing' }">
		<button v-if="showHomeButton" class="home-float-btn" @click.stop="goHome">首页</button>

		<!-- 阶段：加载中 -->
		<view v-if="phase === 'loading'" class="center-box">
			<view class="spin"></view>
			<text class="hint-text">正在获取闪照…</text>
		</view>

		<!-- 阶段：需要登录 -->
		<view v-else-if="phase === 'login'" class="center-box">
			<text class="hint-title">需要登录后查看</text>
			<button class="action-btn primary" @click="doLogin">微信一键登录</button>
		</view>

		<!-- 阶段：已超次数 -->
		<view v-else-if="phase === 'limit'" class="center-box">
			<text class="hint-title">已达查看上限</text>
			<text class="hint-sub">该闪照总共最多可查看 {{ flash.maxNum }} 次</text>
			<text v-if="canAdUnlock" class="hint-sub">观看完整广告后，可额外增加 1 次查看机会</text>
			<text v-else-if="adEnabled && !adUnitId" class="hint-sub">广告位暂未配置，暂时无法解锁查看机会</text>
			<button
				v-if="canAdUnlock"
				class="action-btn primary ad-unlock-btn"
				:disabled="adLoading"
				@click="watchAdForUnlock"
			>{{ adLoading ? '广告加载中…' : '看广告解锁 1 次' }}</button>
		</view>

		<!-- 阶段：已撤回/不存在 -->
		<view v-else-if="phase === 'gone'" class="center-box">
			<text class="hint-title">闪照已消失</text>
			<text class="hint-sub">该闪照已被撤回或删除</text>
		</view>

		<view v-else-if="phase === 'pc-blocked'" class="center-box">
			<text class="hint-title">请使用手机查看</text>
			<text class="hint-sub">当前闪照已禁止 PC 查看，请使用手机打开。</text>
		</view>

		<view v-else-if="phase === 'ios-blocked'" class="center-box">
			<text class="hint-title">请使用安卓手机查看</text>
			<text class="hint-sub">当前闪照已禁止 iOS 查看，避免截图保存原图。</text>
		</view>

		<!-- 阶段：准备查看（模糊预览） -->
		<view
			v-else-if="phase === 'ready'"
			class="flash-stage"
			@longpress="startView"
			@touchstart="pressingView = true"
			@touchend="pressingView = false"
			@touchcancel="pressingView = false"
		>
			<view class="flash-bg" :style="bgStyle"></view>
			<view class="flash-blur"></view>
			<view class="ready-overlay">
				<text class="ready-title">你收到了一张闪照</text>
				<text class="ready-sub">查看后将被记录 · 最多可看 {{ remainTimes }} 次</text>
				<text v-if="showOrigin" class="origin-tip">来源：{{ originText }}</text>
				<!-- #ifdef MP-WEIXIN -->
				<text v-if="flash.screenFlag === '1'" class="warn-tip">截屏将被记录</text>
				<!-- #endif -->
				<text class="hold-view-tip">{{ pressingView ? '正在准备查看…' : '按住即可查看' }}</text>
				<text v-if="flash.shareBlockFlag === '1'" class="no-share-tip">此闪照禁止转发</text>
			</view>
		</view>

		<!-- 阶段：查看中（倒计时） -->
		<view v-else-if="phase === 'viewing'" class="flash-stage">
			<image
				class="flash-img"
				:src="imgSrc"
				mode="aspectFit"
				:show-menu-by-longpress="false"
			/>
			<view class="countdown-circle" :style="{ background: countdownBg }">
				<view class="countdown-inner">
					<text class="countdown-num">{{ countdownSec }}</text>
					<text class="countdown-unit">秒</text>
				</view>
			</view>
		</view>

		<!-- 阶段：已结束 -->
		<view v-else-if="phase === 'done'" class="center-box">
			<text class="hint-title">查看结束</text>
			<text class="hint-sub">本次查看时长 {{ viewedSec }} 秒{{ hasScreenshot ? ' · 检测到截屏' : '' }}</text>
			<view v-if="remainTimes > 0" class="hint-remain">
				<text>还可查看 {{ remainTimes }} 次</text>
				<button class="action-btn outline" @click="resetReady">再看一次</button>
			</view>
		</view>

	</view>
</template>

<script>
import { wxLogin, getFlashForViewer, recordView, updateViewRecord, adUnlock, getPublicConfig, recordShare, getRemain } from '../../utils/api'
import { getBaseUrl } from '../../utils/config'
import { resolveFileUrl } from '../../utils/format'

export default {
	data() {
		return {
			flashId: '',
			phase: 'loading',  // loading | login | ready | viewing | done | limit | gone
			flash: null,
			imgSrc: '',
			blurSrc: '',
			viewedCount: 0,
			remainTimes: 0,
			countdownSec: 0,
			countdownPct: 100,
			viewedSec: 0,
			hasScreenshot: false,
			hasScreenRecord: false,
			isIOS: false,
			isPC: false,
			adEnabled: false,
			adUnitId: '',
			maxAdUnlockCount: 3,
			adUnlocks: 0,
			adLoading: false,
			pressingView: false,
			viewRecorded: false,
			currentRecordId: '',
			shareTitle: '对方发送了1张照片，点击查看~',
			_timer: null,
			_viewStart: 0,
			_screenListener: null,
			_recordListener: null,
			_captureEnding: false,
			systemInfo: null,
			_adShowing: false,
			_initPromise: null,
			_startingView: false,
			_finishingView: false
		}
	},
	computed: {
		bgStyle() {
			if (!this.imgSrc) return {}
			return { backgroundImage: `url(${this.blurSrc || this.imgSrc})` }
		},
		countdownBg() {
			return `conic-gradient(#2f7bff ${this.countdownPct}%, rgba(255, 255, 255, 0.22) 0)`
		},
		canAdUnlock() {
			return this.adEnabled && this.flash && this.flash.adFlag === '1' && !!this.adUnitId && this.adUnlocks < this.maxAdUnlockCount
		},
		showHomeButton() {
			return ['ready', 'limit', 'done', 'gone', 'login', 'pc-blocked', 'ios-blocked'].includes(this.phase)
		},
		showOrigin() {
			return this.flash && this.flash.originFlag === '1'
		},
		originText() {
			const map = {
				'0': '拍照',
				'1': '相册',
				'2': '聊天记录'
			}
			return map[this.flash && this.flash.fileOrigin] || '未知'
		}
	},
	onLoad(options) {
		this.initSystemInfo()
		this.flashId = options.id || ''
		if (!this.flashId) {
			this.phase = 'gone'
			return
		}
		this.init()
	},
	onShow() {
		this.updateShareMenuState()
		if (this.flashId && !this._initPromise && (this.phase === 'loading' || !this.flash)) {
			this.init()
		}
	},
	onUnload() {
		this.clearTimer()
		this.unbindCaptureListeners()
		this.restoreCaptureEffect()
	},
	onHide() {
		if (this.phase === 'viewing') {
			this.finishView()
		}
	},
	methods: {
		async init() {
			if (this._initPromise) return this._initPromise
			this.phase = 'loading'
			const token = uni.getStorageSync('token')
			this._initPromise = (async () => {
				const requests = [
					getFlashForViewer(this.flashId),
					getPublicConfig()
				]
				if (token) requests.push(getRemain(this.flashId))
				const results = await Promise.all(requests)
				this.flash = results[0].data || results[0]
				const cfg = results[1].data || results[1]
				this.adEnabled = cfg.ad_unlock_enabled === '1'
				this.adUnitId = cfg.ad_rewarded_video_id || ''
				this.maxAdUnlockCount = Math.max(0, parseInt(cfg.max_ad_unlock_count || '3', 10) || 0)
				this.shareTitle = cfg.share_title || this.shareTitle
				this.imgSrc = resolveFileUrl(this.flash.filePath, getBaseUrl())
				this.blurSrc = resolveFileUrl(this.flash.fileMasai || this.flash.fileThumb || this.flash.filePath, getBaseUrl())
				this.updateShareMenuState()
				if (this.shouldBlockPcView()) {
					this.phase = 'pc-blocked'
					return
				}
				if (this.shouldBlockIosView()) {
					this.phase = 'ios-blocked'
					return
				}
				this.enableCaptureHidden()
				if (!token) {
					this.phase = 'login'
					return
				}
				const remainData = results[2].data || results[2]
				this.remainTimes = remainData.remain
				this.viewedCount = remainData.total - remainData.remain
				this.adUnlocks = remainData.adUnlocks || 0
				this.phase = remainData.remain <= 0 ? 'limit' : 'ready'
			})()
			try {
				await this._initPromise
			} catch (e) {
				this.phase = 'gone'
			} finally {
				this._initPromise = null
			}
		},
		initSystemInfo() {
			// #ifdef MP-WEIXIN
			try {
				if (!this.canUseWxApi('getSystemInfoSync')) return
				const info = wx.getSystemInfoSync()
				this.systemInfo = info
				const platformText = `${info.platform || ''} ${info.system || ''} ${info.model || ''}`.toLowerCase()
				this.isIOS = /ios/.test(platformText)
				this.isPC = /windows|mac|devtools/.test(platformText)
			} catch {
				this.isIOS = false
				this.isPC = false
				this.systemInfo = null
			}
			// #endif
		},
		canUseWxApi(apiName) {
			// #ifdef MP-WEIXIN
			if (typeof wx === 'undefined' || typeof wx[apiName] !== 'function') return false
			try {
				if (typeof wx.canIUse === 'function') return !!wx.canIUse(apiName) || typeof wx[apiName] === 'function'
			} catch {}
			return true
			// #endif
			// #ifndef MP-WEIXIN
			return false
			// #endif
		},
		shouldBlockPcView() {
			return this.isPC && this.flash && this.flash.pcFlag === '1'
		},
		shouldBlockIosView() {
			return this.isIOS && this.flash && this.flash.iosFlag === '1'
		},
		updateShareMenuState() {
			// #ifdef MP-WEIXIN
			if (!this.flash || this.flash.shareBlockFlag === '1') {
				if (this.canUseWxApi('hideShareMenu')) {
					wx.hideShareMenu({
						menus: ['shareAppMessage', 'shareTimeline']
					})
				}
				if (this.canUseWxApi('updateShareMenu')) {
					wx.updateShareMenu({
						withShareTicket: true,
						isPrivateMessage: false
					})
				}
				return
			}
			if (this.canUseWxApi('showShareMenu')) {
				wx.showShareMenu({
					withShareTicket: true,
					menus: ['shareAppMessage']
				})
			}
			if (this.canUseWxApi('updateShareMenu')) {
				wx.updateShareMenu({
					withShareTicket: true,
					isPrivateMessage: false
				})
			}
			// #endif
		},
		bindCaptureListeners() {
			// #ifdef MP-WEIXIN
			if (!this._screenListener && this.canUseWxApi('onUserCaptureScreen')) {
				this._screenListener = () => {
					if (!this.shouldHandleCapture()) return
					this.hasScreenshot = true
					this.handleScreenshotDetected()
				}
				wx.onUserCaptureScreen(this._screenListener)
			}
			if (!this._recordListener && this.canUseWxApi('onScreenRecordingStateChanged')) {
				this._recordListener = (res) => {
					if (!['on', 'start'].includes(res.state) || !this.shouldHandleCapture()) return
					this.hasScreenRecord = true
					uni.showToast({ title: '检测到录屏，查看已结束', icon: 'none' })
					this.handleCaptureDetected()
				}
				wx.onScreenRecordingStateChanged(this._recordListener)
			}
			// #endif
		},
		unbindCaptureListeners() {
			// #ifdef MP-WEIXIN
			if (this._screenListener && this.canUseWxApi('offUserCaptureScreen')) {
				wx.offUserCaptureScreen(this._screenListener)
				this._screenListener = null
			}
			if (this._recordListener && this.canUseWxApi('offScreenRecordingStateChanged')) {
				wx.offScreenRecordingStateChanged(this._recordListener)
				this._recordListener = null
			}
			// #endif
		},
		shouldHandleCapture() {
			return this.phase === 'viewing' && this.flash && this.flash.screenFlag === '1' && !this._captureEnding
		},
		restoreCaptureEffect() {
			// #ifdef MP-WEIXIN
			if (this.canUseWxApi('setVisualEffectOnCapture')) {
				wx.setVisualEffectOnCapture({
					visualEffect: 'none'
				})
			}
			// #endif
		},
		enableCaptureHidden() {
			// #ifdef MP-WEIXIN
			if (!this.flash || this.flash.screenFlag !== '1') return
			if (this.canUseWxApi('setVisualEffectOnCapture')) {
				wx.setVisualEffectOnCapture({
					visualEffect: 'hidden'
				})
			}
			// #endif
		},
		doLogin() {
			uni.login({
				success: async (loginRes) => {
					try {
						const res = await wxLogin(loginRes.code)
						const { token, user } = res.data || res
						uni.setStorageSync('token', token)
						uni.setStorageSync('userInfo', JSON.stringify(user))
						this.calcRemain()
					} catch {
						uni.showToast({ title: '登录失败，请重试', icon: 'none' })
					}
				},
				fail: () => uni.showToast({ title: '获取登录凭证失败', icon: 'none' })
			})
		},
		async calcRemain() {
			try {
				const res = await getRemain(this.flashId)
				const data = res.data || res
				this.remainTimes = data.remain
				this.viewedCount = data.total - data.remain
				this.adUnlocks = data.adUnlocks || 0
				this.phase = data.remain <= 0 ? 'limit' : 'ready'
			} catch {
				this.remainTimes = this.flash ? this.flash.maxNum : 1
				this.phase = 'ready'
			}
		},
		async startView() {
			if (this._startingView || this.phase !== 'ready' || !this.flash) return
			this._startingView = true
			this.unbindCaptureListeners()
			this.currentRecordId = ''
			try {
				const recordRes = await recordView(this.flashId, {
					viewSec: this.flash.maxSec,
					screenFlag: '0'
				})
				const recordData = recordRes.data || recordRes
				if (recordData && recordData.canView === false) {
					this.phase = 'limit'
					this._startingView = false
					return
				}
				this.currentRecordId = recordData.recordId || ''
			} catch (e) {
				this.phase = 'limit'
				this._startingView = false
				return
			}
			this._startingView = false
			this.phase = 'viewing'
			this.viewRecorded = true
			this.countdownSec = this.flash.maxSec
			this.countdownPct = 100
			this._viewStart = Date.now()
			this.hasScreenshot = false
			this.hasScreenRecord = false

			// #ifdef MP-WEIXIN
			if (this.flash.screenFlag === '1') {
				this.enableCaptureHidden()
				this.bindCaptureListeners()
				if (this.canUseWxApi('getScreenRecordingState')) {
					wx.getScreenRecordingState({
						success: (res) => {
							if (['on', 'start'].includes(res.state)) {
								this.hasScreenRecord = true
								uni.showToast({ title: '正在录屏，无法查看', icon: 'none' })
								this.handleCaptureDetected()
							}
						}
					})
				}
			}
			// #endif

			this._timer = setInterval(() => {
				if (this.countdownSec <= 1) {
					this.countdownSec = 0
					this.countdownPct = 0
					this.finishView()
					return
				}
				this.countdownSec--
				this.countdownPct = (this.countdownSec / this.flash.maxSec) * 100
			}, 1000)
		},
		async finishView() {
			if (this._finishingView || !this.flash) return
			this._finishingView = true
			try {
				this.clearTimer()
				this._captureEnding = false
				if (this.phase === 'viewing') {
					this.phase = 'done'
				}
				const elapsed = Math.round((Date.now() - this._viewStart) / 1000)
				this.viewedSec = Math.max(1, Math.min(elapsed, this.flash.maxSec))
				this.syncViewRecord()
				this.unbindCaptureListeners()

				this.remainTimes = Math.max(0, this.remainTimes - 1)
				if (this.remainTimes <= 0) {
					await this.calcRemain()
					return
				}
				this.phase = 'done'
			} finally {
				this._finishingView = false
			}
		},
		syncViewRecord() {
			if (!this.currentRecordId) return
			const screenFlag = this.hasScreenshot || this.hasScreenRecord ? '1' : '0'
			const elapsed = this._viewStart ? Math.round((Date.now() - this._viewStart) / 1000) : this.flash.maxSec
			const viewSec = Math.max(1, Math.min(this.viewedSec || elapsed, this.flash.maxSec))
			updateViewRecord(this.currentRecordId, {
				viewSec,
				screenFlag,
				...this.getCaptureMeta()
			}).catch(() => {})
		},
		getCaptureMeta() {
			if (!this.hasScreenshot && !this.hasScreenRecord) return {}
			const info = this.systemInfo || {}
			const parts = [
				info.brand,
				info.model,
				info.platform,
				info.system,
				info.version,
				info.SDKVersion
			].filter(Boolean)
			return {
				screenType: this.hasScreenRecord ? 'record' : 'screenshot',
				screenAt: new Date().toISOString(),
				deviceInfo: parts.join(' / ')
			}
		},
		handleCaptureDetected() {
			if (this._captureEnding) return
			this._captureEnding = true
			this.syncViewRecord()
			setTimeout(() => this.finishView(), 120)
		},
		handleScreenshotDetected() {
			if (this._captureEnding) return
			this._captureEnding = true
			this.syncViewRecord()
			this.finishView()
			uni.showModal({
				title: '截图已记录',
				content: '系统已记录本次截图信息，发送者将可在浏览记录中查看。图片含有暗水印，请勿传播或二次转发。',
				confirmText: '我已知晓',
				showCancel: false
			})
		},
		resetReady() {
			if (this.remainTimes <= 0) return
			this.phase = 'ready'
		},
		goHome() {
			uni.reLaunch({ url: '/pages/create/create' })
		},
		async watchAdForUnlock() {
			if (!this.adUnitId) {
				uni.showToast({ title: '广告位未配置', icon: 'none' })
				return
			}
			this.adLoading = true
			// #ifdef MP-WEIXIN
			const ad = wx.createRewardedVideoAd({ adUnitId: this.adUnitId })
			ad.onError(() => {
				this.adLoading = false
				if (!this._adShowing) {
					uni.showToast({ title: '广告加载失败，请稍后再试', icon: 'none' })
				}
			})
			ad.onClose(async (res) => {
				this._adShowing = false
				this.adLoading = false
				if (res && res.isEnded) {
					try {
						await adUnlock(this.flashId)
						uni.showToast({ title: '已解锁1次查看机会', icon: 'success' })
						await this.init()
					} catch {
						uni.showToast({ title: '解锁失败，请重试', icon: 'none' })
					}
				} else {
					uni.showToast({ title: '请观看完整广告才能解锁', icon: 'none' })
				}
			})
			try {
				await ad.load()
				await ad.show()
				this._adShowing = true
			} catch (e) {
				this.adLoading = false
				if (!this._adShowing) {
					uni.showToast({ title: '广告展示失败', icon: 'none' })
				}
			}
			// #endif
			// #ifndef MP-WEIXIN
			this.adLoading = false
			uni.showToast({ title: '当前环境不支持广告', icon: 'none' })
			// #endif
		},
		clearTimer() {
			if (this._timer) {
				clearInterval(this._timer)
				this._timer = null
			}
		}
	},
	onShareAppMessage() {
		if (this.flash && this.flash.shareBlockFlag === '1') {
			return { title: '暂不支持转发' }
		}
		if (this.flashId) {
			recordShare(this.flashId).catch(() => {})
		}
		return {
			title: this.shareTitle,
			path: `/pages/viewer/viewer?id=${this.flashId}`,
			imageUrl: this.flash ? resolveFileUrl(this.flash.fileShare || this.flash.fileThumb || this.flash.filePath, getBaseUrl()) : ''
		}
	}
}
</script>

<style scoped>
.viewer-page {
	min-height: 100vh;
	background: #0d0d0f;
	display: flex;
	align-items: center;
	justify-content: center;
}

.viewer-page.viewing {
	background: #000;
}

.home-float-btn {
	position: fixed;
	left: 28rpx;
	top: 92rpx;
	z-index: 50;
	height: 64rpx;
	min-width: 116rpx;
	padding: 0 26rpx;
	border-radius: 32rpx;
	background: rgba(255, 255, 255, 0.12);
	border: 1rpx solid rgba(255, 255, 255, 0.22);
	color: rgba(255, 255, 255, 0.9);
	font-size: 26rpx;
	line-height: 64rpx;
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
}

/* ── 居中容器 ── */
.center-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 60rpx 48rpx;
	gap: 24rpx;
}

.big-icon {
	font-size: 100rpx;
	line-height: 1;
}

.hint-title {
	font-size: 40rpx;
	font-weight: 700;
	color: #fff;
}

.hint-sub {
	font-size: 28rpx;
	color: #888;
	text-align: center;
}

.hint-remain {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
	margin-top: 16rpx;
}

.hint-remain text {
	font-size: 28rpx;
	color: #aaa;
}

/* ── 按钮 ── */
.action-btn {
	height: 80rpx;
	border-radius: 40rpx;
	padding: 0 56rpx;
	font-size: 30rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	line-height: 1;
}

.action-btn.primary {
	background: #2f7bff;
	color: #fff;
}

.ad-unlock-btn {
	margin-top: 12rpx;
	background: linear-gradient(90deg, #2f7bff, #7c5cff);
	box-shadow: 0 12rpx 30rpx rgba(47, 123, 255, 0.28);
}

.action-btn.large {
	height: 96rpx;
	padding: 0 72rpx;
	font-size: 34rpx;
}

.action-btn.outline {
	background: transparent;
	border: 2rpx solid #555;
	color: #ddd;
}

/* ── 闪照舞台 ── */
.flash-stage {
	width: 100vw;
	height: 100vh;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
}

.flash-bg {
	position: absolute;
	inset: 0;
	background-size: cover;
	background-position: center;
}

.flash-blur {
	position: absolute;
	inset: 0;
	backdrop-filter: blur(40px);
	-webkit-backdrop-filter: blur(40px);
	background: rgba(0, 0, 0, 0.55);
}

/* ── 准备查看遮罩 ── */
.ready-overlay {
	position: relative;
	z-index: 10;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 22rpx;
	padding: 0 48rpx;
}

.ready-icon {
	font-size: 80rpx;
	line-height: 1;
}

.ready-title {
	font-size: 42rpx;
	font-weight: 700;
	color: #fff;
}

.ready-sub {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.7);
	text-align: center;
}

.warn-tip {
	font-size: 24rpx;
	color: #ffbc42;
	background: rgba(255, 188, 66, 0.15);
	padding: 8rpx 24rpx;
	border-radius: 20rpx;
}

.origin-tip {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.78);
	background: rgba(255, 255, 255, 0.12);
	padding: 8rpx 24rpx;
	border-radius: 20rpx;
}

.hold-view-tip {
	height: 96rpx;
	border-radius: 48rpx;
	padding: 0 72rpx;
	background: #2f7bff;
	color: #fff;
	font-size: 34rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 16rpx 36rpx rgba(47, 123, 255, 0.32);
}

.no-share-tip {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.4);
}

/* ── 查看中图片 ── */
.flash-img {
	width: 100vw;
	height: 100vh;
	position: relative;
	z-index: 5;
}

/* ── 左上角圆形倒计时 ── */
.countdown-circle {
	position: absolute;
	left: 28rpx;
	top: 96rpx;
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	z-index: 11;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 26rpx rgba(0, 0, 0, 0.35);
	transition: background 1s linear;
}

.countdown-inner {
	width: 78rpx;
	height: 78rpx;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.72);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	color: #fff;
}

.countdown-num {
	font-size: 30rpx;
	font-weight: 700;
	line-height: 32rpx;
}

.countdown-unit {
	margin-top: 2rpx;
	font-size: 18rpx;
	line-height: 20rpx;
	color: rgba(255, 255, 255, 0.72);
}

/* ── 加载动画 ── */
.spin {
	width: 64rpx;
	height: 64rpx;
	border: 4rpx solid rgba(255,255,255,0.15);
	border-top-color: #2f7bff;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.hint-text {
	color: #888;
	font-size: 28rpx;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
