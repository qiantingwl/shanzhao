<template>
	<view class="app-page moments-page">
		<view class="app-nav">
			<view class="nav-back" @click="back"></view>
			<text class="app-title">发朋友圈</text>
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

		<view class="guide-header">
			<text class="guide-title">请按照以下步骤分享到朋友圈</text>
		</view>

		<view class="flash-preview-wrap">
			<view class="flash-card">
				<view class="flash-card-head">
					<view class="flash-logo">闪</view>
					<text class="flash-app-name">闪照相机</text>
				</view>
				<text class="flash-card-text">对方发送了1张照片，点击查看~</text>
				<view class="flash-img-area">
					<image v-if="thumbUrl" class="flash-thumb" :src="thumbUrl" mode="aspectFill"></image>
					<view v-else class="flash-thumb-placeholder"></view>
					<view class="flash-blur-mask"></view>
				</view>
				<view class="flash-card-foot">小程序</view>
			</view>
		</view>

		<view class="steps-wrap">
			<view class="step-row">
				<view class="step-num">1</view>
				<text class="step-text">点击右上角<text class="step-bold">三个点</text>图标</text>
				<view class="step-arrow">
					<view class="arrow-body"></view>
					<view class="arrow-head"></view>
				</view>
			</view>
			<view class="step-row">
				<view class="step-num">2</view>
				<text class="step-text">在弹出菜单中选择<text class="step-blue">"分享到朋友圈"</text></text>
			</view>
		</view>

		<button class="done-btn" @click="done">分享完成</button>

		<text class="footer-tip">好友点击分享链接即可查看你的闪图</text>
	</view>
</template>

<script>
export default {
	data() {
		return {
			flashId: '',
			thumbUrl: ''
		}
	},
	onLoad(options) {
		this.flashId = options.id || ''
		this.thumbUrl = options.thumbUrl ? decodeURIComponent(options.thumbUrl) : ''
	},
	methods: {
		back() {
			uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/create/create' }) })
		},
		done() {
			uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/create/create' }) })
		}
	}
}
</script>

<style scoped>
.moments-page {
	padding-bottom: 60rpx;
}

.guide-header {
	background: #eef4ff;
	padding: 26rpx 32rpx;
	margin-bottom: 28rpx;
}

.guide-title {
	font-size: 30rpx;
	color: #2f7bff;
	display: block;
	text-align: center;
}

.flash-preview-wrap {
	display: flex;
	justify-content: center;
	padding: 0 32rpx;
}

.flash-card {
	width: 390rpx;
	background: #fff;
	border: 1px solid #eceef3;
	border-radius: 4rpx;
	padding: 18rpx;
}

.flash-card-head {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.flash-logo {
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

.flash-app-name {
	font-size: 22rpx;
	color: #8f939d;
}

.flash-card-text {
	display: block;
	margin-top: 16rpx;
	font-size: 24rpx;
	color: #111;
}

.flash-img-area {
	margin-top: 16rpx;
	height: 250rpx;
	position: relative;
	overflow: hidden;
	background: #f3f3f4;
	border-radius: 4rpx;
}

.flash-thumb {
	width: 100%;
	height: 100%;
	filter: blur(12rpx);
	transform: scale(1.08);
}

.flash-thumb-placeholder {
	width: 100%;
	height: 100%;
	background: linear-gradient(145deg, #e8ecf6, #d4daed);
}

.flash-blur-mask {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
}

.flash-card-foot {
	margin-top: 14rpx;
	padding-top: 10rpx;
	border-top: 1px solid #eceef3;
	color: #8d72ff;
	font-size: 20rpx;
}

.steps-wrap {
	padding: 40rpx 42rpx 0;
	display: flex;
	flex-direction: column;
	gap: 36rpx;
}

.step-row {
	display: flex;
	align-items: center;
	gap: 22rpx;
	position: relative;
}

.step-num {
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	background: #2f7bff;
	color: #fff;
	font-size: 26rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.step-text {
	font-size: 30rpx;
	color: #222;
	line-height: 44rpx;
	flex: 1;
}

.step-bold {
	font-weight: 700;
	color: #111;
}

.step-blue {
	font-weight: 700;
	color: #2f7bff;
}

.step-arrow {
	position: absolute;
	right: -6rpx;
	top: -6rpx;
	display: flex;
	align-items: center;
}

.arrow-body {
	width: 48rpx;
	height: 6rpx;
	background: #2f7bff;
	transform: rotate(-45deg) translate(10rpx, -10rpx);
}

.step-arrow::after {
	content: "";
	position: absolute;
	right: 0;
	top: 0;
	width: 0;
	height: 0;
	border-left: 20rpx solid #2f7bff;
	border-top: 14rpx solid transparent;
	border-bottom: 14rpx solid transparent;
}

.done-btn {
	margin: 56rpx 32rpx 0;
	height: 90rpx;
	border-radius: 14rpx;
	background: #2f7bff;
	color: #fff;
	font-size: 32rpx;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
}

.footer-tip {
	display: block;
	margin-top: 28rpx;
	text-align: center;
	font-size: 24rpx;
	color: #b0b5c0;
}
</style>
