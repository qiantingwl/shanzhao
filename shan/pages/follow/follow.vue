<template>
	<view class="app-page follow-page">
		<view class="app-nav">
			<view class="nav-back" @click="back"></view>
			<text class="app-title">关注我们</text>
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

		<view class="card follow-card">
			<view class="brand-logo">闪</view>
			<text class="title">{{ appName }}</text>
			<text class="desc">{{ followDesc }}</text>
			<view class="qr-box">
				<image v-if="followQrcode" class="qr-image" :src="followQrcode" mode="aspectFit"></image>
				<block v-else>
					<view class="qr-grid" v-for="n in 25" :key="n" :class="{ dark: n % 2 === 0 || n === 7 || n === 19 }"></view>
				</block>
			</view>
			<text class="hint">{{ followQrcode ? '长按识别二维码' : '公众号二维码位置预留' }}</text>
		</view>

		<view class="card info-card">
			<view class="info-row">
				<text>公众号</text>
				<text>{{ followAccount }}</text>
			</view>
			<view class="info-row">
				<text>服务时间</text>
				<text>{{ serviceTime }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getPublicConfig } from '../../utils/api'

export default {
	data() {
		return {
			appName: '闪照相机',
			followDesc: '关注公众号后可接收查看提醒、产品更新和客服通知。',
			followQrcode: '',
			followAccount: '闪照相机',
			serviceTime: '09:00 - 22:00'
		}
	},
	onLoad() {
		this.loadConfig()
	},
	methods: {
		async loadConfig() {
			try {
				const res = await getPublicConfig()
				const cfg = res.data || res
				this.appName = cfg.app_name || this.appName
				this.followDesc = cfg.follow_desc || this.followDesc
				this.followQrcode = cfg.follow_qrcode || ''
				this.followAccount = cfg.follow_account || this.followAccount
				this.serviceTime = cfg.service_time || this.serviceTime
			} catch (e) {}
		},
		back() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.follow-card {
	margin-top: 12rpx;
	padding: 42rpx 28rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.brand-logo {
	width: 118rpx;
	height: 118rpx;
	border-radius: 50%;
	background: #ffdf22;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 46rpx;
	font-weight: 800;
	color: #111;
}

.title {
	margin-top: 24rpx;
	font-size: 34rpx;
	font-weight: 700;
}

.desc {
	margin-top: 14rpx;
	width: 520rpx;
	text-align: center;
	font-size: 26rpx;
	line-height: 40rpx;
	color: #8e95a3;
}

.qr-box {
	margin-top: 34rpx;
	width: 260rpx;
	height: 260rpx;
	padding: 24rpx;
	background: #fff;
	border: 1px solid #edf0f5;
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 10rpx;
}

.qr-image {
	width: 100%;
	height: 100%;
}

.qr-grid {
	border-radius: 4rpx;
	background: #eef1f5;
}

.qr-grid.dark {
	background: #111;
}

.hint {
	margin-top: 18rpx;
	font-size: 24rpx;
	color: #b8bdc9;
}

.info-card {
	margin-top: 24rpx;
	padding-left: 24rpx;
}

.info-row {
	height: 88rpx;
	padding-right: 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1px solid #edf0f5;
	font-size: 28rpx;
	color: #111;
}

.info-row:last-child {
	border-bottom: 0;
}

.info-row text:last-child {
	color: #8e95a3;
}
</style>
