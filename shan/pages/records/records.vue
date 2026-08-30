<template>
	<view class="app-page records-page">
		<view class="app-nav">
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

		<view v-if="loading && !loaded && list.length === 0" class="empty-state">
			<text class="empty-text">加载中…</text>
		</view>

		<view v-else-if="loaded && list.length === 0" class="empty-state">
			<view class="empty-illustration">
				<view class="cloud cloud-left"></view>
				<view class="cloud cloud-right"></view>
				<view class="paper">
					<text></text><text></text><text></text>
				</view>
				<view class="shadow"></view>
			</view>
			<text class="empty-text">没有数据~</text>
		</view>

		<view v-else class="flash-list">
			<view
				v-for="item in list"
				:key="item.id"
				class="card flash-item"
				@click="goDetail(item)"
			>
				<image class="flash-thumb" :src="thumbSrc(item)" mode="aspectFill" />
				<view class="flash-info">
					<view class="flash-row">
						<text class="flash-status" :class="item.status">{{ statusLabel(item.status) }}</text>
						<text class="flash-time">{{ formatTime(item.createdAt) }}</text>
					</view>
					<view class="flash-row">
						<text class="flash-meta">最多 {{ item.maxNum }}次 · 每次 {{ item.maxSec }}秒</text>
					</view>
				</view>
				<text class="arrow">›</text>
			</view>
			<view v-if="hasMore" class="load-more" @click="loadMore">加载更多</view>
			<view v-else class="load-end">已显示全部</view>
		</view>

		<view class="bottom-tabs">
			<view class="tab-item" @click="go('/pages/create/create')">
				<image class="tab-icon" src="/static/sy.svg" mode="aspectFit"></image>
				<text>创建</text>
			</view>
			<view class="tab-item active">
				<image class="tab-icon" src="/static/tj.svg" mode="aspectFit"></image>
				<text>记录</text>
			</view>
			<view class="tab-item" @click="go('/pages/profile/profile')">
				<image class="tab-icon" src="/static/gd.svg" mode="aspectFit"></image>
				<text>我的</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getMyFlashList } from '../../utils/api'
import { getBaseUrl } from '../../utils/config'
import { formatShort, resolveFileUrl } from '../../utils/format'
export default {
	data() {
		return {
			list: [],
			total: 0,
			page: 1,
			pageSize: 20,
			loading: false,
			loaded: false,
			requestSeq: 0
		}
	},
	computed: {
		hasMore() {
			return this.list.length < this.total
		}
	},
	onShow() {
		if (!uni.getStorageSync('token')) {
			this.list = []
			this.total = 0
			this.loaded = true
			return
		}
		this.page = 1
		this.loaded = false
		this.loadData(true)
	},
	onPullDownRefresh() {
		this.page = 1
		this.loaded = false
		this.loadData(true).then(() => uni.stopPullDownRefresh())
	},
	methods: {
		async loadData(reset = false) {
			if (this.loading) return
			const requestPage = reset ? 1 : this.page
			const seq = ++this.requestSeq
			this.loading = true
			try {
				if (reset) this.page = 1
				const res = await getMyFlashList(requestPage, this.pageSize)
				if (seq !== this.requestSeq) return
				const { list = [], total = 0 } = res.data || res
				if (requestPage === 1) {
					this.list = list
				} else {
					this.list = this.list.concat(list)
				}
				this.total = total
			} catch (e) {
				if (!reset && this.page > 1) this.page--
			} finally {
				if (seq === this.requestSeq) {
					this.loading = false
					this.loaded = true
				}
			}
		},
		loadMore() {
			if (this.loading || !this.hasMore) return
			this.page++
			this.loadData()
		},
		thumbSrc(item) {
			return resolveFileUrl(item.fileThumb, getBaseUrl())
		},
		statusLabel(status) {
			const map = {
				published: '已发布',
				revoked: '已撤回',
				pending: '审核中',
				rejected: '已拒绝',
				'1': '已发布',
				'2': '已撤回',
				'0': '审核中',
				'3': '已拒绝'
			}
			return map[status] || status
		},
		formatTime(t) {
			return formatShort(t)
		},
		goDetail(item) {
			const thumb = item.fileThumb
				? encodeURIComponent(this.thumbSrc(item))
				: ''
			const time = encodeURIComponent(item.createdAt || '')
			uni.navigateTo({
				url: `/pages/record-detail/record-detail?id=${item.id}&thumbUrl=${thumb}&createdAt=${time}`
			})
		},
		go(url) {
			uni.redirectTo({ url })
		}
	}
}
</script>

<style scoped>
.records-page {
	padding-bottom: 170rpx;
	padding-bottom: calc(170rpx + constant(safe-area-inset-bottom));
	padding-bottom: calc(170rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.flash-list {
	margin-top: 16rpx;
	padding-bottom: 24rpx;
}

.flash-item {
	margin-bottom: 16rpx;
	padding: 20rpx 24rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.flash-thumb {
	width: 96rpx;
	height: 96rpx;
	border-radius: 12rpx;
	flex-shrink: 0;
	background: #f0f0f0;
}

.flash-info {
	flex: 1;
	min-width: 0;
}

.flash-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8rpx;
}

.flash-status {
	font-size: 24rpx;
	padding: 4rpx 14rpx;
	border-radius: 20rpx;
	background: #e8f0fe;
	color: #2f7bff;
}

.flash-status.revoked {
	background: #fff1e6;
	color: #ff8c42;
}

.flash-status.pending {
	background: #f5f5f5;
	color: #999;
}

.flash-time {
	font-size: 24rpx;
	color: #b8bdc9;
}

.flash-meta {
	font-size: 26rpx;
	color: #8e95a3;
}

.load-more, .load-end {
	text-align: center;
	padding: 30rpx;
	font-size: 26rpx;
	color: #b8bdc9;
}

.empty-state {
	margin-top: 206rpx;
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

.paper text:first-child { width: 50rpx; }
.paper text:nth-child(2) { width: 64rpx; }
.paper text:nth-child(3) { width: 56rpx; }

.cloud {
	position: absolute;
	border-radius: 40rpx;
	background: linear-gradient(180deg, #dbe3ff, #f4f6ff);
	opacity: 0.9;
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
