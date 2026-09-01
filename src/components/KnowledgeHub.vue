<template>
  <view class="knowledge-hub" data-testid="knowledge-screen">
    <view class="knowledge-heading">
      <text class="knowledge-kicker">健康知识库</text>
      <text class="knowledge-title">看懂、会做、能坚持</text>
      <text class="knowledge-copy">指南、康复提示与短视频均为原型内容，正式发布前需由医学专家审核。</text>
    </view>

    <view class="knowledge-search">
      <view class="search-mark">⌕</view>
      <input
        :value="query"
        confirm-type="search"
        placeholder="搜索心脏康复、减重或运动安全"
        @input="updateQuery"
      />
      <button v-if="query" @tap="emit('update:query', '')">清除</button>
    </view>

    <scroll-view class="knowledge-tabs" scroll-x :show-scrollbar="false">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: category === tab.id }"
        @tap="emit('update:category', tab.id)"
      >
        {{ tab.label }}
      </button>
    </scroll-view>

    <template v-if="query">
      <view class="knowledge-section-head"><view><text>搜索结果</text><text class="small-text">共找到 {{ filteredItems.length }} 条内容</text></view></view>
      <view v-if="filteredItems.length" class="knowledge-list">
        <button v-for="item in filteredItems" :key="item.id" class="knowledge-result-card" @tap="emit('open', item)">
          <image :src="item.poster" mode="aspectFill" />
          <view><text class="content-type">{{ typeLabel(item.type) }}</text><text class="result-title">{{ item.title }}</text><text class="result-copy">{{ item.summary }}</text><text class="result-meta">{{ item.duration }} · 待医学审核</text></view>
          <text class="result-arrow">›</text>
        </button>
      </view>
      <view v-else class="knowledge-empty"><view class="empty-icon">知</view><text>没有找到相关内容</text><text class="small-text">换一个关键词，或返回查看全部指南与短视频。</text><button @tap="clearSearch">查看全部内容</button></view>
    </template>

    <template v-else-if="category === 'recommended'">
      <button v-if="featuredItem" class="knowledge-featured" @tap="emit('open', featuredItem)">
        <image :src="featuredItem.poster" mode="aspectFill" />
        <view class="featured-overlay" />
        <view class="featured-body"><text class="featured-tag">{{ mode === 'cardiac' ? '心脏康复推荐' : '今日推荐' }}</text><text class="featured-title">{{ featuredItem.title }}</text><text class="featured-copy">{{ featuredItem.summary }}</text><view><text>{{ featuredItem.duration }}</text><text>查看内容 ›</text></view></view>
      </button>

      <view class="knowledge-section-head"><view><text>实用指南</text><text class="small-text">把重要信息整理成容易执行的步骤</text></view><button @tap="emit('update:category', 'guide')">查看全部 ›</button></view>
      <view class="guide-stack"><button v-for="item in recommendedGuides" :key="item.id" class="guide-card" @tap="emit('open', item)"><image :src="item.poster" mode="aspectFill" /><view><text class="content-type">指南</text><text class="guide-title">{{ item.title }}</text><text class="guide-copy">{{ item.summary }}</text><text class="guide-meta">{{ item.duration }} · 待医学审核</text></view><text class="result-arrow">›</text></button></view>

      <view class="knowledge-section-head"><view><text>康复小贴士</text><text class="small-text">短一点，更容易记住</text></view><button @tap="emit('update:category', 'tip')">查看全部 ›</button></view>
      <view class="tip-stack"><button v-for="item in recommendedTips" :key="item.id" class="knowledge-tip-card" @tap="emit('open', item)"><view class="tip-mark">提</view><view><text class="tip-title">{{ item.title }}</text><text class="tip-copy">{{ item.summary }}</text></view><text class="result-arrow">›</text></button></view>

      <view class="knowledge-section-head"><view><text>健康短视频</text><text class="small-text">可点击播放的本地原型素材</text></view><button @tap="emit('update:category', 'video')">查看全部 ›</button></view>
      <view class="video-grid"><button v-for="item in recommendedVideos" :key="item.id" class="video-card" @tap="emit('open', item)"><view class="video-poster"><image :src="item.poster" mode="aspectFill" /><view class="play-button">▶</view><text>{{ item.duration }}</text></view><text class="video-title">{{ item.title }}</text><text class="video-copy">原型演示 · 待医学审核</text></button></view>
    </template>

    <template v-else-if="category === 'guide'">
      <view class="knowledge-section-head"><view><text>指南</text><text class="small-text">居家安全、心脏康复与健康减重</text></view></view>
      <view class="guide-stack"><button v-for="item in filteredItems" :key="item.id" class="guide-card guide-card--large" @tap="emit('open', item)"><image :src="item.poster" mode="aspectFill" /><view><text class="content-type">指南</text><text class="guide-title">{{ item.title }}</text><text class="guide-copy">{{ item.summary }}</text><view class="tag-list"><text v-for="tag in item.tags" :key="tag">{{ tag }}</text></view><text class="guide-meta">{{ item.duration }} · 待医学审核</text></view><text class="result-arrow">›</text></button></view>
    </template>

    <template v-else-if="category === 'tip'">
      <view class="knowledge-section-head"><view><text>康复小贴士</text><text class="small-text">重要提示保持简短、清楚、可执行</text></view></view>
      <view class="tip-stack"><button v-for="item in filteredItems" :key="item.id" class="knowledge-tip-card knowledge-tip-card--large" @tap="emit('open', item)"><view class="tip-mark">提</view><view><text class="tip-title">{{ item.title }}</text><text class="tip-copy">{{ item.summary }}</text><view class="tag-list"><text v-for="tag in item.tags" :key="tag">{{ tag }}</text></view></view><text class="result-arrow">›</text></button></view>
    </template>

    <template v-else>
      <view class="knowledge-section-head"><view><text>健康短视频</text><text class="small-text">演示素材可正常播放，正式内容后续替换</text></view></view>
      <view class="video-grid"><button v-for="item in filteredItems" :key="item.id" class="video-card" @tap="emit('open', item)"><view class="video-poster"><image :src="item.poster" mode="aspectFill" /><view class="play-button">▶</view><text>{{ item.duration }}</text></view><text class="video-title">{{ item.title }}</text><text class="video-summary">{{ item.summary }}</text><text class="video-copy">原型演示 · 待医学审核</text></button></view>
    </template>

    <view class="knowledge-boundary"><text>内容边界</text><text>知识库用于健康教育原型展示，不提供诊断、用药调整或个体化处方。紧急不适请立即停止运动并寻求医疗帮助。</text></view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeCategory, KnowledgeItem, KnowledgeItemType, UserMode } from '@/lib/prototype-data'

