<template>
	<view class="app-page detail-page">
		<view class="app-nav">
			<view class="nav-back" @click="back"></view>
			<text class="app-title">查看记录</text>
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

		<view class="card stat-card">
			<view class="stat-left">
				<view class="section-title"><text class="blue-line"></text>累计查看<text class="blue">{{ viewCount }}</text>次</view>
				<view class="rule-line">闪图规则：<text>查看1次后，可看广告继续看</text></view>
				<view class="time-line">创建时间：{{ createdAt }}</view>
			</view>
			<view class="stat-thumb-wrap" v-if="thumbUrl">
				<image class="stat-thumb" :src="thumbUrl" mode="aspectFill"></image>
				<view class="stat-thumb-blur"></view>
			</view>
		</view>

		<view class="detail-actions">
			<button class="small-btn danger" @click="deleteFlash">删除</button>
			<button class="small-btn warn" @click="revokeFlash">撤回</button>
			<button class="green-btn" open-type="share">发好友</button>
			<button class="green-btn" @click="shareTimeline">发朋友圈</button>
		</view>

		<view class="card table-card">
			<view class="table-title"><text class="blue-line"></text>查看记录（{{ recordTotal }}次）</view>
			<view v-if="records.length === 0" class="rec-empty">暂无查看记录</view>
			<view v-else>
				<view class="table-head">
					<text>风险</text>
					<text>查看者</text>
					<text>时长</text>
					<text>时间</text>
				</view>
				<view
					v-for="row in records"
					:key="row.id"
					class="table-row"
				>
					<text :class="row.screenFlag === '1' ? 'tag-danger' : 'tag-safe'">{{ captureLabel(row) }}</text>
					<text class="rec-user">{{ viewerLabel(row) }}</text>
					<text>{{ row.viewSec }}秒</text>
					<text class="rec-time">{{ formatShort(row.screenAt || row.createdAt) }}</text>
					<text v-if="row.screenFlag === '1'" class="rec-device">{{ row.deviceInfo || '未知设备' }}</text>
				</view>
			</view>
		</view>

		<!-- 删除确认弹窗 -->
		<view v-if="showDeleteDialog" class="dialog-mask" @click.stop>
			<view class="dialog-box">
				<text class="dialog-title">温馨提示</text>
				<text class="dialog-msg">确定删除当前闪图吗？</text>
				<view class="dialog-actions">
					<button class="dialog-btn cancel-btn" @click="showDeleteDialog = false">取消</button>
					<button class="dialog-btn confirm-btn" @click="confirmDelete">删除</button>
				</view>
			</view>
		</view>

		<!-- 撤回确认弹窗 -->
		<view v-if="showRevokeDialog" class="dialog-mask" @click.stop>
			<view class="dialog-box">
				<text class="dialog-title">温馨提示</text>
				<text class="dialog-msg">确定要撤回当前闪图吗，如果有用户正在查看，也将提示并撤回？</text>
				<view class="dialog-actions">
					<button class="dialog-btn cancel-btn" @click="showRevokeDialog = false">取消</button>
					<button class="dialog-btn confirm-btn" @click="confirmRevoke">撤回</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getFlashDetail, getFlashRecords, deleteFlash, revokeFlash, recordShare, getPublicConfig } from '../../utils/api'
