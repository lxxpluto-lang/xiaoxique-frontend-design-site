<template>
  <view class="stepper">
    <template v-for="(label, index) in labels" :key="label">
      <view class="step" :class="stateClass(index + 1)">
        <text>{{ index + 1 < current ? '✓' : index + 1 }}</text>
        <text class="small-text">{{ label }}</text>
      </view>
      <view v-if="index < labels.length - 1" class="step-line" :class="lineClass(index + 1)" />
    </template>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ current?: number }>(), { current: 1 })
const labels = ['运动前', '跟练', '运动后']

function stateClass(step: number) {
  if (step < props.current) return 'done'
  if (step === props.current) return 'active'
  return ''
}

function lineClass(step: number) {
  if (step < props.current) return 'done'
  if (step === props.current) return 'active'
  return ''
}
</script>

<style scoped>
.stepper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin: 16rpx 0 30rpx;
}
.step {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: #9ba7a3;
  width: 110rpx;
}
.step > text {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #646e6a;
  font-weight: 700;
  width: 58rpx;
  height: 58rpx;
  font-size: 28rpx;
  background: #e6f5ef;
}
.step .small-text {
  width: auto;
  height: auto;
  border-radius: 0;
  margin-top: 12rpx;
  background: transparent;
  font-size: 25rpx;
}
.step.active > text,
.step.done > text {
  color: #fff;
  background: var(--color-brand-pressed);
}
.step.active .small-text,
.step.done .small-text {
  font-weight: 600;
  background: transparent;
  color: var(--color-brand-pressed);
}
.step-line {
  height: 5rpx;
  background: #dfe7e4;
  width: 100rpx;
  margin-top: 28rpx;
}
.step-line.done,
.step-line.active {
  background: #16a085;
}
</style>
