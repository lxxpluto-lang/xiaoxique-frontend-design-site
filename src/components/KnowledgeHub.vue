<template>
  <view class="knowledge-hub" data-testid="discover-content">
    <view class="section-heading"><view><text>精选内容</text><text>今天只看一条</text></view></view>
    <button v-if="featured" class="featured" @tap="emit('open', featured)">
      <image :src="featured.poster" mode="aspectFill" /><view><text>今日精选</text><text>{{ featured.title }}</text><text>{{ featured.summary }}</text><text>{{ featured.duration }} ›</text></view>
    </button>
    <view class="section-heading"><view><text>实用指南</text><text>短、明确、可执行</text></view></view>
    <view class="guide-list"><button v-for="item in guides" :key="item.id" @tap="emit('open', item)"><image :src="item.poster" mode="aspectFill" /><view><text>{{ item.title }}</text><text>{{ item.summary }}</text></view><text>›</text></button></view>
    <view class="section-heading"><view><text>健康短视频</text><text>两条就够</text></view></view>
    <view class="video-grid"><button v-for="item in videos" :key="item.id" @tap="emit('open', item)"><view><image :src="item.poster" mode="aspectFill" /><text>▶</text></view><text>{{ item.title }}</text><text>{{ item.duration }}</text></button></view>
    <text class="boundary">内容用于原型演示，正式发布前需完成医学审核。</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeItem, UserMode } from '@/lib/prototype-data'
const props = defineProps<{ mode: UserMode; items: KnowledgeItem[] }>()
const emit = defineEmits<{ (event: 'open', item: KnowledgeItem): void }>()
const eligible = computed(() => props.items.filter((item) => item.audience === 'all' || item.audience === props.mode))
const featured = computed(() => eligible.value.find((item) => item.type === 'guide' && item.recommendedFor.includes(props.mode)) || eligible.value[0])
const guides = computed(() => eligible.value.filter((item) => item.type === 'guide' && item.id !== featured.value?.id).slice(0, 2))
const videos = computed(() => eligible.value.filter((item) => item.type === 'video').slice(0, 2))
</script>

<style scoped lang="scss">
.knowledge-hub { display: grid; gap: 16rpx; padding: 0 24rpx 32rpx; }.section-heading { display: flex; margin-top: 12rpx; align-items: end; justify-content: space-between; }.section-heading view text { display: block; }.section-heading view text:first-child { color: #172b28; font-size: 29rpx; font-weight: 750; }.section-heading view text:last-child { margin-top: 4rpx; color: #7b8884; font-size: 21rpx; }
.featured { position: relative; display: grid; min-height: 240rpx; padding: 0; overflow: hidden; grid-template-columns: 42% 1fr; border-radius: 28rpx; background: #174f48; text-align: left; }.featured image { width: 100%; height: 100%; min-height: 240rpx; }.featured > view { display: flex; padding: 22rpx; flex-direction: column; }.featured > view text { display: block; color: #fff; }.featured > view text:first-child { align-self: start; padding: 6rpx 10rpx; border-radius: 999rpx; color: #155f55; background: #dff5ef; font-size: 19rpx; font-weight: 700; }.featured > view text:nth-child(2) { margin-top: 14rpx; font-size: 28rpx; font-weight: 700; }.featured > view text:nth-child(3) { display: -webkit-box; margin-top: 7rpx; overflow: hidden; color: rgba(255,255,255,.78); font-size: 20rpx; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.featured > view text:last-child { margin-top: auto; font-size: 20rpx; }
.guide-list { display: grid; gap: 10rpx; }.guide-list button { display: grid; min-height: 126rpx; padding: 13rpx; grid-template-columns: 134rpx 1fr auto; align-items: center; gap: 14rpx; border: 1rpx solid #e7eceb; border-radius: 22rpx; background: #fff; text-align: left; }.guide-list image { width: 134rpx; height: 100rpx; border-radius: 16rpx; }.guide-list view text { display: block; }.guide-list view text:first-child { color: #172b28; font-size: 25rpx; font-weight: 700; }.guide-list view text:last-child { display: -webkit-box; margin-top: 5rpx; overflow: hidden; color: #6c7875; font-size: 20rpx; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.guide-list > button > text { color: #91a09c; }
.video-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; }.video-grid button { padding: 0 0 14rpx; overflow: hidden; border: 1rpx solid #e7eceb; border-radius: 22rpx; background: #fff; text-align: left; }.video-grid button > view { position: relative; aspect-ratio: 16/9; }.video-grid image { width: 100%; height: 100%; }.video-grid button > view text { position: absolute; top: 50%; left: 50%; display: flex; width: 48rpx; height: 48rpx; align-items: center; justify-content: center; border-radius: 50%; color: #fff; background: rgba(15,88,75,.82); transform: translate(-50%,-50%); }.video-grid button > text { display: block; margin: 10rpx 12rpx 0; }.video-grid button > text:nth-child(2) { min-height: 60rpx; color: #172b28; font-size: 23rpx; font-weight: 700; line-height: 1.35; }.video-grid button > text:last-child { color: #87938f; font-size: 19rpx; }.boundary { display: block; padding: 16rpx; border-radius: 16rpx; color: #7c8784; background: #f2f5f4; font-size: 19rpx; line-height: 1.5; }
</style>
