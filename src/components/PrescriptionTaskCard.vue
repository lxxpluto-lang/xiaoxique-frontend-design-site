<template>
  <view class="prescription-card prescription-presentation" :class="{ complete: completed, 'prescription-presentation--adjusted': !!adjustment }" data-testid="today-core-task">
    <view class="prescription-portrait"><image v-if="poster" :src="poster" mode="aspectFill" /><AppIcon v-else src="/static/icons/magpie-line/exercise.svg" :size="88" /></view>
    <view class="prescription-copy">
      <view class="prescription-badges"><text>今日训练计划</text><text>{{ completed ? '已完成' : '待完成' }}</text><text v-if="arSupported">AR互动</text></view>
      <text class="prescription-name">{{ item.project }}</text>
      <view class="prescription-fact"><AppIcon src="/static/icons/magpie-line/exercise.svg" :size="30" /><text>{{ item.duration }} · {{ item.intensity }}</text></view>
      <view class="prescription-fact"><AppIcon src="/static/icons/magpie-line/record.svg" :size="30" /><text>{{ item.frequency }}</text></view>
      <text class="prescription-reason">{{ item.category }} · {{ item.reason }}</text>
      <button class="task-primary" :disabled="!available" @tap="emit('start')">{{ !available ? '暂未适配小程序训练' : completed ? '再次训练' : '开始这一项' }}</button>
    </view>
    <text v-if="adjustment" class="prescription-adjustment">医生已确认：{{ adjustment }}</text>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import type { SharedPrescriptionItem } from '@/lib/shared-patient'
defineProps<{ item: SharedPrescriptionItem; poster?: string; available: boolean; arSupported?: boolean; completed: boolean; adjustment?: string }>()
const emit = defineEmits<{ (e: 'start'): void }>()
</script>

<style scoped lang="scss">
.prescription-presentation { display: grid; grid-template-columns: 40% minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); gap: 20rpx; align-items: stretch; min-height: 0; height: 100%; box-sizing: border-box; margin: 0; padding: 12rpx 22rpx 22rpx; border: 0; border-radius: 0; box-shadow: none; background: transparent; }
.prescription-presentation--adjusted { grid-template-rows: minmax(0, 1fr) auto; gap: 14rpx 20rpx; }
.prescription-portrait { display: flex; align-items: center; justify-content: center; min-width: 0; overflow: hidden; border-radius: 30rpx; background: linear-gradient(145deg, #d8f8ed, #f3fcf8); }
.prescription-portrait image { width: 100%; height: 100%; }
.prescription-copy { display: flex; min-width: 0; flex-direction: column; justify-content: center; gap: 10rpx; }
.prescription-badges { display: flex; flex-wrap: wrap; gap: 8rpx; font-size: 23rpx; color: #357968; }
.prescription-badges > text:first-child { padding: 7rpx 12rpx; border-radius: 10rpx; background: #e6f8f1; }
.prescription-badges > text:last-child { align-self: center; }
.prescription-name { color: #133f35; font-size: 31rpx; font-weight: 750; line-height: 1.4; }
.prescription-fact { display: flex; align-items: center; gap: 8rpx; font-size: 23rpx; color: #5e7a6e; line-height: 1.4; }
.prescription-reason { font-size: 23rpx; line-height: 1.5; color: #62706a; }
.prescription-presentation .task-primary { display: flex; width: 100%; min-height: 92rpx; margin-top: 2rpx; padding: 8rpx; align-items: center; justify-content: center; border-radius: 999rpx; background: var(--gradient-brand); color: #fff; font-size: 27rpx; line-height: 1.35; font-weight: 700; }
.prescription-presentation .task-primary[disabled] { color: #73877c; background: #e3eee7; }
.prescription-adjustment { grid-column: 1 / -1; color: #277c64; font-size: 23rpx; line-height: 1.5; }
</style>
