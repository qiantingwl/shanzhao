<template>
	<view class="content-page">
		<view class="nav-bar">
			<view class="back-btn" @click="goBack">
				<text class="back-arrow"></text>
			</view>
			<text class="nav-title">{{ page.title }}</text>
		</view>

		<scroll-view scroll-y class="body">
			<view v-if="pageType === 'follow_us_text'" class="follow-section">
				<view class="brand-icon-wrap">
					<text class="brand-icon-text">闪</text>
				</view>
				<text class="brand-name">闪照相机</text>
				<text class="brand-desc">关注公众号后可接收查看提醒、产品更新和客服通知。</text>
				<view class="qr-box">
					<image class="qr-image" src="/static/logo.png" mode="aspectFit"></image>
					<text class="qr-hint">公众号二维码位置预留</text>
				</view>
				<view class="info-rows">
					<view class="info-row">
						<text class="info-label">公众号</text>
						<text class="info-value">闪照相机</text>
					</view>
					<view class="info-row">
						<text class="info-label">服务时间</text>
						<text class="info-value">09:00 - 22:00</text>
					</view>
				</view>
			</view>

			<view v-else-if="pageType === 'about_text'" class="about-section">
				<view class="brand-icon-wrap">
					<text class="brand-icon-text">闪</text>
				</view>
				<text class="brand-name">闪照相机</text>
				<text class="brand-slogan">安全防破解，一键撤回，一键分享~</text>
				<view class="about-list">
					<view class="about-row" @click="tapLink('agreement')">
						<view class="about-row-left">
							<view class="row-icon row-icon-blue"><text class="row-icon-txt">协</text></view>
							<text class="about-row-title">用户协议</text>
						</view>
						<text class="row-arrow">></text>
					</view>
					<view class="about-row" @click="tapLink('privacy')">
						<view class="about-row-left">
							<view class="row-icon row-icon-pink"><text class="row-icon-txt">隐</text></view>
							<text class="about-row-title">隐私政策</text>
						</view>
						<text class="row-arrow">></text>
					</view>
					<view class="about-row">
						<view class="about-row-left">
							<view class="row-icon row-icon-gray"><text class="row-icon-txt">版</text></view>
							<text class="about-row-title">版本号</text>
						</view>
						<text class="row-version">v1.0.0</text>
					</view>
				</view>
				<view class="about-intro">
					<text class="intro-title">产品介绍</text>
					<text class="intro-content">闪照相机用于创建限时查看图片，支持查看次数、查看时长、撤回、浏览记录等能力。当前版本为前端演示，后续会接入自建后端和 MySQL 数据库。</text>
				</view>
			</view>

			<view v-else class="article-section">
				<view v-for="(item, idx) in page.sections" :key="idx" class="article-item">
					<text class="article-q">{{ item.title }}</text>
					<text class="article-a">{{ item.content }}</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
var PAGES = {
	help_text: {
		title: '使用说明',
		sections: [
			{ title: '如何创建闪图？', content: '在首页上传照片，设置查看次数、查看时长、是否允许转发，然后点击创建闪图即可。创建成功后可以分享给好友。' },
			{ title: '如何分享给好友？', content: '创建成功后会出现分享卡片，可以直接发送给微信好友。好友打开后按规则查看，查看行为会被记录。' },
			{ title: '在哪里看访问记录？', content: '进入底部"记录"页，选择对应闪图即可查看访问次数、查看时间等信息。' },
			{ title: '如何撤回？', content: '在记录详情中点击撤回，撤回后其他人将无法继续查看该闪图。' }
		]
	},
	faq_text: {
		title: '常见问题',
		sections: [
			{ title: '为什么不能截图？', content: '开启禁止截屏后，安卓端会尽量阻止截图，苹果端会记录截图提示。最终效果以系统能力为准。' },
			{ title: '图片可以看几次？', content: '创建时可以设置最大查看次数，达到次数上限后对方将无法继续查看。' },
			{ title: '可以撤回吗？', content: '可以在记录详情中撤回闪图，撤回后其他人将无法继续查看。' },
			{ title: '创建后还能删除吗？', content: '可以。你可以在记录详情页删除内容，降低继续传播的风险。' }
		]
	},
	follow_us_text: { title: '关注我们', sections: [] },
	about_text: { title: '关于我们', sections: [] }
};

