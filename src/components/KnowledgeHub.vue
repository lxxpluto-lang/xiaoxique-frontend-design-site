<template>
  <view class="knowledge-hub" data-testid="discover-content">
    <view class="knowledge-search-box"><view class="search-symbol" aria-hidden="true" /><input v-model="query" data-testid="knowledge-search" aria-label="搜索康复知识" placeholder="搜索康复知识" confirm-type="search" /><button v-if="query" aria-label="清空搜索" @tap="query = ''">×</button></view>
    <view class="knowledge-filters" role="tablist"><button v-for="item in filters" :key="item.id" data-testid="knowledge-filter" :class="{ selected: filter === item.id }" :aria-selected="filter === item.id" @tap="filter = item.id">{{ item.label }}</button></view>
    <button v-if="featured" class="knowledge-featured" :data-knowledge-id="featured.id" data-testid="knowledge-featured" @tap="emit('open', featured)">
      <image src="/static/replica-v7/knowledge-plant.png" mode="aspectFit" />
      <view><text class="review-tag">内容待医学审核</text><text class="featured-title">{{ featured.title }}</text><text class="featured-summary">{{ featured.summary }}</text><text class="featured-action">查看详情 ›</text></view>
    </button>
    <view v-if="spotlights.length" class="knowledge-spotlights" data-testid="region-knowledge-spotlights">
      <button v-for="item in spotlights" :key="item.id" :data-testid="item.type === 'video' ? 'knowledge-video-entry' : 'knowledge-guide'" :data-knowledge-id="item.id" @tap="emit('open', item)">
        <text v-if="item.type === 'video'" class="spotlight-video-tag">▶ 演示视频</text><text class="spotlight-title">{{ item.title }}</text><text class="spotlight-duration">{{ item.duration }}</text>
        <view class="spotlight-art"><image :src="spotlightArtwork(item)" mode="aspectFit" /><text>{{ item.type === 'video' ? '▶' : '›' }}</text></view>
      </button>
    </view>
    <slot v-if="showRecommended" name="community" />
    <view v-if="guides.length" class="knowledge-section-heading"><text>精选资讯</text><text>{{ guides.length }} 篇内容</text></view>
    <view v-if="guides.length" class="knowledge-editorial-list">
      <button v-for="item in guides" :key="item.id" :data-knowledge-id="item.id" data-testid="knowledge-guide" @tap="emit('open', item)">
        <view class="editorial-art"><AppIcon :src="item.type === 'tip' ? '/static/icons/magpie-line/heart-rate.svg' : '/static/icons/magpie-line/knowledge.svg'" :size="77" /></view>
        <view><text class="editorial-title">{{ item.title }}</text><text class="editorial-summary">{{ item.summary }}</text><text class="editorial-meta">{{ item.tags[0] }} · {{ item.duration }}</text></view><text class="editorial-arrow">›</text>
      </button>
    </view>
    <view v-if="videos.length" class="knowledge-section-heading"><text>健康短视频</text><text>{{ videos.length }} 条内容</text></view>
    <view v-if="videos.length" class="knowledge-video-list">
      <button v-for="item in videos" :key="item.id" :data-knowledge-id="item.id" data-testid="knowledge-video-entry" @tap="emit('open', item)">
        <view class="video-cover"><image :src="item.poster" mode="aspectFill" /><text>▶</text></view><view class="video-copy"><text>{{ item.title }}</text><text>{{ item.summary }}</text><text>{{ item.tags[0] }} · {{ item.duration }}</text></view>
      </button>
    </view>
    <view v-if="!filtered.length" class="knowledge-empty" data-testid="knowledge-empty"><AppIcon src="/static/icons/magpie-line/knowledge.svg" :size="70" /><text>没有找到相关内容</text><text>换个关键词，或返回推荐内容。</text><button @tap="query = ''; filter = 'all'">查看全部</button></view>
    <text class="knowledge-safety-boundary">内容用于本地原型演示，正式发布前需完成医学审核。不替代医生诊断或处方。</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { KnowledgeItem, UserMode } from '@/lib/prototype-data'