import { getBaseUrl } from '../../utils/config'
import { formatTime as fmtTime, formatShort, resolveFileUrl } from '../../utils/format'
export default {
	data() {
		return {
			id: '',
			thumbUrl: '',
			createdAt: '',
			viewCount: 0,
			flash: null,
			records: [],
			recordTotal: 0,
			shareTitle: '对方发送了1张照片，点击查看~',
			showDeleteDialog: false,
			showRevokeDialog: false,
			_screenListener: null,
			_recordListener: null
		}
	},
	onLoad(options) {
		this.enableCaptureProtection()
		this.id = options.id || ''
		this.thumbUrl = options.thumbUrl ? decodeURIComponent(options.thumbUrl) : ''
		if (options.createdAt) {
			this.createdAt = decodeURIComponent(options.createdAt)
		}
		if (this.id && !this.id.startsWith('flash_') && this.id !== 'preview') {
			this.loadDetail()
			this.loadRecords()
		}
		this.loadConfig()
	},
	onUnload() {
		this.disableCaptureProtection()
	},
	onHide() {
		this.disableCaptureProtection()
	},
	onShow() {
		this.enableCaptureProtection()
		this.updateShareMenuState()
	},
	methods: {
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
				if (this.flash && this.flash.shareBlockFlag === '1' && this.flash.activityId) {
					opts.isPrivateMessage = true
					opts.activityId = this.flash.activityId
				}
				wx.updateShareMenu({
					...opts
				})
			}
			// #endif
		},
		enableCaptureProtection() {
			// #ifdef MP-WEIXIN
			if (wx.setVisualEffectOnCapture) {
				wx.setVisualEffectOnCapture({ visualEffect: 'hidden' })
			}
			if (!this._screenListener) {
				this._screenListener = () => {
					uni.showToast({ title: '当前页面禁止截屏', icon: 'none' })
				}
				wx.onUserCaptureScreen(this._screenListener)
			}
			if (!this._recordListener && wx.onScreenRecordingStateChanged) {
				this._recordListener = (res) => {
					if (res.state === 'on') {
						uni.showToast({ title: '当前页面禁止录屏', icon: 'none' })
					}
				}
				wx.onScreenRecordingStateChanged(this._recordListener)
			}
			// #endif
		},
		disableCaptureProtection() {
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
				wx.setVisualEffectOnCapture({ visualEffect: 'none' })
			}
			// #endif
		},
		async loadConfig() {
			try {
				const res = await getPublicConfig()
				const cfg = res.data || res
				this.shareTitle = cfg.share_title || this.shareTitle
			} catch (e) {}
		},
		async loadDetail() {
			try {
				const res = await getFlashDetail(this.id)
				const flash = res.data || res
				this.flash = flash
				this.updateShareMenuState()
				this.viewCount = flash.viewCount || 0
				if (flash.createdAt) this.createdAt = this.formatTime(flash.createdAt)
				const shareImage = flash.fileShare || flash.fileThumb
				if (shareImage && shareImage !== flash.filePath) {
					this.thumbUrl = resolveFileUrl(shareImage, getBaseUrl())
				}
			} catch (e) {}
		},
		async loadRecords() {
			try {
				const res = await getFlashRecords(this.id)
				const { list, total } = res.data || res
				this.records = list
				this.recordTotal = total
			} catch (e) {}
		},
		captureLabel(row) {
			if (row.screenFlag !== '1') return '无'
			return row.screenType === 'record' ? '录屏' : '截图'
		},
		viewerLabel(row) {
			const user = row.user || {}
			if (user.nickname) return user.nickname
			if (user.openid) return `用户${user.openid.slice(-6)}`
			return row.userId ? `用户${row.userId.slice(-6)}` : '未知用户'
		},
		back() {
			uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/create/create' }) })
		},
		deleteFlash() { this.showDeleteDialog = true },
		async confirmDelete() {
			this.showDeleteDialog = false
			try {
				await deleteFlash(this.id)
				uni.showToast({ title: '已删除', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 1200)
			} catch (e) {}
		},
		revokeFlash() { this.showRevokeDialog = true },
		async confirmRevoke() {
			this.showRevokeDialog = false
			try {
				await revokeFlash(this.id)
				uni.showToast({ title: '已撤回', icon: 'success' })
				if (this.flash) this.flash.status = 'revoked'
			} catch (e) {}
		},
		shareTimeline() {
			const thumbParam = this.thumbUrl ? encodeURIComponent(this.thumbUrl) : ''
			uni.navigateTo({
				url: `/pages/share-moments/share-moments?id=${this.id}&thumbUrl=${thumbParam}`
			})
		},
		formatTime(t) {
			return fmtTime(t)
		},
		formatShort(t) {
			return formatShort(t)
		}
	},
	onShareAppMessage() {
		if (this.id && this.id !== 'preview') {
			recordShare(this.id).catch(() => {})
		}
		this.updateShareMenuState()
		const shareImage = this.flash && (this.flash.fileShare || this.flash.fileThumb) && (this.flash.fileShare || this.flash.fileThumb) !== this.flash.filePath
			? resolveFileUrl(this.flash.fileShare || this.flash.fileThumb, getBaseUrl())
			: this.thumbUrl
		return {
			title: this.shareTitle,
			path: `/pages/viewer/viewer?id=${this.id}`,
			imageUrl: shareImage || undefined
		}
	}
}
</script>

<style scoped>
.detail-page {
	background: #f5f6f8;
}

.stat-card {
	padding: 28rpx 24rpx;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16rpx;
}

.stat-left {
	min-width: 0;
	flex: 1;
}

.section-title,
.table-title {
	display: flex;
	align-items: center;
	font-size: 30rpx;
	font-weight: 700;
}

.blue-line {
	width: 8rpx;
	height: 36rpx;
	border-radius: 8rpx;
	background: #2f7bff;
	margin-right: 14rpx;
	flex-shrink: 0;
}

.blue {
	color: #2f7bff;
	margin: 0 4rpx;
}

.rule-line,
.time-line {
	margin-top: 12rpx;
	color: #8c95a6;
	font-size: 24rpx;
}

.rule-line text {
	padding: 2rpx 10rpx;
	background: #eef1f5;
	border-radius: 6rpx;
	font-size: 22rpx;
}

.stat-thumb-wrap {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	overflow: hidden;
	position: relative;
	flex-shrink: 0;
}

