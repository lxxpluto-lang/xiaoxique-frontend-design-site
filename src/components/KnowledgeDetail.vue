<template>
  <view class="knowledge-detail" :data-testid="item.type === 'video' ? 'knowledge-video-screen' : 'knowledge-article-screen'">
    <template v-if="item.type === 'video'">
      <view class="video-reference-card" data-testid="knowledge-static-preview">
        <text class="static-preview-note">静态原型 · 不可播放 · 审核状态仅为示意</text>
        <image src="/static/replica-v7/knowledge-video-reference.png" mode="widthFix" aria-label="最终知识视频原型静态预览" />
        <text class="static-preview-note">静态原型预览 · 图中的播放按钮、时间和审核状态仅为设计示意，不提供视频播放，也不代表已完成医学审核。</text>
      </view>
    </template>
    <template v-else>
      <view class="article-cover"><view><text>小喜健康知识 · {{ item.tags[0] }}</text><text>{{ item.title }}</text><text>{{ item.duration }}</text></view><image src="/static/replica-v7/article-hero.png" mode="aspectFit" /><text class="article-review-label">内容待医学审核</text></view><text class="summary article-summary">{{ item.summary }}</text>
    </template>
    <view v-if="item.type !== 'video'" class="reading-points article-points" data-testid="knowledge-body">
      <view v-for="(paragraph,index) in item.body" :key="index" class="reading-point">
        <view class="point-art"><image :src="chapterArtwork(index)" mode="aspectFit" /><text>{{ index+1 }}</text></view>
        <view class="point-copy"><text class="point-title">{{ chapterTitle(index) }}</text><text class="point-paragraph" data-testid="knowledge-paragraph">{{ paragraph }}</text></view>
      </view>
    </view>
    <view v-if="item.type !== 'video'" class="safety"><AppIcon src="/static/icons/magpie-line/safety.svg" :size="46" /><view><text>安全与医学审核边界</text><text>原型内容待医学审核，不替代医生诊断或处方。运动不适时应停止，按医院指引联系专业人员。</text></view></view>
    <button class="back-button" data-testid="knowledge-back" @tap="emit('back')">返回康复资讯</button>
  </view>
