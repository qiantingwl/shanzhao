<template>
	<view class="app-page doc-page">
		<view class="app-nav">
			<view class="nav-back" @click="back"></view>
			<text class="app-title">隐私政策</text>
		</view>
		<scroll-view class="doc-body" scroll-y>
			<template v-if="customText">
				<text class="doc-p" v-for="(line, index) in customLines" :key="index">{{ line }}</text>
				<view class="doc-bottom"></view>
			</template>
			<template v-else>
			<text class="doc-update">更新日期：2025 年 1 月 1 日 | 生效日期：2025 年 1 月 1 日</text>

			<text class="doc-h1">闪照相机隐私政策</text>

			<text class="doc-p">「闪照相机」小程序（以下简称"本产品"）非常重视您的隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息，请在使用前仔细阅读。</text>

			<text class="doc-h2">一、我们收集的信息</text>
			<text class="doc-p">在您使用本产品过程中，我们可能收集以下信息：</text>
			<text class="doc-li">1. 微信授权信息：包括微信昵称、头像（仅在您主动授权时获取）；</text>
			<text class="doc-li">2. 设备信息：设备型号、操作系统版本、屏幕分辨率等，用于优化产品体验；</text>
			<text class="doc-li">3. 操作记录：您创建闪照、查看闪照、撤回等操作的时间和基本参数，用于功能实现和记录查询；</text>
			<text class="doc-li">4. 图片文件：您上传的图片仅用于闪照功能，存储于服务器端，不会用于其他用途。</text>

			<text class="doc-h2">二、信息的使用</text>
			<text class="doc-p">我们收集的信息仅用于以下目的：</text>
			<text class="doc-li">1. 提供和维护闪照相机的核心功能；</text>
			<text class="doc-li">2. 身份识别与登录认证；</text>
			<text class="doc-li">3. 记录查看行为（如截屏检测），确保闪照安全；</text>
			<text class="doc-li">4. 改进产品性能和用户体验；</text>
			<text class="doc-li">5. 响应法律法规要求或配合监管部门调查。</text>

			<text class="doc-h2">三、信息的存储与保护</text>
			<text class="doc-p">1. 您的数据存储于安全的服务器上，我们采取加密传输、访问控制等技术手段保护数据安全。</text>
			<text class="doc-p">2. 闪照图片在到达查看限制后，将根据产品逻辑进行处理（如不再可访问），但可能因备份等原因保留一定周期。</text>
			<text class="doc-p">3. 我们不会将您的个人信息出售、出租或交换给任何第三方，法律法规要求的情形除外。</text>

			<text class="doc-h2">四、信息的共享</text>
			<text class="doc-p">以下情况下，我们可能共享您的信息：</text>
			<text class="doc-li">1. 获得您的明确授权同意；</text>
			<text class="doc-li">2. 根据法律法规、法律程序或政府部门的要求；</text>
			<text class="doc-li">3. 为保护本产品用户或公众的人身安全、财产安全所必需的。</text>

			<text class="doc-h2">五、您的权利</text>
			<text class="doc-p">1. 查询与更正：您可以通过产品内功能查看和修改您的昵称、头像等个人信息。</text>
			<text class="doc-p">2. 删除：您可以删除已创建的闪照。如需注销账号，请联系在线客服。</text>
			<text class="doc-p">3. 撤回授权：您可以在微信设置中取消对本小程序的授权。撤回授权后，我们将停止收集相关信息，但不影响此前已收集信息的合法使用。</text>

			<text class="doc-h2">六、未成年人保护</text>
			<text class="doc-p">我们非常重视未成年人的隐私保护。如您为未满 18 周岁的未成年人，请在监护人的陪同和指导下使用本产品。</text>

			<text class="doc-h2">七、政策更新</text>
			<text class="doc-p">我们可能根据法律法规变化或业务调整更新本隐私政策。更新后将在产品内公示，建议您定期查看。</text>

			<text class="doc-h2">八、联系我们</text>
			<text class="doc-p">如您对本隐私政策有任何疑问、建议或投诉，可通过产品内「在线客服」功能联系我们，我们将在 15 个工作日内回复。</text>

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
				this.customText = cfg.privacy_text || ''
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
