<template>
  <view class="knowledge-hub" data-testid="discover-content">
    <view class="section-heading"><view><text>精选内容</text><text>今天只看一条</text></view></view>
    <button v-if="featured" class="featured" @tap="emit('open', featured)">
      <view class="featured-icon"><AppIcon src="/static/icons/magpie-line/knowledge.svg" :size="48" color="#0F766E" /></view><view><text>今日精选</text><text>{{ featured.title }}</text><text>{{ featured.summary }}</text><text>{{ featured.duration }} ›</text></view>
    </button>
    <view class="section-heading"><view><text>实用指南</text><text>短、明确、可执行</text></view></view>
    <view class="guide-list"><button v-for="item in guides" :key="item.id" @tap="emit('open', item)"><view class="content-icon"><AppIcon src="/static/icons/magpie-line/safety.svg" :size="38" color="#0F766E" /></view><view><text>{{ item.title }}</text><text>{{ item.summary }}</text></view><text>›</text></button></view>
    <view class="section-heading"><view><text>健康短视频</text><text>两条就够</text></view></view>
    <view class="video-list"><button v-for="item in videos" :key="item.id" @tap="emit('open', item)"><view class="video-icon">▶</view><view><text>{{ item.title }}</text><text>{{ item.duration }} · 视频</text></view><text>›</text></button></view>
    <text class="boundary">内容用于原型演示，正式发布前需完成医学审核。</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { KnowledgeItem, UserMode } from '@/lib/prototype-data'
const props = defineProps<{ mode: UserMode; items: KnowledgeItem[] }>()
const emit = defineEmits<{ (event: 'open', item: KnowledgeItem): void }>()
const eligible = computed(() => props.items.filter((item) => item.audience === 'all' || item.audience === props.mode))
const featured = computed(() => eligible.value.find((item) => item.type === 'guide' && item.recommendedFor.includes(props.mode)) || eligible.value[0])
const guides = computed(() => eligible.value.filter((item) => item.type === 'guide' && item.id !== featured.value?.id).slice(0, 2))
const videos = computed(() => eligible.value.filter((item) => item.type === 'video').slice(0, 2))
</script>

<style scoped lang="scss">
.knowledge-hub { display: grid; gap: 20rpx; padding: 0 24rpx 48rpx; }.section-heading { display: flex; margin-top: 20rpx; align-items: end; justify-content: space-between; }.section-heading view text { display: block; }.section-heading view text:first-child { color: #1e293b; font-size: 32rpx; font-weight: 600; }.section-heading view text:last-child { margin-top: 6rpx; color: #64748b; font-size: 24rpx; }
.featured { display: grid; min-height: 220rpx; padding: 28rpx; grid-template-columns: 88rpx 1fr; align-items: start; gap: 24rpx; border: 0; border-radius: 24rpx; background: linear-gradient(145deg,#ecfdf5,#fff); text-align: left; box-shadow: 0 4rpx 16rpx rgba(15,23,42,.05); }.featured-icon { display: flex; width: 88rpx; height: 88rpx; align-items: center; justify-content: center; border-radius: 20rpx; background: #ccfbf1; }.featured > view:last-child { min-width: 0; }.featured > view:last-child text { display: block; }.featured > view:last-child text:first-child { color: #0f766e; font-size: 22rpx; font-weight: 600; }.featured > view:last-child text:nth-child(2) { margin-top: 8rpx; color: #1e293b; font-size: 30rpx; font-weight: 600; }.featured > view:last-child text:nth-child(3) { display: -webkit-box; margin-top: 10rpx; overflow: hidden; color: #64748b; font-size: 24rpx; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.featured > view:last-child text:last-child { margin-top: 14rpx; color: #0ea5a4; font-size: 22rpx; font-weight: 600; }
.guide-list,.video-list { display: grid; gap: 16rpx; }.guide-list button,.video-list button { display: grid; min-height: 132rpx; padding: 20rpx 24rpx; grid-template-columns: 72rpx 1fr auto; align-items: center; gap: 20rpx; border: 0; border-radius: 24rpx; background: #fff; text-align: left; box-shadow: 0 4rpx 16rpx rgba(15,23,42,.05); }.content-icon,.video-icon { display: flex; width: 72rpx; height: 72rpx; align-items: center; justify-content: center; border-radius: 16rpx; color: #0f766e; background: #f0fdfa; font-size: 22rpx; }.video-icon { color: #fff; background: #0ea5a4; font-size: 22rpx; }.guide-list button > view:nth-child(2) text,.video-list button > view:nth-child(2) text { display: block; }.guide-list button > view:nth-child(2) text:first-child,.video-list button > view:nth-child(2) text:first-child { color: #1e293b; font-size: 28rpx; font-weight: 600; }.guide-list button > view:nth-child(2) text:last-child { display: -webkit-box; margin-top: 6rpx; overflow: hidden; color: #64748b; font-size: 22rpx; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }.video-list button > view:nth-child(2) text:last-child { margin-top: 6rpx; color: #94a3b8; font-size: 22rpx; }.guide-list > button > text,.video-list > button > text { color: #cbd5e1; font-size: 36rpx; }
.boundary { display: block; padding: 20rpx 24rpx; border-radius: 16rpx; color: #64748b; background: #f1f5f9; font-size: 22rpx; line-height: 1.5; }
</style>
