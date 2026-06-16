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
				<!-- #ifdef MP-WEIXIN -->
				<text v-if="flash.screenFlag === '1'" class="warn-tip">截屏将被记录</text>
				<!-- #endif -->
				<text class="hold-view-tip">{{ pressingView ? '正在准备查看…' : '按住即可查看' }}</text>
				<text v-if="flash.shareFlag !== '1'" class="no-share-tip">此闪照禁止转发</text>
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
import { wxLogin, getFlashForViewer, recordView, adUnlock, getPublicConfig, recordShare, getRemain } from '../../utils/api'
import { BASE_URL } from '../../utils/config'
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
			adEnabled: false,
			adUnitId: '',
			adLoading: false,
			pressingView: false,
			viewRecorded: false,
			shareTitle: '对方发送了1张照片，点击查看~',
			_timer: null,
			_viewStart: 0,
			_screenListener: null,
			_recordListener: null,
			_adShowing: false
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
			return this.adEnabled && !!this.adUnitId
		},
		showHomeButton() {
			return ['ready', 'limit', 'done', 'gone', 'login'].includes(this.phase)
		}
	},
	onLoad(options) {
		this.flashId = options.id || ''
		if (!this.flashId) {
			this.phase = 'gone'
			return
		}
		this.init()
	},
	onShow() {
		if (this.flashId && this.phase !== 'viewing') {
			this.init()
		}
	},
	onUnload() {
		this.clearTimer()
	},
	onHide() {
		if (this.phase === 'viewing') {
			this.finishView()
		}
	},
	methods: {
		async init() {
			this.phase = 'loading'
			try {
				const [flashRes, cfgRes] = await Promise.all([
					getFlashForViewer(this.flashId),
					getPublicConfig()
				])
				this.flash = flashRes.data || flashRes
				const cfg = cfgRes.data || cfgRes
				this.adEnabled = cfg.ad_unlock_enabled === '1'
				this.adUnitId = cfg.ad_rewarded_video_id || ''
				this.shareTitle = cfg.share_title || this.shareTitle
				this.imgSrc = resolveFileUrl(this.flash.filePath, BASE_URL)
				this.blurSrc = resolveFileUrl(this.flash.fileMasai || this.flash.fileThumb || this.flash.filePath, BASE_URL)
				this.checkLoginAndLoad()
			} catch (e) {
				this.phase = 'gone'
			}
		},
		checkLoginAndLoad() {
			const token = uni.getStorageSync('token')
			if (!token) {
				this.phase = 'login'
				return
			}
			this.calcRemain()
		},
		async doLogin() {
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
				const { remain, total } = res.data || res
				this.remainTimes = remain
				this.viewedCount = total - remain
				if (remain <= 0) {
					this.phase = 'limit'
					return
				}
			} catch {
				this.remainTimes = this.flash.maxNum
			}
			this.phase = 'ready'
		},
		async startView() {
			try {
				const res = await getFlashForViewer(this.flashId)
				this.flash = res.data || res
				this.imgSrc = resolveFileUrl(this.flash.filePath, BASE_URL)
				this.blurSrc = resolveFileUrl(this.flash.fileMasai || this.flash.fileThumb || this.flash.filePath, BASE_URL)
			} catch (e) {
				this.phase = 'gone'
				return
			}
			try {
				const recordRes = await recordView(this.flashId, {
					viewSec: this.flash.maxSec,
					screenFlag: '0'
				})
				const recordData = recordRes.data || recordRes
				if (recordData && recordData.canView === false) {
					this.phase = 'limit'
					return
				}
			} catch (e) {
				this.phase = 'limit'
				return
			}
			this.phase = 'viewing'
			this.viewRecorded = true
			this.countdownSec = this.flash.maxSec
			this.countdownPct = 100
			this._viewStart = Date.now()
			this.hasScreenshot = false
			this.hasScreenRecord = false

			// #ifdef MP-WEIXIN
			if (this.flash.screenFlag === '1') {
				if (wx.setVisualEffectOnCapture) {
					wx.setVisualEffectOnCapture({
						visualEffect: 'hidden'
					})
				}
				this._screenListener = () => {
					this.hasScreenshot = true
					uni.showToast({ title: '检测到截屏，查看已结束', icon: 'none' })
					this.finishView()
				}
				wx.onUserCaptureScreen(this._screenListener)
				this._recordListener = (res) => {
					if (res.state === 'on') {
						this.hasScreenRecord = true
						uni.showToast({ title: '检测到录屏，查看已结束', icon: 'none' })
						this.finishView()
					}
				}
				if (wx.onScreenRecordingStateChanged) {
					wx.onScreenRecordingStateChanged(this._recordListener)
				}
				if (wx.getScreenRecordingState) {
					wx.getScreenRecordingState({
						success: (res) => {
							if (res.state === 'on') {
								this.hasScreenRecord = true
								uni.showToast({ title: '正在录屏，无法查看', icon: 'none' })
								this.finishView()
							}
						}
					})
				}
			}
			// #endif

			this._timer = setInterval(() => {
				this.countdownSec--
				this.countdownPct = (this.countdownSec / this.flash.maxSec) * 100
				if (this.countdownSec <= 0) {
					this.finishView()
				}
			}, 1000)
		},
		async finishView() {
			this.clearTimer()
			const elapsed = Math.round((Date.now() - this._viewStart) / 1000)
			this.viewedSec = Math.max(1, Math.min(elapsed, this.flash.maxSec))

			// #ifdef MP-WEIXIN
			if (this._screenListener) {
				wx.offUserCaptureScreen(this._screenListener)
				this._screenListener = null
			}
			if (this._recordListener && wx.offScreenRecordingStateChanged) {
				wx.offScreenRecordingStateChanged(this._recordListener)
				this._recordListener = null
			}
			if (wx.setVisualEffectOnCapture) {
				wx.setVisualEffectOnCapture({
					visualEffect: 'none'
				})
			}
			// #endif

			this.remainTimes = Math.max(0, this.remainTimes - 1)
			if (this.remainTimes <= 0) {
				await this.calcRemain()
				return
			}
			this.phase = 'done'
		},
		resetReady() {
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
		if (this.flash && this.flash.shareFlag !== '1') {
			return { title: '暂不支持转发' }
		}
		if (this.flashId) {
			recordShare(this.flashId).catch(() => {})
		}
		return {
			title: this.shareTitle,
			path: `/pages/viewer/viewer?id=${this.flashId}`,
			imageUrl: this.flash ? resolveFileUrl(this.flash.fileShare || this.flash.fileThumb || this.flash.filePath, BASE_URL) : ''
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
