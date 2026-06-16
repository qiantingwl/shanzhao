<template>
	<view class="app-page profile-page">
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

		<view class="profile-content">
			<view v-if="!userInfo" class="user-block" @click="login">
				<view class="avatar">
					<view class="avatar-head"></view>
					<view class="avatar-body"></view>
				</view>
				<view class="user-text">
					<text class="login-title">{{ loginLoading ? '登录中…' : '登录/注册' }}</text>
					<text class="login-sub">点击可登录/注册账号~</text>
				</view>
			</view>

			<view v-else class="user-block">
				<!-- #ifdef MP-WEIXIN -->
				<button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
					<image v-if="userAvatar" class="avatar-img" :src="userAvatar" mode="aspectFill" />
					<view v-else class="avatar-placeholder">
						<view class="avatar-head"></view>
						<view class="avatar-body"></view>
					</view>
				</button>
				<!-- #endif -->
				<!-- #ifndef MP-WEIXIN -->
				<view class="avatar">
					<image v-if="userAvatar" class="avatar-img" :src="userAvatar" mode="aspectFill" />
					<view v-else><view class="avatar-head"></view><view class="avatar-body"></view></view>
				</view>
				<!-- #endif -->
				<view class="user-text">
					<!-- #ifdef MP-WEIXIN -->
					<input
						class="nickname-input"
						type="nickname"
						:value="userInfo.nickname || ''"
						placeholder="点击修改昵称"
						@blur="onNicknameBlur"
					/>
					<!-- #endif -->
					<!-- #ifndef MP-WEIXIN -->
					<text class="login-title">{{ userInfo.nickname || '用户' + (userInfo.id || '').slice(-4) }}</text>
					<!-- #endif -->
					<text class="login-sub">点击头像/昵称可修改</text>
				</view>
			</view>

			<view class="profile-groups">
				<view class="card menu-card">
					<view class="menu-row" v-for="item in helpMenus" :key="item.title" @click="tapMenu(item)">
						<view class="menu-left">
							<view class="menu-icon" :style="{ background: item.color }">
								<text>{{ item.icon }}</text>
							</view>
							<text class="menu-title">{{ item.title }}</text>
						</view>
						<text class="arrow">›</text>
					</view>
				</view>

				<view class="card single-card" @click="tapMenu({ title: '小小黑屋', url: '/pages/blacklist/blacklist' })">
					<view class="menu-left">
						<view class="menu-icon muted-icon">
							<text>禁</text>
						</view>
						<text class="menu-title">小小黑屋</text>
					</view>
					<view class="right-text">
						<text>违规会被拉入小黑屋哦~</text>
						<text class="arrow">›</text>
					</view>
				</view>

				<view class="card menu-card">
					<block v-for="item in aboutMenus" :key="item.title">
						<button v-if="item.contact" class="menu-row menu-button" open-type="contact" show-message-card="true">
							<view class="menu-left">
								<view class="menu-icon" :style="{ background: item.color }">
									<text>{{ item.icon }}</text>
								</view>
								<text class="menu-title">{{ item.title }}</text>
							</view>
							<text class="arrow">›</text>
						</button>
						<view v-else class="menu-row" @click="tapMenu(item)">
							<view class="menu-left">
								<view class="menu-icon" :style="{ background: item.color }">
									<text>{{ item.icon }}</text>
								</view>
								<text class="menu-title">{{ item.title }}</text>
							</view>
							<text class="arrow">›</text>
						</view>
					</block>
				</view>
			</view>
		</view>

		<view class="bottom-tabs">
			<view class="tab-item" @click="go('/pages/create/create')">
				<image class="tab-icon" src="/static/sy.svg" mode="aspectFit"></image>
				<text>创建</text>
			</view>
			<view class="tab-item" @click="go('/pages/records/records')">
				<image class="tab-icon" src="/static/tj.svg" mode="aspectFit"></image>
				<text>记录</text>
			</view>
			<view class="tab-item active">
				<image class="tab-icon" src="/static/gd.svg" mode="aspectFit"></image>
				<text>我的</text>
			</view>
		</view>
	</view>
</template>