const props = defineProps<{
  mode: UserMode
  category: KnowledgeCategory
  query: string
  items: KnowledgeItem[]
}>()

const emit = defineEmits<{
  (event: 'update:category', value: KnowledgeCategory): void
  (event: 'update:query', value: string): void
  (event: 'open', value: KnowledgeItem): void
}>()

const tabs: { id: KnowledgeCategory; label: string }[] = [
  { id: 'recommended', label: '推荐' },
  { id: 'guide', label: '指南' },
  { id: 'tip', label: '小贴士' },
  { id: 'video', label: '短视频' },
]

function recommendationScore(item: KnowledgeItem) {
  let score = item.recommendedFor.includes(props.mode) ? 20 : 0
  if (props.mode === 'cardiac') {
    if (item.id.includes('CARDIAC')) score += 10
    if (item.id.includes('STOP')) score += 8
    if (item.id.includes('BORG')) score += 6
  } else {
    if (item.id.includes('WEIGHT')) score += 10
    if (item.id.includes('HABIT')) score += 8
    if (item.id.includes('RECOVERY')) score += 6
  }
  return score
}

const availableItems = computed(() => props.items.filter((item) => item.audience === 'all' || item.audience === props.mode))
const recommendedItems = computed(() => [...availableItems.value].sort((a, b) => recommendationScore(b) - recommendationScore(a)))
const featuredItem = computed(() => recommendedItems.value.find((item) => item.type === 'guide'))
const recommendedGuides = computed(() => recommendedItems.value.filter((item) => item.type === 'guide' && item.id !== featuredItem.value?.id).slice(0, 2))
const recommendedTips = computed(() => recommendedItems.value.filter((item) => item.type === 'tip').slice(0, 3))
const recommendedVideos = computed(() => recommendedItems.value.filter((item) => item.type === 'video').slice(0, 2))
const filteredItems = computed(() => {
  const keyword = props.query.trim().toLowerCase()
  if (keyword) return availableItems.value.filter((item) => `${item.title} ${item.summary} ${item.tags.join(' ')}`.toLowerCase().includes(keyword))
  if (props.category === 'recommended') return recommendedItems.value
  return availableItems.value.filter((item) => item.type === props.category)
})

