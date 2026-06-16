<template>
	<view class="app-page about-page">
		<view class="app-nav">
			<view class="nav-back" @click="back"></view>
			<text class="app-title">关于我们</text>
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

		<view class="brand">
			<view class="brand-logo">
				<text class="logo-i">i</text>
				<text class="logo-n">闪</text>
			</view>
			<text class="brand-name">{{ appName }}</text>
			<text class="brand-sub">{{ appSlogan }}</text>
		</view>

		<view class="card about-card">
			<view class="about-row" @click="goPage('/pages/agreement/agreement')">
				<view class="menu-left">
					<view class="about-icon orange">协</view>
					<text>用户协议</text>
				</view>
				<text class="arrow">›</text>
			</view>
			<view class="about-row" @click="goPage('/pages/privacy/privacy')">
				<view class="menu-left">
					<view class="about-icon blue">隐</view>
					<text>隐私政策</text>
				</view>
				<text class="arrow">›</text>
			</view>
			<view class="about-row">
				<view class="menu-left">
					<view class="about-icon gray">版</view>
					<text>版本号</text>
				</view>
				<text class="version">{{ appVersion }}</text>
			</view>
		</view>

		<view class="card intro-card">
			<text class="intro-title">产品介绍</text>
			<text class="intro-text">{{ aboutIntro }}</text>
		</view>

		<button class="logout" @click="doLogout">退出登录</button>
		<text class="copyright">{{ copyrightText }}</text>
	</view>
</template>

<script>
import { getPublicConfig } from '../../utils/api'

export default {
	data() {
		return {
			appName: '闪照相机',
			appSlogan: '安全防破解，一键撤回，一键分享',
			appVersion: 'v1.0.0',
			aboutIntro: '闪照相机用于创建限时查看图片，支持查看次数、查看时长、撤回、浏览记录等能力。',
			copyrightText: '免责声明：请勿上传违法违规内容，违规账号将被限制或封禁。'
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
				this.appSlogan = cfg.app_slogan || this.appSlogan
				this.appVersion = cfg.app_version || this.appVersion
				this.aboutIntro = cfg.about_intro || this.aboutIntro
				this.copyrightText = cfg.copyright_text || this.copyrightText
			} catch (e) {}
		},
		back() {
			uni.navigateBack()
		},
		goPage(url) {
			uni.navigateTo({ url })
		},
		doLogout() {
			uni.showModal({
				title: '提示',
				content: '确定退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('token')
						uni.removeStorageSync('userInfo')
						uni.showToast({ title: '已退出登录', icon: 'success' })
						setTimeout(() => {
							uni.redirectTo({ url: '/pages/create/create' })
						}, 800)
					}
				}
			})
		}
	}
}
</script>

<style scoped>
.brand {
	margin-top: 60rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.brand-logo {
	width: 138rpx;
	height: 138rpx;
	border-radius: 50%;
	background: #ffdf22;
	border: 10rpx solid #fff;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 900;
	box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.04);
}

.logo-i {
	position: absolute;
	left: 34rpx;
	top: 34rpx;
	font-size: 58rpx;
}

.logo-n {
	font-size: 40rpx;
	border: 8rpx solid #111;
	border-radius: 8rpx;
	padding: 4rpx 8rpx;
}

.brand-name {
	margin-top: 34rpx;
	font-size: 34rpx;
	font-weight: 800;
}

.brand-sub {
	margin-top: 20rpx;
	font-size: 26rpx;
	color: #bcc2ce;
}

.about-card {
	margin-top: 58rpx;
	padding-left: 24rpx;
}

.about-row {
	height: 86rpx;
	padding-right: 20rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1px solid #e5e7ec;
	font-size: 30rpx;
}

.about-row:last-child {
	border-bottom: 0;
}

.menu-left {
	display: flex;
	align-items: center;
}

.about-icon {
	width: 48rpx;
	height: 48rpx;
	border-radius: 10rpx;
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	font-size: 24rpx;
}

.orange { background: #ffb46d; }
.blue { background: #95adff; }
.gray { background: #d8dadd; }

.arrow {
	color: #c1c6cf;
	font-size: 62rpx;
	line-height: 40rpx;
	font-weight: 200;
}

.version {
	color: #b8bdc9;
	font-size: 28rpx;
}

.intro-card {
	margin-top: 24rpx;
	padding: 28rpx 24rpx;
}

.intro-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #111;
}

.intro-text {
	display: block;
	margin-top: 14rpx;
	font-size: 26rpx;
	line-height: 42rpx;
	color: #8e95a3;
}

.logout {
	margin: 34rpx auto 0;
	width: 180rpx;
	height: 56rpx;
	color: #ff5353;
	font-size: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.copyright {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	bottom: 42rpx;
	text-align: center;
	font-size: 22rpx;
	color: #b8bdc9;
	line-height: 32rpx;
}
</style>
