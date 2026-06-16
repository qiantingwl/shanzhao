<template>
	<view class="app-page blacklist-page">
		<view class="app-nav">
			<view class="nav-back" @click="back"></view>
			<text class="app-title">小小黑屋</text>
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
		<view v-if="list.length === 0" class="empty-state">
			<view class="empty-illustration">
				<view class="cloud cloud-left"></view>
				<view class="cloud cloud-right"></view>
				<view class="paper"><text></text><text></text><text></text></view>
				<view class="shadow"></view>
			</view>
			<text class="empty-text">没有数据~</text>
		</view>
		<view v-else class="ban-list">
			<view class="ban-item" v-for="item in list" :key="item.id">
				<image v-if="item.avatar" class="ban-avatar" :src="item.avatar" mode="aspectFill"></image>
				<view v-else class="ban-avatar placeholder">禁</view>
				<view class="ban-info">
					<text class="ban-name">{{ item.nickname }}</text>
					<text class="ban-time">原因：{{ item.banReason || '违规使用' }}</text>
					<text class="ban-time">拉黑时间：{{ formatTime(item.createTime || item.updatedAt || item.createdAt) }}</text>
					<text v-if="item.secureTime" class="ban-time">解除时间：{{ formatTime(item.secureTime) }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getBannedUsers } from '../../utils/api'

export default {
	data() {
		return {
			list: []
		}
	},
	onLoad() {
		this.loadData()
	},
	methods: {
		async loadData() {
			try {
				const res = await getBannedUsers(1, 50)
				const data = res.data || res
				this.list = data.list || []
			} catch (e) {}
		},
		formatTime(t) {
			if (!t) return '-'
			return new Date(t).toLocaleString()
		},
		back() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.ban-list {
	padding: 28rpx;
}

.ban-item {
	display: flex;
	align-items: center;
	gap: 22rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	border-radius: 20rpx;
	background: #fff;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
}

.ban-avatar {
	width: 84rpx;
	height: 84rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.ban-avatar.placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	background: #111827;
	color: #fff;
	font-size: 28rpx;
	font-weight: 700;
}

.ban-info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.ban-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #111827;
}

.ban-time {
	font-size: 24rpx;
	color: #8b95a5;
}

.empty-state {
	margin-top: 210rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.empty-illustration {
	width: 300rpx;
	height: 220rpx;
	position: relative;
}

.paper {
	position: absolute;
	left: 106rpx;
	top: 58rpx;
	width: 106rpx;
	height: 112rpx;
	border-radius: 18rpx;
	background: linear-gradient(145deg, #c7d3ff, #aebbf6);
	box-shadow: 0 14rpx 28rpx rgba(142, 155, 218, 0.28);
	display: flex;
	flex-direction: column;
	gap: 14rpx;
	padding: 30rpx 20rpx 0 34rpx;
}

.paper text {
	height: 8rpx;
	border-radius: 8rpx;
	background: #fff;
}

.paper text:nth-child(1) { width: 50rpx; }
.paper text:nth-child(2) { width: 64rpx; }
.paper text:nth-child(3) { width: 56rpx; }

.cloud {
	position: absolute;
	border-radius: 40rpx;
	background: linear-gradient(180deg, #dbe3ff, #f4f6ff);
}

.cloud-left {
	left: 36rpx;
	top: 86rpx;
	width: 86rpx;
	height: 28rpx;
}

.cloud-left::before,
.cloud-right::before {
	content: "";
	position: absolute;
	border-radius: 50%;
	background: #cbd6ff;
}

.cloud-left::before {
	left: 20rpx;
	top: -18rpx;
	width: 40rpx;
	height: 40rpx;
}

.cloud-right {
	right: 34rpx;
	top: 70rpx;
	width: 92rpx;
	height: 30rpx;
}

.cloud-right::before {
	left: 24rpx;
	top: -24rpx;
	width: 48rpx;
	height: 48rpx;
}

.shadow {
	position: absolute;
	left: 58rpx;
	bottom: 4rpx;
	width: 190rpx;
	height: 44rpx;
	border-radius: 50%;
	background: linear-gradient(180deg, rgba(198, 207, 247, 0.28), rgba(198, 207, 247, 0));
}

.empty-text {
	margin-top: 28rpx;
	color: #bec4d0;
	font-size: 28rpx;
}
</style>
