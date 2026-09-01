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
  margin: 12rpx 0 30rpx;
}
.step {
  display: flex;
  align-items: center;
  width: 84rpx;
  flex-direction: column;
  color: #9ba7a3;
}
.step > text {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46rpx;
  height: 46rpx;
  border-radius: 50%;
  color: #84918c;
  background: #e6ece9;
  font-size: 22rpx;
  font-weight: 700;
}
.step .small-text { margin-top: 8rpx; font-size: 22rpx; }
.step.active > text,
.step.done > text { color: #fff; background: #16a085; }
.step.active .small-text,
.step.done .small-text { color: #0c7464; font-weight: 600; }
.step-line {
  width: 85rpx;
  height: 5rpx;
  margin-top: 21rpx;
  background: #dfe7e4;
}
.step-line.done,
.step-line.active { background: #16a085; }
</style>