.stat-thumb {
	width: 100%;
	height: 100%;
	filter: blur(6rpx);
	transform: scale(1.1);
}

.stat-thumb-blur {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
}

.detail-actions {
	margin-top: 18rpx;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr;
	gap: 16rpx;
}

.small-btn,
.green-btn {
	height: 68rpx;
	border-radius: 34rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	background: #fff;
	border: 1rpx solid #e5e7ec;
}

.danger {
	color: #ff6161;
	border-color: rgba(255, 97, 97, 0.3);
}

.warn {
	color: #ffa329;
	border-color: rgba(255, 163, 41, 0.3);
}

.green-btn {
	background: #49c72a;
	color: #fff;
	border: none;
	font-weight: 500;
}

.table-card {
	margin-top: 18rpx;
	min-height: 320rpx;
	padding-top: 24rpx;
	overflow: hidden;
}

.table-title {
	padding: 0 24rpx 20rpx;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 90rpx;
}

.empty-illustration {
	width: 260rpx;
	height: 190rpx;
	position: relative;
	transform: scale(0.92);
}

.paper {
	position: absolute;
	left: 92rpx;
	top: 48rpx;
	width: 96rpx;
	height: 104rpx;
	border-radius: 18rpx;
	background: linear-gradient(145deg, #c7d3ff, #aebbf6);
	box-shadow: 0 14rpx 28rpx rgba(142, 155, 218, 0.28);
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	padding: 28rpx 18rpx 0 30rpx;
}

.paper text {
	height: 8rpx;
	border-radius: 8rpx;
	background: #fff;
}

.paper text:nth-child(1) { width: 44rpx; }
.paper text:nth-child(2) { width: 58rpx; }
.paper text:nth-child(3) { width: 50rpx; }

.cloud {
	position: absolute;
	border-radius: 40rpx;
	background: linear-gradient(180deg, #dbe3ff, #f4f6ff);
}

.cloud-left {
	left: 24rpx;
	top: 78rpx;
	width: 76rpx;
	height: 26rpx;
}

.cloud-left::before,
.cloud-right::before {
	content: "";
	position: absolute;
	border-radius: 50%;
	background: #cbd6ff;
}

.cloud-left::before {
	left: 18rpx;
	top: -18rpx;
	width: 38rpx;
	height: 38rpx;
}

.cloud-right {
	right: 20rpx;
	top: 62rpx;
	width: 82rpx;
	height: 28rpx;
}

.cloud-right::before {
	left: 22rpx;
	top: -22rpx;
	width: 44rpx;
	height: 44rpx;
}

.shadow {
	position: absolute;
	left: 44rpx;
	bottom: 0;
	width: 180rpx;
	height: 42rpx;
	border-radius: 50%;
	background: linear-gradient(180deg, rgba(198, 207, 247, 0.28), rgba(198, 207, 247, 0));
}

.empty-text {
	color: #bec4d0;
	font-size: 26rpx;
}

.dialog-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	z-index: 100;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 60rpx;
}

.dialog-box {
	width: 100%;
	background: #fff;
	border-radius: 22rpx;
	padding: 48rpx 40rpx 36rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.dialog-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #111;
	margin-bottom: 24rpx;
}

.dialog-msg {
	font-size: 28rpx;
	color: #444;
	text-align: center;
	line-height: 46rpx;
	margin-bottom: 48rpx;
}

.dialog-actions {
	width: 100%;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 24rpx;
}

.dialog-btn {
	height: 76rpx;
	border-radius: 14rpx;
	font-size: 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.cancel-btn {
	background: #f2f3f5;
	color: #555;
}

.confirm-btn {
	background: #49c72a;
	color: #fff;
}

.table-head {
	display: grid;
	grid-template-columns: 88rpx 1fr 96rpx 180rpx;
	column-gap: 12rpx;
	padding: 16rpx 22rpx;
	border-bottom: 1rpx solid #edf0f5;
	font-size: 24rpx;
	color: #b8bdc9;
}

.table-row {
	display: grid;
	grid-template-columns: 88rpx 1fr 96rpx 180rpx;
	column-gap: 12rpx;
	align-items: center;
	padding: 18rpx 22rpx;
	border-bottom: 1rpx solid #f5f5f5;
	font-size: 26rpx;
	align-items: center;
}

.tag-danger {
	color: #ff4d4f;
	font-size: 24rpx;
}

.tag-safe {
	color: #52c41a;
	font-size: 24rpx;
}

.rec-time {
	color: #b8bdc9;
	font-size: 24rpx;
}

.rec-user {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.rec-device {
	grid-column: 1 / -1;
	margin-top: 8rpx;
	color: #9aa1ad;
	font-size: 22rpx;
	line-height: 1.45;
	word-break: break-all;
}

.rec-empty {
	padding: 60rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: #b8bdc9;
}
</style>
