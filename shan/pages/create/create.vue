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
			<view class="pick-inner" @click="chooseImage">
				<image v-if="imagePath" class="preview-img" :src="imagePath" mode="aspectFill"></image>
				<template v-else>
					<button class="pick-btn">选择图片</button>
					<text class="pick-tip">可以选择拍照/相册/聊天记录图片~</text>
				</template>
			</view>
		</view>

		<view class="card setting-card">
			<view class="setting-row" v-for="item in switches" :key="item.key">
				<view class="setting-copy">
					<text class="setting-title">{{ item.title }}</text>
					<text class="setting-sub">{{ item.sub }}</text>
				</view>
				<switch color="#2f7bff" :checked="form[item.key]" @change="onSwitch(item.key, $event)" />
			</view>
		</view>

		<view v-if="adCardVisible" class="card ad-card">
			<view class="ad-copy">
				<text class="setting-title">允许广告解锁</text>
				<text class="setting-sub">查看者次数用完后，可观看广告获得1次额外次数</text>
			</view>
			<switch color="#2f7bff" :checked="form.adEnabled" @change="onAdSwitch" />
		</view>

		<view class="option-card">
			<view class="card option-row" @click="showCountPicker">
				<view>
					<text class="setting-title">查看次数</text>
					<text class="setting-sub">设置每人最多可查看的次数</text>
				</view>
				<view class="option-value">
					<text>{{ form.maxNum }}次</text>
					<text class="chevron">›</text>
				</view>
			</view>
			<view class="card option-row" @click="showSecondPicker">
				<view>
					<text class="setting-title">查看时长</text>
					<text class="setting-sub">设置每次最多可查看多少秒</text>
				</view>
				<view class="option-value">
					<text>{{ form.maxSec }}秒</text>
					<text class="chevron">›</text>
				</view>
			</view>
		</view>

		<view class="action-bar" v-if="imagePath">
			<button class="action-btn clear" @click="clearImage">清空</button>
			<button class="action-btn change" @click="chooseImage">更换</button>
			<button class="action-btn create" @click="createFlash">创建闪图</button>
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
import { uploadImage, createFlash, getPublicConfig, recordShare } from '../../utils/api'
import { BASE_URL } from '../../utils/config'
import { formatTime, resolveFileUrl } from '../../utils/format'
export default {
	data() {
		return {
			imagePath: '',
			sharePopup: false,
			createdId: '',
			createdAt: '',
			createdShareImage: '',
			creating: false,
			adCardVisible: false,
			shareTitle: '对方发送了1张照片，点击查看~',
			fileOrigin: '1',
			form: {
				originFlag: true,
				screenFlag: true,
				shareFlag: true,
				adEnabled: true,
				maxNum: 1,
				maxSec: 3
			},
			switches: [
				{ key: 'originFlag', title: '开放来源', sub: '可查看图片来自拍照、相册还是聊天记录' },
				{ key: 'screenFlag', title: '禁止截屏', sub: '安卓禁止截屏，苹果将提示并标记' },
				{ key: 'shareFlag', title: '允许转发', sub: '允许好友转发此闪图，关闭后将无法转发' }
			]
		}
	},
	onShow() {
		getPublicConfig().then(res => {
			const cfg = res.data || res
			this.adCardVisible = cfg.ad_unlock_enabled === '1'
			this.shareTitle = cfg.share_title || this.shareTitle
		}).catch(() => {})
	},
	methods: {
		chooseImage() {
			uni.showActionSheet({
				itemList: ['从相册选择', '拍照'],
				success: ({ tapIndex }) => {
					const sourceType = tapIndex === 1 ? ['camera'] : ['album']
					this.fileOrigin = tapIndex === 1 ? '0' : '1'
					uni.chooseImage({
						count: 1,
						sourceType,
						success: (res) => {
							this.imagePath = res.tempFilePaths[0]
						}
					})
				}
			})
		},
		clearImage() {
			this.imagePath = ''
			this.sharePopup = false
		},
		async createFlash() {
			if (!this.imagePath) {
				uni.showToast({ title: '请先选择图片', icon: 'none' })
				return
			}
			if (!uni.getStorageSync('token')) {
				uni.showToast({ title: '请先登录', icon: 'none' })
				uni.redirectTo({ url: '/pages/profile/profile' })
				return
			}
			if (this.creating) return
			this.creating = true
			uni.showLoading({ title: '正在审核图片…' })
			try {
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
					originFlag: this.form.originFlag ? '1' : '0',
					screenFlag: this.form.screenFlag ? '1' : '0',
					shareFlag: this.form.shareFlag ? '1' : '0',
					adFlag: this.form.adEnabled ? '1' : '0',
					maxNum: this.form.maxNum,
					maxSec: this.form.maxSec
				})
				const flash = flashRes.data || flashRes
				this.createdId = flash.id
				this.createdAt = flash.createdAt || this._formatNow()
				this.createdShareImage = resolveFileUrl(fileShare, BASE_URL)
				uni.hideLoading()
				this.sharePopup = true
			} catch (e) {
				uni.hideLoading()
				if (!e || !e.toastShown) {
					const msg = e && e.message ? e.message : '创建失败，请重试'
					uni.showToast({ title: msg, icon: 'none' })
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
		_formatNow() {
			return formatTime(new Date())
		},
		onSwitch(key, event) {
			this.form[key] = event.detail.value
		},
		onAdSwitch(event) {
			this.form.adEnabled = event.detail.value
		},
		showCountPicker() {
			const list = ['1次', '2次', '3次', '5次', '10次']
			uni.showActionSheet({
				itemList: list,
				success: (res) => {
					this.form.maxNum = parseInt(list[res.tapIndex], 10)
				}
			})
		},
		showSecondPicker() {
			const list = ['3秒', '5秒', '10秒', '15秒', '30秒']
			uni.showActionSheet({
				itemList: list,
				success: (res) => {
					this.form.maxSec = parseInt(list[res.tapIndex], 10)
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
}

.pick-card {
	padding: 24rpx;
}

.pick-inner {
	height: 252rpx;
	border-radius: 16rpx;
	background: #f3f3f4;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

.preview-img {
	width: 100%;
	height: 100%;
}

.pick-btn {
	width: 164rpx;
	height: 72rpx;
	border-radius: 12rpx;
	background: #2f7bff;
	color: #fff;
	font-size: 32rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: pickPulse 1.45s ease-in-out infinite;
	box-shadow: 0 8rpx 18rpx rgba(47, 123, 255, 0.22);
}

.pick-tip {
	margin-top: 34rpx;
	color: #8f939d;
	font-size: 27rpx;
}

.setting-card {
	margin-top: 18rpx;
	padding: 20rpx 24rpx;
}

.setting-row {
	min-height: 108rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.setting-copy {
	flex: 1;
	min-width: 0;
}

.setting-title {
	display: block;
	font-size: 31rpx;
	color: #1a1a1a;
	font-weight: 500;
	line-height: 44rpx;
}

.setting-sub {
	display: block;
	margin-top: 4rpx;
	font-size: 24rpx;
	color: #999;
	line-height: 34rpx;
}

.ad-card {
	margin-top: 18rpx;
	min-height: 108rpx;
	padding: 18rpx 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	overflow: hidden;
	gap: 14rpx;
}

.ad-card.disabled .setting-title,
.ad-card.disabled .setting-sub {
	color: #d0d3db;
}

.ad-copy {
	width: 278rpx;
	flex-shrink: 0;
}

.ad-actions {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 12rpx;
}

.ad-btn {
	width: 238rpx;
	height: 58rpx;
	border: 1px solid #2f7bff;
	border-radius: 30rpx;
	color: #2f7bff;
	font-size: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	flex-shrink: 0;
	background: rgba(47, 123, 255, 0.04);
	animation: adGlow 1.8s ease-in-out infinite;
}

.option-card {
	margin-top: 18rpx;
	background: transparent;
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}

.option-row {
	min-height: 108rpx;
	padding: 0 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.option-value {
	display: flex;
	align-items: center;
	font-size: 32rpx;
	color: #111;
}

.chevron {
	margin-left: 6rpx;
	font-size: 40rpx;
	line-height: 40rpx;
	color: #c4c8d1;
}

.action-bar {
	margin-top: 18rpx;
	display: grid;
	grid-template-columns: 122rpx 122rpx 1fr;
	gap: 24rpx;
}

@keyframes pickPulse {
	0% {
		transform: scale(1);
		box-shadow: 0 8rpx 18rpx rgba(47, 123, 255, 0.22);
	}
	45% {
		transform: scale(1.08);
		box-shadow: 0 12rpx 26rpx rgba(47, 123, 255, 0.32);
	}
	100% {
		transform: scale(1);
		box-shadow: 0 8rpx 18rpx rgba(47, 123, 255, 0.22);
	}
}

.lock-dot {
	width: 30rpx;
	height: 30rpx;
	border-radius: 50%;
	background: #2f7bff;
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18rpx;
	line-height: 30rpx;
}

@keyframes adGlow {
	0% {
		box-shadow: 0 0 0 rgba(47, 123, 255, 0);
	}
	50% {
		box-shadow: 0 0 18rpx rgba(47, 123, 255, 0.22);
	}
	100% {
		box-shadow: 0 0 0 rgba(47, 123, 255, 0);
	}
}

.action-btn {
	height: 68rpx;
	border-radius: 10rpx;
	font-size: 26rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
}

.clear {
	color: #ff7878;
}

.change {
	color: #f6b85b;
}

.create {
	color: #fff;
	background: linear-gradient(90deg, #39a5ff, #2f7bff);
	font-weight: 700;
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
