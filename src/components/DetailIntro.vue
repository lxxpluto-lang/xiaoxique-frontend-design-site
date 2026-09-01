<template>
  <view class="screen-heading">
    <text class="screen-kicker">{{ kicker }}</text>
    <text class="screen-title">{{ title }}</text>
    <text class="screen-copy">{{ copy }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{ kicker: string; title: string; copy: string }>()
</script>

<style scoped>
.screen-heading { margin: 6rpx 2rpx 28rpx; }
.screen-kicker,
.screen-title,
.screen-copy { display: block; }
.screen-kicker {
  color: #16a085;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 0;
}
.screen-title {
  margin: 8rpx 0 10rpx;
  color: #1f2329;
  font-size: 36rpx;
  font-weight: 700;
}
.screen-copy {
  color: #646a73;
  font-size: 26rpx;
  line-height: 1.55;
}
</style>
