<template>
  <view class="prototype-login" data-testid="prototype-login">
    <view class="login-header">
      <button class="login-back" aria-label="返回我的" @tap="emit('back')">‹</button>
      <text>账号入口</text>
      <view class="login-header-spacer" />
    </view>

    <view class="login-hero">
      <view class="login-hero-copy">
        <text class="login-eyebrow">小喜鹊运动伙伴</text>
        <text class="login-title">欢迎回来</text>
        <text class="login-subtitle">继续记录每一次安心运动</text>
      </view>
      <image class="login-magpie" src="/static/replica-v7/onboarding-flight.png" mode="aspectFit" aria-hidden="true" />
    </view>

    <view class="login-account-card">
      <image class="login-avatar" src="/static/replica-v7/default-avatar.svg" mode="aspectFit" aria-hidden="true" />
      <view class="login-account-copy">
        <text class="login-account-label">本机演示账号</text>
        <text class="login-account-name">{{ displayName }}</text>
        <text class="login-account-hint">训练记录保存在本机浏览器</text>
      </view>
      <text class="login-local-badge">本地</text>
    </view>

    <button class="login-primary" data-testid="continue-local-account" @tap="emit('continue')">继续使用此账号</button>
    <text class="login-note">当前为原型演示，不连接真实账号，也不会上传健康数据</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{ displayName: string }>();
const emit = defineEmits<{ (event: "continue"): void; (event: "back"): void }>();
</script>

<style scoped lang="scss">
.prototype-login {
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 30rpx) 30rpx 48rpx;
  color: var(--color-text-primary);
  background:
    radial-gradient(ellipse at 92% -8%, #c7f3e7 0, transparent 46%),
    linear-gradient(165deg, #effbf7 0%, #fff 64%, #f5fcfa 100%);
}
.login-header {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  min-height: 72rpx;
  text-align: center;
}
.login-header > text { font-size: 31rpx; font-weight: 750; }
.login-back {
  display: flex;
  width: 66rpx;
  height: 66rpx;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #fff;
  border-radius: 22rpx;
  color: #123a34;
  background: #f1fcf8;
  font-size: 60rpx;
  line-height: .85;
}
.login-header-spacer { width: 72rpx; }
.login-hero {
  position: relative;
  display: flex;
  min-height: 360rpx;
  margin-top: 36rpx;
  padding: 44rpx 30rpx;
  align-items: center;
  overflow: hidden;
  border-radius: 38rpx;
  background: linear-gradient(130deg, #dff8ef 0%, #f7fffc 74%);
  box-shadow: 0 22rpx 56rpx rgba(24, 107, 87, .08);
}
.login-hero-copy { position: relative; z-index: 1; width: 62%; }
.login-eyebrow, .login-title, .login-subtitle { display: block; }
.login-eyebrow { color: #148b76; font-size: 24rpx; font-weight: 700; }
.login-title { margin-top: 20rpx; font-size: 56rpx; font-weight: 800; letter-spacing: -2rpx; }
.login-subtitle { margin-top: 16rpx; color: #52736b; font-size: 26rpx; line-height: 1.6; }
.login-magpie { position: absolute; right: -12rpx; bottom: -8rpx; width: 280rpx; height: 300rpx; }
.login-account-card {
  display: flex;
  min-height: 176rpx;
  margin-top: 28rpx;
  padding: 24rpx;
  align-items: center;
  gap: 20rpx;
  border: 2rpx solid #e0efea;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, .96);
  box-shadow: var(--shadow-card);
}
.login-avatar { width: 100rpx; height: 100rpx; flex-shrink: 0; border-radius: 50%; }
.login-account-copy { flex: 1; min-width: 0; }
.login-account-copy > text { display: block; }
.login-account-label { color: #59766e; font-size: 23rpx; }
.login-account-name { margin-top: 8rpx; color: #153d38; font-size: 32rpx; font-weight: 750; }
.login-account-hint { margin-top: 8rpx; color: #81948e; font-size: 22rpx; }
.login-local-badge { padding: 8rpx 15rpx; border-radius: 999rpx; color: #0c846f; background: #e1f7ef; font-size: 22rpx; }
.login-primary {
  display: flex;
  width: 100%;
  min-height: 92rpx;
  margin-top: 30rpx;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #fff;
  background: var(--gradient-brand);
  box-shadow: 0 14rpx 28rpx rgba(12, 137, 117, .16);
  font-size: 30rpx;
  font-weight: 750;
}
.login-note { display: block; margin-top: 24rpx; color: #71867f; font-size: 22rpx; line-height: 1.6; text-align: center; }
</style>
