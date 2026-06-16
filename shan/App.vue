<script>
	export default {
		onLaunch() {},
		onShow() {},
		onHide() {}
	}
</script>

<style>
	page {
		min-height: 100%;
		background: #f5f6f8;
		color: #050505;
		font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
	}

	view,
	text,
	image,
	button,
	input {
		box-sizing: border-box;
	}

	button {
		margin: 0;
		padding: 0;
		background: transparent;
		border-radius: 0;
		line-height: 1;
	}

	button::after {
		border: 0;
	}

	.app-page {
		min-height: 100vh;
		padding: 0 14rpx calc(146rpx + env(safe-area-inset-bottom));
		padding-bottom: calc(146rpx + constant(safe-area-inset-bottom));
		background: #f5f6f8;
	}

	.app-nav {
		height: calc(var(--status-bar-height) + 112rpx);
		padding-top: calc(var(--status-bar-height) + 36rpx);
		position: relative;
		display: flex;
		align-items: flex-start;
		justify-content: center;
	}

	.app-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #111;
	}

	.nav-back {
		position: absolute;
		left: 0;
		top: calc(var(--status-bar-height) + 38rpx);
		width: 56rpx;
		height: 56rpx;
	}

	.nav-back::before {
		content: "";
		position: absolute;
		left: 10rpx;
		top: 12rpx;
		width: 26rpx;
		height: 26rpx;
		border-left: 4rpx solid #111;
		border-bottom: 4rpx solid #111;
		transform: rotate(45deg);
	}

	.fake-capsule {
		position: absolute;
		top: calc(var(--status-bar-height) + 24rpx);
		right: 0;
		width: 156rpx;
		height: 52rpx;
		padding: 0 17rpx;
		border-radius: 32rpx;
		background: #fff;
		border: 1px solid #e5e6eb;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.fake-dots {
		display: flex;
		gap: 8rpx;
	}

	.fake-dots text {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: #111;
	}

	.fake-line {
		width: 1px;
		height: 30rpx;
		background: #d8d8d8;
	}

	.fake-minus {
		width: 28rpx;
		height: 7rpx;
		border-radius: 10rpx;
		background: #111;
	}

	.fake-circle {
		width: 32rpx;
		height: 32rpx;
		border: 7rpx solid #111;
		border-radius: 50%;
	}

	.card {
		background: #fff;
		border-radius: 16rpx;
	}

	.bottom-tabs {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		height: calc(104rpx + env(safe-area-inset-bottom));
		height: calc(104rpx + constant(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		padding-bottom: constant(safe-area-inset-bottom);
		background: #fff;
		display: flex;
		border-top: 1px solid rgba(0, 0, 0, 0.03);
	}

	.tab-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 6rpx;
		padding-top: 14rpx;
		color: #8f8f94;
		font-size: 23rpx;
		line-height: 30rpx;
	}

	.tab-item.active {
		color: #5f8cff;
	}

	.tab-icon {
		width: 48rpx;
		height: 48rpx;
		flex-shrink: 0;
		opacity: 0.4;
		filter: grayscale(1);
	}

	.tab-item.active .tab-icon {
		opacity: 1;
		filter: none;
	}
</style>
