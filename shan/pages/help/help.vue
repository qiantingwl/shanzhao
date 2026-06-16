<template>
	<view class="plain-page">
		<view class="app-nav">
			<view class="nav-back" @click="back"></view>
			<text class="app-title">常见问题</text>
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
		<view class="help-list">
			<view class="help-item" v-for="(item, index) in items" :key="item.title">
				<view class="help-title" @click="active = active === index ? -1 : index">
					<text class="grid-symbol">▦</text>
					<text>{{ index + 1 }}.{{ item.title }}</text>
					<text class="fold">{{ active === index ? '⌃' : '⌄' }}</text>
				</view>
				<view v-if="active === index" class="help-content">
					<text>{{ item.content }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getHelpList } from '../../utils/api'

export default {
	data() {
		return {
			active: 0,
			items: [
				{ title: '如何创建闪图', content: '首页上传照片之后点击“创建闪图”按钮即可创建，创建成功之后可以分享给好友查看。' },
				{ title: '为什么不能截图', content: '开启禁止截屏后，安卓端会尽量阻止截图，苹果端会记录截图提示。最终能力以后端和小程序环境支持为准。' },
				{ title: '分享后在哪里查看记录', content: '创建成功后点击“查看记录”，或在底部“记录”页进入详情查看浏览记录。' }
			]
		}
	},
	onLoad() {
		this.loadHelp()
	},
	methods: {
		async loadHelp() {
			try {
				const res = await getHelpList()
				const list = res.data || res
				if (Array.isArray(list) && list.length > 0) {
					this.items = list
					this.active = 0
				}
			} catch (e) {}
		},
		back() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.plain-page {
	min-height: 100vh;
	background: #fff;
}

.help-list {
	border-top: 1px solid #eef0f4;
}

.help-item {
	border-bottom: 1px solid #eef0f4;
}

.help-title {
	min-height: 76rpx;
	padding: 0 26rpx;
	display: flex;
	align-items: center;
	font-size: 28rpx;
	color: #1f2937;
}

.grid-symbol {
	color: #6b7280;
	margin-right: 14rpx;
	font-size: 30rpx;
}

.fold {
	margin-left: auto;
	color: #8b95a5;
	font-size: 34rpx;
}

.help-content {
	padding: 26rpx 48rpx 38rpx;
	border-top: 1px solid #eef0f4;
	font-size: 28rpx;
	line-height: 52rpx;
	color: #4b5563;
}
</style>
