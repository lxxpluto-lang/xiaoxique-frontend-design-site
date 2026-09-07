<template>
  <view class="screen-heading" :class="{ 'screen-heading--review': appearance === 'review', 'screen-heading--illustrated': !!artwork }">
    <image v-if="artwork" :src="artwork" mode="aspectFit" aria-hidden="true" />
    <text class="screen-kicker">{{ kicker }}</text>
    <text class="screen-title">{{ title }}</text>
    <text class="screen-copy">{{ copy }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{ kicker: string; title: string; copy: string; appearance?: 'review'; artwork?: string }>()
</script>

<style scoped>
.screen-heading {
  margin: 6rpx 2rpx 28rpx;
}
.screen-kicker,
.screen-title,
.screen-copy {
  display: block;
}
.screen-kicker {
  color: #16a085;
  font-size: 23rpx;
  font-weight: 700;
  letter-spacing: 0;
}
.screen-title {
  margin: 8rpx 0 10rpx;
  font-size: 38rpx;
  font-weight: 800;
  color: var(--color-text-primary);
}
.screen-copy {
  color: #646a73;
  font-size: 26rpx;
  line-height: 1.55;
}
.screen-heading--review .screen-kicker { font-size: 23rpx; }
.screen-heading--review .screen-title { margin: 15rpx 0 24rpx; font-size: 46rpx; }
.screen-heading--review .screen-copy { padding: 22rpx; border: 1rpx solid #c5e9dd; border-radius: 24rpx; background: #effbf6; color: #28745b; }
</style>
<style scoped>
.screen-heading--illustrated{position:relative;padding:20rpx 160rpx 20rpx 0;min-height:180rpx}.screen-heading--illustrated>image{position:absolute;right:0;bottom:0;width:170rpx;height:180rpx}.screen-heading--illustrated .screen-title{font-size:33rpx}.screen-heading--illustrated .screen-copy{font-size:23rpx}.screen-heading--illustrated>text{position:relative}
</style>
