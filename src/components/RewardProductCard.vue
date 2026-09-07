<template>
  <view class="reward-product" data-testid="reward-product-card" :data-reward-id="reward.id">
    <image v-if="artwork && !imageFailed" class="reward-product-art" :src="artwork" mode="aspectFit" @error="imageFailed = true" />
    <view v-else class="reward-product-fallback">{{ reward.icon }}</view>
    <text class="reward-product-name">{{ reward.name }}</text>
    <text class="reward-product-description">{{ reward.description }}</text>
    <view class="reward-product-price"><text>{{ reward.cost }}</text><text>{{ reward.audience === 'mem' ? 'M币' : '积分' }}</text></view>
    <button :disabled="!redeemable" :aria-label="reward.name + '，' + reward.cost + (reward.audience === 'mem' ? 'M币' : '积分') + (redeemable ? '，立即兑换' : '，余额不足')" @tap="emit('redeem')">{{ redeemable ? '立即兑换' : '余额不足' }}</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RewardItem } from '@/lib/prototype-data'
const props = defineProps<{ reward: RewardItem; redeemable: boolean }>()
const emit = defineEmits<{ (e: 'redeem'): void }>()
const imageFailed = ref(false)
const images: Record<string, string> = {
  'REWARD-001': '/static/replica-v7/reward-badge.png',
  'REWARD-002': '/static/replica-v7/reward-book.png',
  'REWARD-003': '/static/replica-v7/reward-band.png',
  'REWARD-004': '/static/replica/reward-notebook-v1.png',
  'REWARD-005': '/static/replica/reward-mem-badge-v1.png',
}
const artwork = computed(() => images[props.reward.id])
</script>

<style scoped lang="scss">
.reward-product { display: flex; min-width: 0; padding: 10rpx 10rpx 16rpx; flex-direction: column; gap: 12rpx; border: 1rpx solid #e0eee6; border-radius: 26rpx; background: linear-gradient(160deg, #f1faf6, #fff); }
.reward-product-art, .reward-product-fallback { display: flex; width: 100%; height: 190rpx; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 20rpx; background: #f1faf6; }
.reward-product-fallback { color: #218369; font-size: 58rpx; }
.reward-product-name { display: block; color: #164539; font-size: 24rpx; font-weight: 750; line-height: 1.5; }
.reward-product-description { display: block; color: #6b887a; font-size: 23rpx; line-height: 1.5; }
.reward-product-price { display: flex; gap: 8rpx; align-items: baseline; margin-top: auto; color: #008570; }
.reward-product-price > text:first-child { font-size: 42rpx; font-weight: 750; }
.reward-product-price > text:last-child { font-size: 23rpx; }
.reward-product button { display: flex; width: 100%; min-height: 92rpx; padding: 8rpx 0; align-items: center; justify-content: center; border-radius: 18rpx; background: var(--gradient-brand); color: #fff; font-size: 24rpx; font-weight: 650; line-height: 1.5; }
.reward-product button[disabled] { color: #789387; background: #e4eee8; }
</style>
<style scoped lang="scss">
.reward-product,.reward-product-art{background:#fff}.reward-product{border-color:#e8eeec;border-radius:24rpx}.reward-product-description{color:#607078}.reward-product-name{color:#142d32}
</style>
