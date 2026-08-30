<template>
	<view class="app-page create-page">
		<view class="app-nav">
			<!-- #ifdef H5 -->
			<view class="fake-capsule">
				<view class="fake-dots"><text></text><text></text><text></text></view>
				<view class="fake-line"></view>
				<view class="fake-minus"></view>
				<view class="fake-line"></view>
				<view class="fake-circle"></view>
			</view>
			<!-- #endif -->
		</view>

		<view class="card pick-card">
			<view class="pick-inner" :class="{ 'has-image': imagePath }" @click="chooseImage">
				<image v-if="imagePath" class="preview-img" :src="imagePath" mode="aspectFill"></image>
				<template v-else>
					<button class="pick-btn">选择图片</button>
					<text class="pick-tip">可以选择拍照/相册/聊天记录图片~</text>
				</template>
			</view>
		</view>

		<view v-if="configReady" class="mode-card">
			<view class="mode-tabs">
				<view class="mode-tab" :class="{ active: form.mode === 'entertainment' }" @click="setMode('entertainment', true)">
					<text class="mode-title">娱乐模式</text>
					<text class="mode-sub">支持转发和广告加次数</text>
				</view>
				<view class="mode-tab" :class="{ active: form.mode === 'private' }" @click="setMode('private', true)">
					<text class="mode-title">保密模式</text>
					<text class="mode-sub">发布前看广告，强保护</text>
				</view>
			</view>
		</view>

		<view v-if="configReady" class="card setting-card">
			<view class="setting-row" v-for="item in safetySwitches" :key="item.key">
				<view class="setting-copy">
					<text class="setting-title">{{ item.title }}</text>
					<text class="setting-sub">{{ item.sub }}</text>
				</view>
				<switch class="ui-switch" color="#2f7bff" :checked="getSwitchChecked(item)" @change="onSwitch(item, $event)" />
			</view>
		</view>

		<view v-if="configReady" class="card setting-card">
			<view class="setting-row" v-for="item in extraSwitches" :key="item.key">
				<view class="setting-copy">
					<text class="setting-title">{{ item.title }}</text>
					<text class="setting-sub">{{ item.sub }}</text>
				</view>
				<switch class="ui-switch" color="#2f7bff" :checked="getSwitchChecked(item)" @change="onSwitch(item, $event)" />
			</view>
			<view v-if="adCardVisible" class="setting-row">
				<view class="setting-copy">
					<text class="setting-title">允许广告解锁</text>
					<text class="setting-sub">查看者次数用完后，可观看广告获得1次额外次数</text>
				</view>
				<switch class="ui-switch" color="#2f7bff" :checked="form.adEnabled" @change="onAdSwitch" />
			</view>
		</view>

		<view v-if="configReady" class="card option-card">
			<view class="option-row" @click="showCountPicker">
				<view>
					<text class="setting-title">查看次数</text>
					<text class="setting-sub">设置每人最多可查看的次数</text>
				</view>
				<view class="option-value">
					<text>{{ form.maxNum }}次</text>
				</view>
			</view>
			<view class="option-row" @click="showSecondPicker">
				<view>
					<text class="setting-title">查看时长</text>
					<text class="setting-sub">设置每次最多可查看多少秒</text>
				</view>
				<view class="option-value">
					<text>{{ form.maxSec }}秒</text>
				</view>
			</view>
		</view>

		<view class="action-bar" v-if="imagePath">
			<button class="action-btn clear" @click="clearImage">清空</button>
			<button class="action-btn change" @click="chooseImage">更换</button>
			<button class="action-btn create" @click="createFlash">创建闪照</button>
		</view>

		<view v-if="sharePopup" class="share-mask" @click="closeShare">
			<view class="share-panel" @click.stop>
				<view class="share-card">
					<view class="share-head">
						<view class="share-logo">闪</view>
						<text class="share-name">闪照相机</text>
					</view>
					<text class="share-text">对方发送了1张照片，点击查看~</text>
					<view class="share-img-wrap">
						<image v-if="imagePath" class="share-img" :src="imagePath" mode="aspectFill"></image>
						<view class="share-blur"></view>
					</view>
					<view class="share-foot">小程序</view>
				</view>
				<view class="share-actions">
					<button class="share-action primary" open-type="share">发给好友</button>
					<button class="share-action" @click="shareTimeline">发朋友圈</button>
					<button class="share-action" @click="goDetail">查看记录</button>
					<button class="share-action cancel" @click="closeShare">取消</button>
				</view>
			</view>
		</view>

		<view class="bottom-tabs">
			<view class="tab-item active">
				<image class="tab-icon" src="/static/sy.svg" mode="aspectFit"></image>
				<text>创建</text>
			</view>
			<view class="tab-item" @click="go('/pages/records/records')">
				<image class="tab-icon" src="/static/tj.svg" mode="aspectFit"></image>
				<text>记录</text>
			</view>
			<view class="tab-item" @click="go('/pages/profile/profile')">
				<image class="tab-icon" src="/static/gd.svg" mode="aspectFit"></image>
				<text>我的</text>
			</view>
		</view>
	</view>