const props = defineProps<{ mode: UserMode; items: KnowledgeItem[] }>()
const emit = defineEmits<{ (event: 'open', item: KnowledgeItem): void }>()
const query = ref('')
const filter = ref('all')
const filters = [{ id: 'all', label: '推荐' }, { id: 'guide', label: '指南' }, { id: 'exercise', label: '运动' }, { id: 'diet', label: '饮食' }, { id: 'video', label: '视频' }]
const eligible = computed(() => props.items.filter(item => item.audience === 'all' || item.audience === props.mode))
const filtered = computed(() => eligible.value.filter(item => {
  const content = [item.title, item.summary, ...item.tags].join(' ')
  if (query.value.trim() && !content.toLowerCase().includes(query.value.trim().toLowerCase())) return false
  if (filter.value === 'guide') return item.type === 'guide'
  if (filter.value === 'video') return item.type === 'video'
  if (filter.value === 'exercise') return /运动|训练|锻炼|热身|呼吸|Borg/.test(content)
  if (filter.value === 'diet') return /饮食|营养|膳食/.test(content)
  return true
}))
const featured = computed(() => filtered.value.find(item => item.type === 'guide' && item.recommendedFor.includes(props.mode)) || filtered.value.find(item => item.type !== 'video'))
const showRecommended = computed(() => filter.value === 'all' && !query.value.trim())
const spotlightIds = ['TIP-BEFORE-CHECK', 'TIP-BORG', 'VIDEO-WARM-UP']
const spotlights = computed(() => showRecommended.value ? spotlightIds.map(id => filtered.value.find(item => item.id === id)).filter((item): item is KnowledgeItem => !!item && item.id !== featured.value?.id) : [])
const promotedIds = computed(() => new Set(spotlights.value.map(item => item.id)))
const guides = computed(() => filtered.value.filter(item => item.type !== 'video' && item.id !== featured.value?.id && !promotedIds.value.has(item.id)))
const videos = computed(() => filtered.value.filter(item => item.type === 'video' && !promotedIds.value.has(item.id)))
function spotlightArtwork(item: KnowledgeItem) {
  if (item.id === 'TIP-BEFORE-CHECK') return '/static/replica-v7/knowledge-checklist.png'
  if (item.id === 'TIP-BORG') return '/static/replica-v7/knowledge-effort.png'
  return '/static/replica-v7/knowledge-bird.png'
}
</script>