function updateQuery(event: unknown) {
  const payload = event as { detail?: { value?: string }; target?: { value?: string } }
  emit('update:query', payload.detail?.value ?? payload.target?.value ?? '')
}
function clearSearch() { emit('update:query', ''); emit('update:category', 'recommended') }
function typeLabel(type: KnowledgeItemType) { return type === 'guide' ? '指南' : type === 'tip' ? '小贴士' : '短视频' }
</script>

<style scoped lang="scss">
.knowledge-hub { padding: 24rpx 24rpx 72rpx; }
.knowledge-heading { padding: 4rpx 2rpx 20rpx; }
.knowledge-kicker, .knowledge-title, .knowledge-copy { display: block; }
.knowledge-kicker { color: #0c7464; font-size: 22rpx; font-weight: 600; }
.knowledge-title { margin-top: 7rpx; color: #1f2329; font-size: 36rpx; font-weight: 700; line-height: 1.3; }
.knowledge-copy { margin-top: 8rpx; color: #646a73; font-size: 24rpx; line-height: 1.55; }
.knowledge-search { display: grid; min-height: 88rpx; padding: 0 18rpx; grid-template-columns: 40rpx minmax(0, 1fr) auto; align-items: center; gap: 10rpx; border: 1rpx solid #8fc9c4; border-radius: 20rpx; background: #fff; box-shadow: none; }
.search-mark { color: #16a085; font-size: 34rpx; transform: rotate(-16deg); }
.knowledge-search input { height: 86rpx; color: #1f2329; font-size: 26rpx; }
.knowledge-search button { padding: 8rpx 10rpx; color: #0c7464; font-size: 22rpx; font-weight: 600; }
.knowledge-tabs { margin-top: 18rpx; white-space: nowrap; }
.knowledge-tabs button { position: relative; display: inline-flex; min-height: 76rpx; padding: 0 28rpx; align-items: center; justify-content: center; color: #646a73; font-size: 24rpx; }
.knowledge-tabs button.active { color: #1f2329; font-weight: 600; }
.knowledge-tabs button.active::after { position: absolute; right: 29%; bottom: 3rpx; left: 29%; height: 5rpx; border-radius: 999rpx; background: #16a085; content: ''; }
.knowledge-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20rpx; margin: 30rpx 2rpx 15rpx; }
.knowledge-section-head > view > text:first-child { display: block; color: #1f2329; font-size: 32rpx; font-weight: 600; }
.knowledge-section-head .small-text { display: block; margin-top: 5rpx; color: #646a73; font-size: 22rpx; }
.knowledge-section-head > button { flex-shrink: 0; color: #0c7464; font-size: 22rpx; font-weight: 600; }
.knowledge-featured { position: relative; width: 100%; height: 330rpx; margin-top: 22rpx; overflow: hidden; border-radius: 24rpx; background: #dcefeb; text-align: left; box-shadow: none; }
.knowledge-featured > image { width: 100%; height: 100%; }
.featured-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(17,49,52,.86), rgba(17,49,52,.18)); }
.featured-body { position: absolute; inset: 0; display: flex; max-width: 75%; padding: 28rpx; flex-direction: column; }
.featured-tag { align-self: flex-start; padding: 7rpx 12rpx; border-radius: 999rpx; color: #155f5b; background: #d8f1ed; font-size: 22rpx; font-weight: 700; }
.featured-title { display: block; margin-top: 16rpx; color: #fff; font-size: 32rpx; font-weight: 600; }
.featured-copy { display: block; margin-top: 9rpx; overflow: hidden; color: rgba(255,255,255,.86); font-size: 22rpx; line-height: 1.45; }
.featured-body > view { display: flex; justify-content: space-between; gap: 20rpx; margin-top: auto; color: #fff; font-size: 22rpx; }
.guide-stack, .tip-stack, .knowledge-list { display: grid; gap: 14rpx; }
.guide-card, .knowledge-result-card { display: grid; width: 100%; min-height: 154rpx; padding: 16rpx; grid-template-columns: 170rpx minmax(0, 1fr) 22rpx; align-items: center; gap: 16rpx; border: 1rpx solid #ebeef2; border-radius: 24rpx; background: #fff; text-align: left; box-shadow: none; }
.guide-card > image, .knowledge-result-card > image { width: 170rpx; height: 126rpx; border-radius: 17rpx; background: #e8f4f1; }
.guide-card > view, .knowledge-result-card > view { min-width: 0; }
.content-type { display: inline-block; padding: 5rpx 10rpx; border-radius: 999rpx; color: #0c7464; background: #eaf8f4; font-size: 22rpx; font-weight: 500; }
.guide-title, .result-title { display: block; margin-top: 7rpx; color: #1f2329; font-size: 28rpx; font-weight: 600; }
.guide-copy, .result-copy { display: -webkit-box; margin-top: 5rpx; overflow: hidden; color: #646a73; font-size: 22rpx; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.guide-meta, .result-meta { display: block; margin-top: 7rpx; color: #8f959e; font-size: 22rpx; }
.result-arrow { color: #8ea0ad; font-size: 30rpx; }
.guide-card--large { min-height: 188rpx; }
.guide-card--large > image { height: 154rpx; }
.tag-list { display: flex; gap: 7rpx; margin-top: 8rpx; flex-wrap: wrap; }
.tag-list text { padding: 5rpx 9rpx; border-radius: 999rpx; color: #0c7464; background: #eef9f6; font-size: 22rpx; }
.knowledge-tip-card { display: grid; min-height: 112rpx; padding: 18rpx; grid-template-columns: 58rpx minmax(0, 1fr) 22rpx; align-items: center; gap: 14rpx; border: 1rpx solid rgba(23,50,77,.07); border-radius: 22rpx; background: #fff; text-align: left; }
.tip-mark { display: flex; width: 58rpx; height: 58rpx; align-items: center; justify-content: center; border-radius: 18rpx; color: #0c7464; background: #e5f7f1; font-size: 22rpx; font-weight: 600; }
.tip-title { display: block; color: #1f2329; font-size: 28rpx; font-weight: 600; }
.tip-copy { display: -webkit-box; margin-top: 5rpx; overflow: hidden; color: #646a73; font-size: 22rpx; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.knowledge-tip-card--large { min-height: 142rpx; align-items: start; }
.video-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14rpx; }
.video-card { min-width: 0; padding: 0 0 16rpx; overflow: hidden; border: 1rpx solid #ebeef2; border-radius: 24rpx; background: #fff; text-align: left; box-shadow: none; }
.video-poster { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: #dcefeb; }
.video-poster image { width: 100%; height: 100%; }
.play-button { position: absolute; top: 50%; left: 50%; display: flex; width: 54rpx; height: 54rpx; align-items: center; justify-content: center; border: 3rpx solid rgba(255,255,255,.9); border-radius: 50%; color: #fff; background: rgba(31,126,121,.88); font-size: 22rpx; transform: translate(-50%, -50%); }
.video-poster > text { position: absolute; right: 9rpx; bottom: 8rpx; padding: 4rpx 7rpx; border-radius: 8rpx; color: #fff; background: rgba(15,23,42,.66); font-size: 22rpx; }
.video-title { display: -webkit-box; min-height: 74rpx; margin: 14rpx 14rpx 0; overflow: hidden; color: #1f2329; font-size: 26rpx; font-weight: 600; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.video-summary { display: -webkit-box; min-height: 51rpx; margin: 7rpx 14rpx 0; overflow: hidden; color: #646a73; font-size: 22rpx; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.video-copy { display: block; margin: 8rpx 14rpx 0; color: #8f959e; font-size: 22rpx; }
.knowledge-empty { display: flex; align-items: center; padding: 70rpx 30rpx; flex-direction: column; border: 1rpx dashed #bdced5; border-radius: 24rpx; background: #fff; text-align: center; }
.empty-icon { display: flex; width: 74rpx; height: 74rpx; align-items: center; justify-content: center; border-radius: 22rpx; color: #0c7464; background: #e5f7f1; font-size: 28rpx; font-weight: 600; }
.knowledge-empty > text { margin-top: 18rpx; color: #1f2329; font-size: 24rpx; font-weight: 600; }
.knowledge-empty .small-text { margin-top: 7rpx; color: #646a73; font-size: 22rpx; font-weight: 400; }
.knowledge-empty button { display: flex; min-height: 88rpx; margin-top: 22rpx; padding: 0 24rpx; align-items: center; border-radius: 20rpx; color: #fff; background: #16a085; font-size: 26rpx; font-weight: 600; }
.knowledge-boundary { margin-top: 28rpx; padding: 20rpx; border-radius: 20rpx; color: #646a73; background: #f4f7f8; font-size: 22rpx; line-height: 1.55; }
.knowledge-boundary text { display: block; }
.knowledge-boundary text:first-child { margin-bottom: 5rpx; color: #1f2329; font-weight: 700; }
@media (max-width: 370px) {
  .guide-card, .knowledge-result-card { grid-template-columns: 145rpx minmax(0, 1fr) 18rpx; }
  .guide-card > image, .knowledge-result-card > image { width: 145rpx; }
}
</style>