</template>

<script>
import { uploadImage, createFlash, getPublicConfig, getPrivateUploadAdStatus, recordPrivateUploadAd, recordShare } from '../../utils/api'
import { getBaseUrl } from '../../utils/config'
import { formatTime, resolveFileUrl } from '../../utils/format'
import { ensureLogin } from '../../utils/auth'
export default {
	data() {
		return {
			imagePath: '',
			sharePopup: false,
			createdId: '',
			createdAt: '',
			createdShareImage: '',
			createdActivityId: '',
			creating: false,
			adCardVisible: true,
			adUnitId: '',
			configLoaded: false,
			configReady: false,
			formDirty: false,
			modeConfig: {},
			publishAdWatched: false,
			shareTitle: '对方发送了1张照片，点击查看~',
			fileOrigin: '1',
			createdCanShare: true,
			form: {
				mode: 'entertainment',
				originFlag: true,
				screenFlag: true,
				deviceBlockFlag: false,
				shareBlockFlag: false,
				adEnabled: true,
				maxNum: 1,
				maxSec: 3
			},
			safetySwitches: [
				{ key: 'screenFlag', title: '禁止截屏', sub: '安卓禁止截屏，苹果将提示并标记' },
				{ key: 'shareBlockFlag', title: '禁止转发', sub: '开启后好友无法继续转发此图片' },
				{ key: 'deviceBlockFlag', title: '禁止 iOS 和 PC 查看', sub: '开启后苹果设备和电脑端都无法查看原图' }
			],
			extraSwitches: [
				{ key: 'originFlag', title: '开放来源', sub: '可查看图片来自拍照、相册还是聊天记录' }
			]
		}
	},
	onShow() {
		this.updateShareMenuState()
		if (!this.formDirty) {
			this.configReady = false
			this.configLoaded = false
		}
		getPublicConfig().then(res => {
			const cfg = res.data || res
			this.applyConfig(cfg, !this.formDirty)
		}).catch(() => {
			if (!this.configReady) this.configReady = true
		})
	},
	methods: {
		applyConfig(cfg, applyDefaults = true) {
			if (!cfg) return
			this.adCardVisible = cfg.ad_unlock_enabled === '1'
			this.adUnitId = cfg.ad_rewarded_video_id || ''
			this.modeConfig = cfg
			if (applyDefaults) {
				this.form.maxNum = Math.max(1, parseInt(cfg.default_max_num || '1', 10) || 1)
				this.form.maxSec = Math.max(1, parseInt(cfg.default_max_sec || '3', 10) || 3)
				this.setMode(cfg.default_flash_mode === 'private' ? 'private' : 'entertainment')
				this.configLoaded = true
			}
			this.shareTitle = cfg.share_title || this.shareTitle
			this.configReady = true
		},
		updateShareMenuState() {
			// #ifdef MP-WEIXIN
			if (wx.showShareMenu) {
				wx.showShareMenu({
					withShareTicket: true,
					menus: ['shareAppMessage']
				})
			}
			if (wx.updateShareMenu) {
				const opts = {
					withShareTicket: true,
					isPrivateMessage: false
				}
				if (this.form.shareBlockFlag && this.createdActivityId) {
					opts.isPrivateMessage = true
					opts.activityId = this.createdActivityId
				}
				wx.updateShareMenu({
					...opts
				})
			}
			// #endif
		},
		chooseImage() {
			if (this.creating) return
			uni.showActionSheet({
				itemList: ['从相册选择', '拍照', '从聊天记录选择'],
				success: ({ tapIndex }) => {
					if (tapIndex === 2) {
						this.chooseFromMessage()
					} else {
						this.chooseFromMedia(tapIndex === 1 ? 'camera' : 'album')
					}
				}
			})
		},
		chooseFromMedia(sourceType) {
			// #ifdef MP-WEIXIN
			wx.chooseMedia({
				count: 1,
				mediaType: ['image'],
				sourceType: [sourceType],
				success: (res) => {
					const file = res.tempFiles && res.tempFiles[0]
					if (!file) return
					this.imagePath = file.tempFilePath
					const actualSource = file.sourceType || sourceType
					this.fileOrigin = actualSource === 'camera' ? '0' : '1'
					this.formDirty = true
				}
			})
			// #endif
			// #ifndef MP-WEIXIN
			uni.chooseImage({
				count: 1,
				sourceType: [sourceType],
				success: (res) => {
					this.imagePath = res.tempFilePaths[0]
					this.fileOrigin = sourceType === 'camera' ? '0' : '1'
					this.formDirty = true
				}
			})
			// #endif
		},
		chooseFromMessage() {
			// #ifdef MP-WEIXIN
			wx.chooseMessageFile({
				count: 1,
				type: 'image',
				success: (res) => {
					const file = res.tempFiles && res.tempFiles[0]
					if (!file) return
					this.imagePath = file.path || file.tempFilePath
					this.fileOrigin = '2'
					this.formDirty = true
				}
			})
			// #endif
			// #ifndef MP-WEIXIN
			uni.showToast({ title: '当前环境不支持聊天记录选图', icon: 'none' })
			// #endif
		},
		clearImage() {
			this.imagePath = ''
			this.sharePopup = false
			this.formDirty = false
		},
		async createFlash() {
			if (!this.imagePath) {
				uni.showToast({ title: '请先选择图片', icon: 'none' })
				return
			}
			if (!this.configReady) {
				uni.showToast({ title: '配置加载中，请稍后', icon: 'none' })
				return
			}
			if (this.creating) return
			this.creating = true
			try {
				await ensureLogin({
					content: '登录后即可上传图片并创建闪照'
				})
				if (this.form.mode === 'private' && this.modeConfig.private_upload_ad_required !== '0') {
					await this.ensurePublishAdWatched()
				}
				uni.showLoading({ title: '正在审核图片…' })
				const uploadRes = await uploadImage(this.imagePath)
				const uploadData = uploadRes.data || uploadRes
				const filePath = uploadData.filePath
				const fileThumb = uploadData.fileThumb || filePath
				const fileMasai = uploadData.fileMasai || fileThumb
				const fileShare = uploadData.fileShare || fileThumb

				uni.showLoading({ title: '创建中…' })
				const flashRes = await createFlash({
					filePath,
					fileThumb,
					fileMasai,
					fileShare,
					fileOrigin: this.fileOrigin,
					mode: this.form.mode,
					originFlag: this.form.originFlag ? '1' : '0',
					screenFlag: this.form.screenFlag ? '1' : '0',
					iosFlag: this.form.deviceBlockFlag ? '1' : '0',
					pcFlag: this.form.deviceBlockFlag ? '1' : '0',
					shareBlockFlag: this.form.shareBlockFlag ? '1' : '0',
					adFlag: this.form.adEnabled ? '1' : '0',
					maxNum: this.form.maxNum,
					maxSec: this.form.maxSec
				})
				const flash = flashRes.data || flashRes
				this.createdId = flash.id
				this.createdAt = flash.createdAt || this._formatNow()
				this.createdShareImage = resolveFileUrl(fileShare, getBaseUrl())
				this.createdCanShare = true
				this.createdActivityId = flash.activityId || ''
				this.updateShareMenuState()
				uni.hideLoading()
				this.sharePopup = true
			} catch (e) {
				uni.hideLoading()
				if (e && e.silent) return
				const msg = e && e.message ? e.message : '创建失败，请重试'
				if (e && e.modalConfirmText) {
					const isAuditFail = /违规|审核/.test(msg)
					uni.showModal({
						title: isAuditFail ? '审核未通过' : (e.modalTitle || '上传失败'),
						content: msg,
						showCancel: false,
						confirmText: e.modalConfirmText || '我知道了'
					})
				} else if (!e || !e.toastShown) {
					uni.showToast({ title: msg, icon: 'none', duration: 3000 })
				}
			} finally {
				this.creating = false
			}
		},
		closeShare() {
			this.sharePopup = false
		},
		goDetail() {
			this.sharePopup = false
			const thumbParam = this.imagePath ? encodeURIComponent(this.imagePath) : ''
			const timeParam = encodeURIComponent(this.createdAt)
			uni.navigateTo({
				url: `/pages/record-detail/record-detail?id=${this.createdId || 'preview'}&thumbUrl=${thumbParam}&createdAt=${timeParam}`
			})
		},
		shareTimeline() {
			this.sharePopup = false
			const thumbParam = this.imagePath ? encodeURIComponent(this.imagePath) : ''
			uni.navigateTo({
				url: `/pages/share-moments/share-moments?id=${this.createdId || 'preview'}&thumbUrl=${thumbParam}`
			})
		},
		_formatNow() {
			return formatTime(new Date())
		},
		getSwitchChecked(item) {
			return this.form[item.key]
		},
		onSwitch(item, event) {
			const key = item.key
			this.form[key] = event.detail.value
			this.formDirty = true
			if (key === 'shareBlockFlag') this.updateShareMenuState()
		},
		onAdSwitch(event) {
			this.form.adEnabled = event.detail.value
			this.formDirty = true
		},
		setMode(mode, fromUser = false) {
			if (fromUser) this.formDirty = true
			this.form.mode = mode
			this.publishAdWatched = false
			const prefix = mode === 'private' ? 'private' : 'entertainment'
			const defaults = mode === 'private'
				? { origin: '0', screen: '1', shareBlock: '1', ad: '0' }
				: { origin: '1', screen: '1', shareBlock: '0', ad: '1' }
			this.form.originFlag = (this.modeConfig[`${prefix}_origin_enabled`] || defaults.origin) === '1'
			this.form.screenFlag = (this.modeConfig[`${prefix}_screen_enabled`] || defaults.screen) === '1'
			this.form.deviceBlockFlag = (this.modeConfig[`${prefix}_device_block_enabled`] || '0') === '1'
			this.form.shareBlockFlag = (this.modeConfig[`${prefix}_share_block_enabled`] || defaults.shareBlock) === '1'
			this.form.adEnabled = (this.modeConfig[`${prefix}_ad_enabled`] || defaults.ad) === '1'
			this.updateShareMenuState()
		},
		ensurePublishAdWatched() {
			if (!this.adUnitId) {
				uni.showModal({
					title: '无法发布',
					content: '保密模式需要先观看广告，但当前广告位未配置',
					showCancel: false,
					confirmText: '我知道了'
				})
				const error = new Error('广告位未配置')
				error.silent = true
				return Promise.reject(error)
			}
			return getPrivateUploadAdStatus().then((res) => {
				const status = res.data || res
				if (!status.needAd) {
					this.publishAdWatched = true
					return
				}
				return new Promise((resolve, reject) => {
				uni.showModal({
					title: '保密模式',
					content: `本次发布只需观看 1 次广告。今日已完成 ${status.watched || 0}/${status.dailyLimit || 3} 次，达到后当天可无限上传。`,
					showCancel: true,
					cancelText: '取消',
					confirmText: '去观看',
					success: async (res) => {
						if (!res.confirm) {
							const error = new Error('用户取消广告')
							error.silent = true
							reject(error)
							return
						}
						try {
							await this.showRewardedAd()
							await recordPrivateUploadAd()
							this.publishAdWatched = true
							resolve()
						} catch (error) {
							reject(error)
						}
					},
					fail: reject
				})
			})
			})
		},
		showRewardedAd() {
			return new Promise((resolve, reject) => {
				// #ifdef MP-WEIXIN
				const ad = wx.createRewardedVideoAd({ adUnitId: this.adUnitId })
				ad.onClose((res) => {
					if (res && res.isEnded) {
						resolve()
					} else {
						const error = new Error('请观看完整广告才能发布')
						error.toastShown = true
						uni.showToast({ title: '请观看完整广告才能发布', icon: 'none', duration: 3000 })
						reject(error)
					}
				})
				ad.onError((error) => {
					uni.showToast({ title: '广告加载失败，请稍后再试', icon: 'none', duration: 3000 })
					error.toastShown = true
					reject(error)
				})
				ad.load().then(() => ad.show()).catch((error) => {
					uni.showToast({ title: '广告展示失败', icon: 'none', duration: 3000 })
					error.toastShown = true
					reject(error)
				})
				// #endif
				// #ifndef MP-WEIXIN
				const error = new Error('当前环境不支持广告')
				uni.showToast({ title: '当前环境不支持广告', icon: 'none', duration: 3000 })
				error.toastShown = true
				reject(error)
				// #endif
			})
		},
		showCountPicker() {
			const list = ['1次', '2次', '3次', '5次', '10次']
			uni.showActionSheet({
				itemList: list,
				success: (res) => {
					this.form.maxNum = parseInt(list[res.tapIndex], 10)
					this.formDirty = true
				}
			})
		},
		showSecondPicker() {
			const list = ['3秒', '5秒', '10秒', '15秒', '30秒']
			uni.showActionSheet({
				itemList: list,
				success: (res) => {
					this.form.maxSec = parseInt(list[res.tapIndex], 10)
					this.formDirty = true
				}
			})
		},
		go(url) {
			uni.redirectTo({ url })
		}
	},
	onShareAppMessage() {
		if (this.createdId && this.createdId !== 'preview') {
			recordShare(this.createdId).catch(() => {})
		}
		this.updateShareMenuState()
		return {
			title: this.shareTitle,
			path: `/pages/viewer/viewer?id=${this.createdId || 'preview'}`,
			imageUrl: this.createdShareImage || ''
		}
	}
}
</script>

