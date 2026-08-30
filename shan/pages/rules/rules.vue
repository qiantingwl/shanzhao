<template>
	<view class="rules-page">
		<view class="app-nav">
			<view class="nav-back" @click="back"></view>
			<text class="app-title">使用说明</text>
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
		<view v-if="customText" class="content">
			<text class="p" v-for="(line, index) in customLines" :key="index">{{ line }}</text>
		</view>
		<view v-else class="content">
			<text class="h1">小程序使用规范与内容安全须知</text>
			<text class="p strong">尊敬的用户：</text>
			<text class="p">欢迎使用闪图小程序。为保障您与他人的合法权益，维护健康、合法、文明的网络环境，请务必在使用前仔细阅读并遵守以下内容规范。</text>
			<text class="h2">一、禁止上传的内容</text>
			<text class="p">1. 违反国家法律法规的图片，包括但不限于含有色情低俗、暴力恐怖、诈骗赌博、侵犯他人权益等内容。</text>
			<text class="p">2. 未经授权传播他人的肖像、商标、著作权内容，或包含虚假、误导、营销、传销等信息的图片。</text>
			<text class="p">3. 平台认定的其他不良信息，包括血腥惊悚、极度不适、公序良俗相悖的图片。</text>
			<text class="h2">二、上传须知</text>
			<text class="p">1. 您应确保已年满 18 周岁，或已取得监护人同意并在监护人指导下使用。</text>
			<text class="p">2. 平台有权依据法律法规要求进行内容审核，存在风险的内容可能无法上传或分享。</text>
			<text class="p">3. 请勿上传任何您无权传播的图片。因违规上传、分享造成的责任，由上传者自行承担。</text>
			<text class="h2">三、功能说明</text>
			<text class="p">创建页选择图片后，可设置查看次数、查看时长、是否禁止转发。创建成功后会弹出分享卡片，可发送给好友，也可进入查看记录。</text>
		</view>
	</view>
</template>

<script>
import { getPublicConfig } from '../../utils/api'

export default {
	data() {
		return {
			customText: ''
		}
	},
	computed: {
		customLines() {
			return this.customText.split('\n').filter(Boolean)
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
				this.customText = cfg.rules_text || ''
			} catch (e) {}
		},
		back() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.rules-page {
	min-height: 100vh;
	background: #fff;
	padding-bottom: 50rpx;
}

.content {
	padding: 20rpx 28rpx 50rpx;
}

.h1 {
	display: block;
	text-align: center;
	font-size: 34rpx;
	font-weight: 800;
	line-height: 48rpx;
	margin-bottom: 18rpx;
}

.h2,
.strong {
	font-weight: 800;
}

.h2 {
	display: block;
	font-size: 32rpx;
	line-height: 44rpx;
	margin-top: 18rpx;
}

.p {
	display: block;
	font-size: 30rpx;
	line-height: 46rpx;
	color: #000;
	margin-top: 8rpx;
}
</style>