<script>
import { wxLogin, updateProfile } from '../../utils/api'
export default {
	data() {
		return {
			loginLoading: false,
			userInfo: null,
			helpMenus: [
				{ title: '使用说明', icon: '说', color: '#ff7b82', url: '/pages/rules/rules' },
				{ title: '常见问题', icon: '?', color: '#a68cff', url: '/pages/help/help' }
			],
			aboutMenus: [
				{ title: '关注我们', icon: '关', color: '#f563cf', url: '/pages/follow/follow' },
				{ title: '在线客服', icon: '服', color: '#55a7ff', contact: true },
				{ title: '关于我们', icon: '于', color: '#c9cdd4', url: '/pages/about/about' }
			]
		}
	},
	onShow() {
		const token = uni.getStorageSync('token')
		const user = uni.getStorageSync('userInfo')
		if (token && user) {
			try { this.userInfo = typeof user === 'string' ? JSON.parse(user) : user } catch {}
		}
	},
	computed: {
		userAvatar() {
			if (!this.userInfo) return ''
			return this.userInfo.avatar || this.userInfo.avatarUrl || ''
		}
	},
	methods: {
		login() {
			if (this.loginLoading) return
			if (uni.getStorageSync('token')) {
				uni.showToast({ title: '已登录', icon: 'none' })
				return
			}
			this.loginLoading = true
			uni.login({
				success: async (loginRes) => {
					try {
						const res = await wxLogin(loginRes.code)
						const { token, user } = res.data || res
						uni.setStorageSync('token', token)
						uni.setStorageSync('userInfo', JSON.stringify(user))
						this.userInfo = user
						uni.showToast({ title: '登录成功', icon: 'success' })
					} catch (e) {
						uni.showToast({ title: '登录失败，请重试', icon: 'none' })
					} finally {
						this.loginLoading = false
					}
				},
				fail: () => {
					this.loginLoading = false
					uni.showToast({ title: '获取登录凭证失败', icon: 'none' })
				}
			})
		},
		async onChooseAvatar(e) {
			const avatarUrl = e.detail.avatarUrl
			if (!avatarUrl || !this.userInfo) return
			try {
				const res = await updateProfile({ avatarUrl })
				const updated = res.data || res
				this.userInfo = { ...this.userInfo, avatar: updated.avatar || avatarUrl }
				uni.setStorageSync('userInfo', JSON.stringify(this.userInfo))
				uni.showToast({ title: '头像已更新', icon: 'success' })
			} catch {
				uni.showToast({ title: '更新失败', icon: 'none' })
			}
		},
		async onNicknameBlur(e) {
			const nickname = (e.detail.value || '').trim()
			if (!nickname || !this.userInfo || nickname === this.userInfo.nickname) return
			try {
				const res = await updateProfile({ nickname })
				const updated = res.data || res
				this.userInfo = { ...this.userInfo, nickname: updated.nickname || nickname }
				uni.setStorageSync('userInfo', JSON.stringify(this.userInfo))
				uni.showToast({ title: '昵称已更新', icon: 'success' })
			} catch {
				uni.showToast({ title: '更新失败', icon: 'none' })
			}
		},
		tapMenu(item) {
			if (item.url) {
				uni.navigateTo({ url: item.url })
				return
			}
			uni.showToast({ title: `${item.title}待接入`, icon: 'none' })
		},
		go(url) {
			uni.redirectTo({ url })
		}
	}
}
</script>

<style scoped>
.profile-page {
	padding-top: 0;
	min-height: 100vh;
	background: #f5f6f8;
}

.app-nav {
	justify-content: flex-end;
}

.user-block {
	min-height: 150rpx;
	padding: 32rpx 28rpx;
	display: flex;
	align-items: center;
	background: #fff;
	border-radius: 20rpx;
	box-sizing: border-box;
}

.profile-content {
	min-height: calc(100vh - 214rpx);
	padding: 20rpx 24rpx calc(130rpx + env(safe-area-inset-bottom));
	padding-bottom: calc(130rpx + constant(safe-area-inset-bottom));
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
}

.profile-groups {
	margin-top: 28rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	flex: 1;
}

.avatar-btn {
	width: 110rpx;
	height: 110rpx;
	border-radius: 50%;
	background: #f0f0f0;
	border: none;
	padding: 0;
	margin: 0;
	overflow: hidden;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-placeholder {
	width: 100%;
	height: 100%;
	position: relative;
}

.avatar-img {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	display: block;
}

.nickname-input {
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a1a;
	background: transparent;
	padding: 0;
	height: 48rpx;
	line-height: 48rpx;
}

.avatar {
	width: 110rpx;
	height: 110rpx;
	border-radius: 50%;
	background: #f0f0f0;
	position: relative;
	overflow: hidden;
	flex-shrink: 0;
}

.avatar-head {
	position: absolute;
	left: 34rpx;
	top: 22rpx;
	width: 42rpx;
	height: 42rpx;
	border-radius: 50%;
	background: #ddd;
}

.avatar-body {
	position: absolute;
	left: 16rpx;
	bottom: -12rpx;
	width: 78rpx;
	height: 56rpx;
	border-radius: 50% 50% 0 0;
	background: #ddd;
}

.user-text {
	margin-left: 24rpx;
	display: flex;
	flex-direction: column;
}

.login-title {
	font-size: 36rpx;
	color: #1a1a1a;
	font-weight: 700;
	line-height: 46rpx;
}

.login-sub {
	margin-top: 8rpx;
	color: #999;
	font-size: 24rpx;
}

.menu-card {
	padding-left: 20rpx;
	border-radius: 20rpx;
	background: #fff;
	overflow: hidden;
}

.menu-row {
	width: 100%;
	height: 104rpx;
	padding-right: 24rpx;
	padding-left: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid #f5f5f5;
	background: transparent;
	line-height: 1;
	text-align: left;
}

.menu-button {
	border-radius: 0;
}

.menu-row:last-child {
	border-bottom: 0;
}

.menu-left {
	display: flex;
	align-items: center;
	min-width: 0;
}

.menu-icon {
	width: 48rpx;
	height: 48rpx;
	border-radius: 12rpx;
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 22rpx;
	font-weight: 700;
	flex-shrink: 0;
}

.muted-icon {
	background: #9ca3af;
}

.menu-title {
	margin-left: 20rpx;
	font-size: 31rpx;
	color: #1f2937;
	font-weight: 400;
}

.arrow {
	color: #c8ccd4;
	font-size: 28rpx;
	line-height: 28rpx;
}

.single-card {
	min-height: 104rpx;
	padding: 0 24rpx 0 20rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #fff;
	border-radius: 20rpx;
}

.right-text {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	color: #999;
	font-size: 24rpx;
	min-width: 0;
	flex: 1;
}

.right-text text:first-child {
	white-space: nowrap;
}

.right-text .arrow {
	margin-left: 8rpx;
}
</style>