</template>
<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import type { KnowledgeItem } from '@/lib/prototype-data'
const props=defineProps<{item:KnowledgeItem}>()
const emit=defineEmits<{(event:'back'):void}>()
// Display-only chapter labels: original body strings remain verbatim and in order.
const chapters: Record<string,string[]> = {
  'GUIDE-HOME-SAFETY': ['运动前检查与准备','运动中留意感受','异常时停止运动'],
  'GUIDE-CARDIAC-HOME': ['以专业处方为准','记录运动前后感受','不自行调整处方'],
  'GUIDE-WEIGHT-START': ['从小目标开始','建立日常习惯','观察更长周期'],
  'TIP-BEFORE-CHECK': ['感受身体状态','如实完成检查'],
  'TIP-BORG': ['记录真实感受','留意异常变化'],
  'TIP-STOP-SYMPTOMS': ['立即停止并休息','及时寻求帮助'],
  'TIP-RECOVERY': ['先做缓和活动','补水并记录感受'],
}
function chapterTitle(index:number){return chapters[props.item.id]?.[index] || (props.item.type==='video'?'内容说明':'阅读要点')+' '+(index+1)}
function chapterIcon(index:number){return ['archive','heart-rate','safety'][index%3]}
function chapterArtwork(index:number){return '/static/replica-v7/'+['article-prepare','article-feeling','mini-safety'][index%3]+'.png'}
</script>
<style scoped lang="scss">
.knowledge-detail{display:grid;gap:25rpx;padding:24rpx 28rpx 44rpx}.article-cover{position:relative;overflow:hidden;min-height:330rpx;padding:32rpx;border:2rpx solid #fff;border-radius:36rpx;background:#eaf8f2}.article-cover>view{position:relative;z-index:1;width:68%}.article-cover text{display:block}.article-cover>view>text:first-child{color:#3d7765;font-size:23rpx}.article-cover>view>text:nth-child(2){margin-top:30rpx;font-size:44rpx;font-weight:800;line-height:1.4;color:#0a4334}.article-cover>view>text:last-child{margin-top:24rpx;font-size:25rpx;color:#3e7864}.article-cover>image{position:absolute;bottom:30rpx;right:12rpx;width:230rpx;height:250rpx;opacity:.8;border-radius:50%}.article-cover>.article-review-label{position:relative;z-index:1;display:table;margin-top:28rpx;padding:8rpx 16rpx;border-radius:999rpx;background:#fff;color:#407764;font-size:23rpx}.heading{padding:12rpx 5rpx}.badge{display:inline-block;padding:8rpx 18rpx;border-radius:999rpx;background:#ddf4e7;color:#25765c;font-size:23rpx}.title{display:block;margin-top:23rpx;font-size:40rpx;font-weight:750;line-height:1.5}.summary{display:block;color:#648071;font-size:27rpx;line-height:1.75;margin-top:14rpx}.article-summary{padding:0 12rpx}.reading-points{display:grid;gap:20rpx}.reading-point{padding:28rpx;border-radius:31rpx;background:#fff;box-shadow:var(--shadow-card)}.article-points .reading-point{display:grid;grid-template-columns:112rpx minmax(0,1fr);gap:24rpx;align-items:start}.point-art{position:relative;display:flex;align-items:center;justify-content:center;width:112rpx;height:112rpx;margin-top:8rpx;border-radius:50%;background:#eaf8f2}.point-art>text{position:absolute;left:-7rpx;top:-10rpx;display:flex;align-items:center;justify-content:center;width:40rpx;height:40rpx;border-radius:50%;background:var(--gradient-brand);color:#fff;font-size:24rpx;font-weight:750}.point-copy{min-width:0}.point-title{display:block;font-size:30rpx;font-weight:750;line-height:1.5;color:#194b3a}.point-paragraph{display:block;margin-top:15rpx;font-size:27rpx;line-height:1.85;color:#4b6657}.safety{display:flex;gap:18rpx;align-items:flex-start;padding:27rpx;border-radius:28rpx;background:#ecf8f1;border:1rpx solid #cae8d8}.safety>view>text{display:block;color:#547462;font-size:25rpx;line-height:1.7}.safety>view>text:first-child{font-size:28rpx;font-weight:700;color:#2c7457;margin-bottom:10rpx}.back-button{display:flex;min-height:92rpx;align-items:center;justify-content:center;border-radius:999rpx;background:var(--gradient-brand);color:#fff;font-size:30rpx;font-weight:700}.video-stage{border-radius:34rpx;overflow:hidden;background:#def2e7}.knowledge-video{display:block;width:100%;height:550rpx}.progress-card{padding:25rpx;border-radius:26rpx;background:#fff}.progress-card>view:first-child{display:flex;align-items:center;justify-content:space-between;font-size:27rpx;color:#497f67}.progress-track{margin-top:18rpx;height:12rpx;border-radius:999rpx;background:#e7f1eb;overflow:hidden}.progress-track>view{height:100%;border-radius:999rpx;background:var(--gradient-brand)}.progress-card>text{display:block;margin-top:18rpx;font-size:23rpx;color:#607a6d}.video-error{display:flex;min-height:490rpx;padding:30rpx;flex-direction:column;align-items:center;gap:20rpx}.video-error>image{width:220rpx;height:220rpx}.video-error>text{font-size:26rpx;color:#5d7b67}.video-error>button{padding:15rpx 30rpx;border-radius:999rpx;background:#fff;color:#217958;font-size:27rpx}
</style>
<style scoped lang="scss">
.video-reference-card{overflow:hidden;border-radius:30rpx;background:#fff}.video-reference-card>image{display:block;width:100%}.static-preview-note{display:block;padding:20rpx 24rpx;font-size:23rpx;line-height:1.6;color:#607078;border-top:1rpx solid #e8efef}
</style>
<style scoped lang="scss">
.article-cover{background:#fff;border:0;border-radius:30rpx;min-height:325rpx;padding:26rpx}.article-cover>image{height:315rpx;width:158rpx;right:6rpx;bottom:0;border-radius:0;opacity:1}.article-cover>view{width:78%}.article-cover>view>text:nth-child(2){font-size:39rpx;color:#142c31}.article-cover>view>text:first-child,.article-cover>view>text:last-child{color:#607078}.article-points .reading-point{grid-template-columns:115rpx minmax(0,1fr);padding:23rpx;gap:20rpx;border-radius:28rpx}.point-art{width:115rpx;height:125rpx;background:transparent}.point-art>image{width:100%;height:100%}.point-title{color:#142e32}.point-paragraph{color:#607078;line-height:1.7}.safety{background:#eef6f5;border:0}
</style>
