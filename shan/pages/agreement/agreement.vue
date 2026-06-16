<template>
	<view class="app-page doc-page">
		<view class="app-nav">
			<view class="nav-back" @click="back"></view>
			<text class="app-title">用户协议</text>
		</view>
		<scroll-view class="doc-body" scroll-y>
			<template v-if="customText">
				<text class="doc-p" v-for="(line, index) in customLines" :key="index">{{ line }}</text>
				<view class="doc-bottom"></view>
			</template>
			<template v-else>
			<text class="doc-update">更新日期：2025 年 1 月 1 日 | 生效日期：2025 年 1 月 1 日</text>

			<text class="doc-h1">闪照相机用户服务协议</text>

			<text class="doc-p">欢迎您使用「闪照相机」小程序（以下简称"本产品"）。在使用本产品前，请您认真阅读本协议全部内容。一旦您使用或继续使用本产品，即表示您已充分理解并同意本协议。</text>

			<text class="doc-h2">一、服务说明</text>
			<text class="doc-p">1. 本产品由开发者（以下简称"我们"）提供，主要功能包括：限时查看图片、查看次数限制、浏览记录追踪、截屏检测与提醒、闪照撤回等。</text>
			<text class="doc-p">2. 我们有权在不事先通知的情况下对产品功能进行升级、调整或暂停服务。</text>

			<text class="doc-h2">二、用户行为规范</text>
			<text class="doc-p">1. 您在使用本产品时应遵守中华人民共和国法律法规，不得利用本产品从事违法违规行为。</text>
			<text class="doc-p">2. 禁止上传以下内容：</text>
			<text class="doc-li">• 含有色情低俗、暴力恐怖、赌博诈骗等违法内容的图片；</text>
			<text class="doc-li">• 侵犯他人肖像权、隐私权、著作权等合法权益的图片；</text>
			<text class="doc-li">• 散布谣言、虚假信息、恶意营销等不良内容的图片；</text>
			<text class="doc-li">• 其他违反法律法规或公序良俗的内容。</text>
			<text class="doc-p">3. 因您上传内容引发的法律责任，由您自行承担。我们有权对违规内容进行删除、限制或举报处理。</text>

			<text class="doc-h2">三、知识产权</text>
			<text class="doc-p">1. 本产品的界面设计、代码、图标、文案等均受知识产权法律保护，未经授权不得复制、修改或传播。</text>
			<text class="doc-p">2. 您上传的图片，其知识产权归原权利人所有。您保证拥有上传内容的合法权利。</text>

			<text class="doc-h2">四、免责声明</text>
			<text class="doc-p">1. 本产品通过技术手段（如限时、禁止截屏等）保护图片隐私，但无法保证在所有设备和场景下完全有效。</text>
			<text class="doc-p">2. 因不可抗力、系统故障、第三方平台变更等原因造成的服务中断或数据丢失，我们不承担赔偿责任。</text>
			<text class="doc-p">3. 对于用户之间因分享、查看闪照产生的纠纷，我们仅提供技术平台，不承担连带责任。</text>

			<text class="doc-h2">五、账号管理</text>
			<text class="doc-p">1. 您通过微信授权登录获得的账号，应妥善保管。因账号泄露导致的损失由您自行承担。</text>
			<text class="doc-p">2. 我们有权对违反本协议的账号进行警告、限制功能或封禁处理。</text>

			<text class="doc-h2">六、协议修改</text>
			<text class="doc-p">我们有权根据法律法规变化或业务需要修改本协议。修改后的协议将在产品内公示，您继续使用即视为同意修改后的内容。</text>

			<text class="doc-h2">七、其他</text>
			<text class="doc-p">1. 本协议适用中华人民共和国法律。</text>
			<text class="doc-p">2. 如有争议，双方应友好协商解决；协商不成的，可向开发者所在地有管辖权的人民法院提起诉讼。</text>
			<text class="doc-p">3. 本协议最终解释权归开发者所有。</text>

			<view class="doc-bottom"></view>
			</template>
		</scroll-view>
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
				this.customText = cfg.agreement_text || ''
			} catch (e) {}
		},
		back() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.doc-page {
	background: #fff;
	padding: 0;
}

.doc-body {
	height: calc(100vh - var(--status-bar-height) - 112rpx);
	padding: 0 32rpx;
}

.doc-update {
	display: block;
	font-size: 24rpx;
	color: #b8bdc9;
	margin-bottom: 24rpx;
}

.doc-h1 {
	display: block;
	font-size: 36rpx;
	font-weight: 800;
	color: #111;
	text-align: center;
	margin-bottom: 32rpx;
	line-height: 52rpx;
}

.doc-h2 {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #111;
	margin-top: 28rpx;
	margin-bottom: 12rpx;
	line-height: 44rpx;
}

.doc-p {
	display: block;
	font-size: 28rpx;
	color: #333;
	line-height: 48rpx;
	margin-bottom: 8rpx;
}

.doc-li {
	display: block;
	font-size: 28rpx;
	color: #555;
	line-height: 46rpx;
	padding-left: 16rpx;
}

.doc-bottom {
	height: 80rpx;
}
</style>