<style scoped lang="scss">
.knowledge-hub { display: grid; gap: 22rpx; padding: 0 28rpx 48rpx; }
.knowledge-search-box { display: flex; min-height: 86rpx; align-items: center; gap: 22rpx; padding: 0 30rpx; border-radius: 999rpx; background: #fff; box-shadow: var(--shadow-card); }
.search-symbol { position: relative; flex-shrink: 0; width: 28rpx; height: 28rpx; border: 4rpx solid #84938b; border-radius: 50%; }
.search-symbol::after { content: ''; position: absolute; right: -11rpx; bottom: -8rpx; width: 18rpx; height: 4rpx; transform: rotate(45deg); border-radius: 4rpx; background: #84938b; }
.knowledge-search-box input { flex: 1; min-width: 0; font-size: 30rpx; }
.knowledge-search-box button { width: 50rpx; height: 60rpx; padding: 0; background: transparent; color: #7a9186; font-size: 35rpx; }
.knowledge-filters { display: flex; justify-content: space-between; padding: 0 12rpx; }
.knowledge-filters button { position: relative; min-height: 92rpx; padding: 0 14rpx; background: transparent; font-size: 29rpx; color: #61776c; }
.knowledge-filters button.selected { font-weight: 750; color: #007e6c; }
.knowledge-filters button.selected::after { content: ''; position: absolute; bottom: 3rpx; left: 29%; width: 42%; height: 7rpx; border-radius: 99rpx; background: #009b86; }
.knowledge-featured { position: relative; width: 100%; min-height: 350rpx; overflow: hidden; padding: 28rpx; border: 2rpx solid #fff; border-radius: 36rpx; background: #f1faf6; text-align: left; line-height: 1.5; box-shadow: var(--shadow-card); }
.knowledge-featured > image { position: absolute; width: 320rpx; height: 100%; right: -24rpx; bottom: 0; border-radius: 36rpx; }
.knowledge-featured > view { position: relative; max-width: 77%; }
.review-tag { display: inline-block; padding: 8rpx 16rpx; border-radius: 14rpx; background: #d4f1e5; color: #2a7360; font-size: 23rpx; }
.featured-title { display: block; margin-top: 22rpx; font-size: 40rpx; font-weight: 800; line-height: 1.4; color: #0b4639; }
.featured-summary { display: block; max-width: 82%; margin-top: 16rpx; font-size: 25rpx; color: #57786a; line-height: 1.65; }
.featured-action { display: inline-flex; min-height: 66rpx; margin-top: 22rpx; padding: 0 25rpx; align-items: center; border-radius: 999rpx; background: var(--gradient-brand); color: #fff; font-size: 26rpx; }
.knowledge-spotlights { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14rpx; }
.knowledge-spotlights > button { display: flex; min-width: 0; min-height: 340rpx; width: 100%; padding: 21rpx 14rpx 12rpx; flex-direction: column; border: 2rpx solid #fff; border-radius: 30rpx; background: #f1faf6; text-align: left; line-height: 1.5; box-shadow: var(--shadow-card); }
.spotlight-video-tag { color: #087567; font-size: 23rpx; margin-bottom: 5rpx; }
.spotlight-title { color: #164739; font-size: 27rpx; font-weight: 750; line-height: 1.55; }
.spotlight-duration { color: #587264; margin-top: 12rpx; font-size: 23rpx; line-height: 1.5; }
.spotlight-art { position: relative; display: flex; height: 150rpx; margin-top: auto; align-items: center; justify-content: center; }
.spotlight-art > image { width: 160rpx; height: 150rpx; border-radius: 24rpx; }
.spotlight-art > text { position: absolute; display: flex; right: -4rpx; bottom: 0; width: 43rpx; height: 43rpx; align-items: center; justify-content: center; border-radius: 50%; background: #fff; color: #008374; font-size: 28rpx; box-shadow: 0 3rpx 10rpx #168b6d12; }
.knowledge-section-heading { display: flex; align-items: center; justify-content: space-between; margin-top: 10rpx; }
.knowledge-section-heading > text:first-child { font-size: 32rpx; font-weight: 750; }
.knowledge-section-heading > text:last-child { font-size: 23rpx; color: #5e766a; }
.knowledge-editorial-list { display: grid; gap: 16rpx; }
.knowledge-editorial-list > button { display: grid; width: 100%; min-width: 0; grid-template-columns: 124rpx minmax(0,1fr) 20rpx; gap: 20rpx; align-items: center; padding: 22rpx; border-radius: 28rpx; background: #fff; text-align: left; }
.editorial-art { display: flex; width: 124rpx; height: 138rpx; align-items: center; justify-content: center; border-radius: 22rpx; background: #eaf8f0; }
.editorial-title,.editorial-summary,.editorial-meta { display: block; }
.editorial-title { color: #173e32; font-size: 28rpx; font-weight: 700; line-height: 1.5; }
.editorial-summary { margin-top: 10rpx; color: #63796c; font-size: 23rpx; line-height: 1.6; }
.editorial-meta { margin-top: 10rpx; color: #2c826a; font-size: 23rpx; }
.editorial-arrow { color: #12816a; font-size: 34rpx; }
.knowledge-video-list { display: grid; gap: 18rpx; }
.knowledge-video-list > button { display: grid; width: 100%; grid-template-columns: 236rpx minmax(0,1fr); gap: 22rpx; overflow: hidden; padding: 18rpx; border-radius: 32rpx; background: #fff; text-align: left; box-shadow: var(--shadow-card); }
.video-cover { position: relative; height: 195rpx; border-radius: 22rpx; overflow: hidden; background: #e5f3ec; }
.video-cover image { width: 100%; height: 100%; }
.video-cover > text { position: absolute; left: 50%; top: 50%; display: flex; width: 58rpx; height: 58rpx; align-items: center; justify-content: center; transform: translate(-50%,-50%); border: 3rpx solid #fff; border-radius: 50%; background: #087363; color: #fff; font-size: 24rpx; }
.video-copy > text { display: block; }
.video-copy > text:first-child { font-size: 28rpx; font-weight: 750; line-height: 1.5; }
.video-copy > text:nth-child(2) { display: -webkit-box; overflow: hidden; margin-top: 12rpx; font-size: 23rpx; line-height: 1.5; color: #67766d; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.video-copy > text:last-child { margin-top: 13rpx; font-size: 23rpx; color: #268269; }
.knowledge-safety-boundary { font-size: 23rpx; line-height: 1.65; color: #63736b; text-align: center; padding: 15rpx 10rpx; }
.knowledge-empty { display: flex; padding: 60rpx 30rpx; gap: 22rpx; align-items: center; flex-direction: column; border-radius: 32rpx; background: #fff; }
.knowledge-empty > text:first-of-type { font-size: 31rpx; font-weight: 700; }
.knowledge-empty > text:nth-of-type(2) { font-size: 25rpx; color: #7f9387; }
.knowledge-empty > button { padding: 15rpx 32rpx; border-radius: 999rpx; background: #e3f6ec; color: #157b60; font-size: 28rpx; }
</style>
<style scoped lang="scss">
.knowledge-featured,.knowledge-spotlights>button{background:#fff;border:0;border-radius:30rpx}.knowledge-featured>image{right:0;width:40%;border-radius:0}.knowledge-featured>view{max-width:76%}.featured-title{font-size:36rpx;color:#102e32}.featured-summary{max-width:75%;color:#607078;font-size:24rpx}.knowledge-filters button{line-height:1.5;min-height:76rpx}.knowledge-featured{min-height:350rpx}.knowledge-spotlights>button{min-height:310rpx}.spotlight-title{font-size:25rpx;color:#142e31}.spotlight-art{height:150rpx}.spotlight-duration{font-size:22rpx;color:#607078}.review-tag{background:#009d8d;color:#fff}
</style>