<style scoped>
.create-page {
	background: #f5f6f8;
	padding-left: 0;
	padding-right: 0;
	padding-bottom: 150rpx;
	padding-bottom: calc(150rpx + constant(safe-area-inset-bottom));
	padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.create-page .app-nav {
	height: calc(var(--status-bar-height) + 96rpx);
	padding-top: calc(var(--status-bar-height) + 28rpx);
}

.pick-card {
	margin: 0 24rpx 20rpx;
	padding: 28rpx;
	border: 1rpx solid #e8eaf0;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

.pick-inner {
	min-height: 220rpx;
	border-radius: 16rpx;
	border: 2rpx dashed #d7dce5;
	background: #fafbfc;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

.pick-inner.has-image {
	min-height: 0;
	border: 0;
	background: #f3f4f6;
}

.preview-img {
	width: 100%;
	height: 220rpx;
	display: block;
	border-radius: 14rpx;
}

.pick-btn {
	width: 174rpx;
	height: 70rpx;
	border-radius: 14rpx;
	background: #2f7bff;
	color: #fff;
	font-size: 30rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 18rpx rgba(47, 123, 255, 0.22);
	animation: pickPulse 1.6s ease-in-out infinite;
}

.pick-tip {
	margin-top: 26rpx;
	color: #8f939d;
	font-size: 26rpx;
	line-height: 36rpx;
}

.mode-card {
	margin: 0 24rpx 20rpx;
	padding: 16rpx;
	border: 1rpx solid #e8eaf0;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

.mode-tabs {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16rpx;
}

.mode-tab {
	min-height: 112rpx;
	padding: 20rpx 24rpx;
	border-radius: 20rpx;
	background: #fafbfc;
	border: 1rpx solid #e1e5ec;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.mode-tab.active {
	background: #eef5ff;
	border-color: #9ec3ff;
}

.mode-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #111;
	line-height: 40rpx;
}

.mode-tab.active .mode-title {
	color: #2f7bff;
}

.mode-sub {
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 32rpx;
	color: #7f8794;
}

.mode-tab.active .mode-sub {
	color: #7f8794;
}

.setting-card {
	margin: 0 24rpx 20rpx;
	padding: 4rpx 28rpx;
	border: 1rpx solid #e8eaf0;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

.setting-row {
	min-height: 136rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eef0f4;
}

.setting-row:last-child {
	border-bottom: 0;
}

.ui-switch {
	transform: scale(0.88);
	transform-origin: right center;
	flex-shrink: 0;
}

.setting-copy {
	flex: 1;
	min-width: 0;
}

.setting-title {
	display: block;
	font-size: 30rpx;
	color: #111;
	font-weight: 600;
	line-height: 40rpx;
}

.setting-sub {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #7f8794;
	line-height: 32rpx;
}

.option-card {
	margin: 0 24rpx 20rpx;
	padding: 0 28rpx;
	border: 1rpx solid #e8eaf0;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

.option-row {
	min-height: 116rpx;
	padding: 20rpx 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
	border-bottom: 1rpx solid #eef0f4;
}

.option-row:last-child {
	border-bottom: 0;
}

.option-value {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	min-width: 72rpx;
	font-size: 30rpx;
	color: #111;
	font-weight: 700;
	line-height: 40rpx;
	flex-shrink: 0;
}

.action-bar {
	position: relative;
	z-index: 1;
	margin: 4rpx 24rpx 34rpx;
	display: grid;
	grid-template-columns: 122rpx 122rpx 1fr;
	gap: 24rpx;
	padding: 0;
	background: transparent;
}

@keyframes pickPulse {
	0% {
		transform: scale(1);
		box-shadow: 0 8rpx 18rpx rgba(47, 123, 255, 0.22);
	}
	50% {
		transform: scale(1.06);
		box-shadow: 0 12rpx 24rpx rgba(47, 123, 255, 0.32);
	}
	100% {
		transform: scale(1);
		box-shadow: 0 8rpx 18rpx rgba(47, 123, 255, 0.22);
	}
}

.action-btn {
	height: 72rpx;
	border-radius: 14rpx;
	font-size: 26rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	border: 1rpx solid #e8eaf0;
}

.clear {
	color: #ff7878;
}

.change {
	color: #f6b85b;
}

.create {
	color: #fff;
	background: #2f7bff;
	font-weight: 700;
	border-color: #2f7bff;
}

.share-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 99;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
}

.share-panel {
	width: 540rpx;
	border-radius: 18rpx;
	background: #f7f8fa;
	overflow: hidden;
}

.share-card {
	margin: 28rpx auto 0;
	width: 390rpx;
	background: #fff;
	border: 1px solid #eceef3;
	border-radius: 4rpx;
	padding: 18rpx;
}

.share-head {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.share-logo {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	background: #ffdb1f;
	color: #111;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18rpx;
	font-weight: 800;
}

.share-name {
	font-size: 22rpx;
	color: #8f939d;
}

.share-text {
	display: block;
	margin-top: 16rpx;
	font-size: 24rpx;
	color: #111;
}

.share-img-wrap {
	margin-top: 16rpx;
	height: 250rpx;
	position: relative;
	overflow: hidden;
	background: #f3f3f4;
}

.share-img {
	width: 100%;
	height: 100%;
	filter: blur(12rpx);
	transform: scale(1.08);
}

.share-blur {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	backdrop-filter: blur(6rpx);
}

.share-foot {
	margin-top: 14rpx;
	padding-top: 10rpx;
	border-top: 1px solid #eceef3;
	color: #8d72ff;
	font-size: 20rpx;
}

.share-actions {
	margin-top: 24rpx;
	background: #fff;
	padding: 18rpx;
	display: grid;
	grid-template-columns: 1fr;
	gap: 14rpx;
}

.share-action {
	height: 72rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	background: #f2f3f5;
	color: #111;
}

.share-action.primary {
	background: #2f7bff;
	color: #fff;
}

.share-action.cancel {
	color: #8f939d;
}

</style>