export default {
	data: function() {
		return { pageType: 'help_text' }
	},
	computed: {
		page: function() { return PAGES[this.pageType] || PAGES.help_text; }
	},
	onLoad: function(options) {
		this.pageType = options.key || 'help_text';
		uni.setNavigationBarTitle({ title: this.page.title });
	},
	methods: {
		goBack: function() { uni.navigateBack(); },
		tapLink: function(type) {
			uni.showToast({ title: type === 'agreement' ? '用户协议' : '隐私政策', icon: 'none' });
		}
	}
};
</script>

<style scoped>
.content-page {
	min-height: 100vh;
	background: #fff;
}
.nav-bar {
	height: 88rpx;
	padding: 0 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	border-bottom: 1rpx solid #f0f0f0;
	position: sticky;
	top: 0;
	z-index: 10;
}
.back-btn {
	position: absolute;
	left: 24rpx;
	width: 58rpx;
	height: 58rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.back-arrow {
	display: inline-block;
	width: 18rpx;
	height: 18rpx;
	border-left: 4rpx solid #333;
	border-bottom: 4rpx solid #333;
	transform: rotate(45deg);
}
.nav-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a1a;
}
.body {
	height: calc(100vh - 88rpx);
	padding: 0 32rpx;
	box-sizing: border-box;
}
.follow-section {
	padding: 60rpx 0 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.brand-icon-wrap {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	background: #ffd600;
	display: flex;
	align-items: center;
	justify-content: center;
}
.brand-icon-text {
	font-size: 40rpx;
	font-weight: 800;
	color: #1a1a1a;
}
.brand-name {
	margin-top: 24rpx;
	font-size: 36rpx;
	font-weight: 700;
	color: #1a1a1a;
}
.brand-desc {
	margin-top: 16rpx;
	font-size: 26rpx;
	color: #999;
	text-align: center;
	padding: 0 20rpx;
	line-height: 1.6;
}
.qr-box {
	margin-top: 48rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.qr-image {
	width: 320rpx;
	height: 320rpx;
	border: 2rpx solid #eee;
	border-radius: 16rpx;
}
.qr-hint {
	margin-top: 16rpx;
	font-size: 24rpx;
	color: #3b82f6;
}
.info-rows {
	width: 100%;
	margin-top: 48rpx;
	border-top: 1rpx solid #f0f0f0;
}
.info-row {
	height: 96rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid #f0f0f0;
	padding: 0 8rpx;
}
.info-label {
	font-size: 28rpx;
	color: #333;
}
.info-value {
	font-size: 28rpx;
	color: #666;
}
.about-section {
	padding: 60rpx 0 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.brand-slogan {
	margin-top: 12rpx;
	font-size: 24rpx;
	color: #999;
}
.about-list {
	width: 100%;
	margin-top: 48rpx;
}
.about-row {
	height: 96rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid #f5f5f5;
	padding: 0 4rpx;
}
.about-row-left {
	display: flex;
	align-items: center;
}
.row-icon {
	width: 44rpx;
	height: 44rpx;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}
.row-icon-txt {
	font-size: 22rpx;
	font-weight: 700;
	color: #fff;
}
.row-icon-blue { background: #3b82f6; }
.row-icon-pink { background: #ec4899; }
.row-icon-gray { background: #9ca3af; }
.about-row-title {
	font-size: 30rpx;
	color: #333;
}
.row-arrow {
	font-size: 32rpx;
	color: #ccc;
}
.row-version {
	font-size: 28rpx;
	color: #999;
}
.about-intro {
	width: 100%;
	margin-top: 48rpx;
	padding-top: 32rpx;
	border-top: 1rpx solid #f0f0f0;
}
.intro-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #1a1a1a;
	margin-bottom: 16rpx;
}
.intro-content {
	display: block;
	font-size: 26rpx;
	line-height: 1.8;
	color: #666;
}
.article-section {
	padding: 24rpx 0;
}
.article-item {
	padding: 28rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}
.article-item:last-child {
	border-bottom: 0;
}
.article-q {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	color: #1a1a1a;
	margin-bottom: 14rpx;
}
.article-a {
	display: block;
	font-size: 26rpx;
	line-height: 1.8;
	color: #666;
}
</style>
