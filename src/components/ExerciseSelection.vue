<template>
  <view class="exercise-selection-panel" data-testid="exercise-selection-screen">
    <view class="selection-summary" data-testid="region-selection-summary">
      <view class="summary-heading">
        <view class="summary-shoe"><AppIcon src="/static/icons/magpie-line/exercise.svg" :size="56" color="#fff" /></view>
        <view class="summary-copy"><text>今日运动 <text>{{ completedMinutes }}</text> 分钟</text><text>{{ mode === 'cardiac' ? '自选运动不改变医院处方' : '按兴趣和当前状态选择' }}</text></view>
        <view class="selection-ring" :style="{ '--progress': progress + '%' }"><view><text>{{ progress }}%</text><text>{{ mode === 'cardiac' ? '处方完成' : '今日记录' }}</text></view></view>
      </view>
      <view class="selection-metrics">
        <view data-metric="METRIC-SELECTION-PROJECTS"><AppIcon src="/static/icons/magpie-line/exercise.svg" :size="40" /><text>完成项目</text><text>{{ completedProjects }}</text><text>项 · 今日去重</text></view>
        <view data-metric="METRIC-SELECTION-RECORDS"><AppIcon src="/static/icons/magpie-line/report.svg" :size="40" /><text>训练记录</text><text>{{ completedRecords }}</text><text>次 · 今日完成</text></view>
        <view data-metric="METRIC-SELECTION-STREAK"><AppIcon src="/static/icons/magpie-line/record.svg" :size="40" /><text>连续打卡</text><text>{{ streak }}</text><text>天</text></view>
        <view data-metric="METRIC-SELECTION-STEPS"><AppIcon src="/static/icons/magpie-line/device.svg" :size="40" /><text>今日步数</text><text>{{ steps === undefined ? '待同步' : steps.toLocaleString() }}</text><text>{{ steps === undefined ? '未采集有效值' : '步 · 来源可查看' }}</text></view>
      </view>
    </view>
    <button v-if="mode === 'cardiac'" class="selection-prescription" data-testid="selection-prescription" @tap="emit('open-prescription')">
      <image src="/static/replica-v7/selection-clinician.png" mode="aspectFit" />
      <view><text>医院演示处方</text><text>{{ stage }}</text><view class="prescription-facts"><text>{{ prescriptionVersion }}</text><text>{{ prescriptionTotal }}项计划</text><text>已完成{{ prescriptionCompleted }}项</text></view><text class="prescription-hint">查看医院记录与完整处方 ›</text></view>
    </button>
    <view class="selection-category-bar" role="tablist">
      <button v-for="category in categories" :key="category.id" data-testid="selection-category" :class="{ selected: !showRecommendations && selectedCategory.id === category.id }" :aria-selected="!showRecommendations && selectedCategory.id === category.id" @tap="selectCategory(category.id)">
        <AppIcon :src="category.iconPath" :size="49" :color="!showRecommendations && selectedCategory.id === category.id ? '#fff' : '#098779'" /><text>{{ category.title }}</text>
      </button>
    </view>
    <view class="selection-section-title"><text>{{ showRecommendations ? '推荐训练' : selectedCategory.title }}</text><button v-if="!showRecommendations" class="selection-show-all" @tap="showRecommendations=true">查看全部运动 ›</button><text v-else>按今天的状态选择</text></view>
    <view class="selection-games" data-testid="region-selection-games">
      <button v-for="game in displayedGames" :key="game.id" class="selection-game" data-testid="selection-exercise" :data-exercise-id="game.id" @tap="emit('select', game.id)">
        <image :src="illustrationFor(game)" mode="aspectFit" />
        <view class="selection-game-copy"><text v-if="game.id === recommendedId" class="selection-recommended">今日推荐</text><text class="selection-game-title">{{ game.title }}</text><text class="selection-game-meta">{{ game.duration }} · {{ game.feature }}</text><text class="selection-game-description">{{ game.subtitle }}{{ game.arSupported ? ' · AR互动' : '' }}</text><text class="selection-start">开始训练 ›</text></view>
      </button>
    </view>
    <text class="selection-boundary">时长与项目来自本地原型；不为完成进度额外加量。教学视频和互动内容以训练页面为准。</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { ExerciseCategory, ExerciseCategoryId, ExerciseGame, ExerciseGameId, UserMode } from '@/lib/prototype-data'
const props = defineProps<{ mode: UserMode; categories: ExerciseCategory[]; selectedCategory: ExerciseCategory; games: ExerciseGame[]; allGames: ExerciseGame[]; recommendedId: ExerciseGameId; completedMinutes: number; completedProjects: number; completedRecords: number; streak: number; steps?: number; progress: number; stage: string; prescriptionVersion: string; prescriptionTotal: number; prescriptionCompleted: number }>()
const emit = defineEmits<{ (e: 'select', id: ExerciseGameId): void; (e: 'update:selectedCategoryId', id: ExerciseCategoryId): void; (e: 'open-prescription'): void }>()
const showRecommendations = ref(true)
const displayedGames = computed(() => showRecommendations.value ? [...props.allGames].sort((a,b)=>{
  const order=['baduanjin','resistance','walking','stretch','balance','taichi','power-bike','music','breathing'];
  return order.indexOf(a.id)-order.indexOf(b.id)
}) : props.games)
function selectCategory(id:ExerciseCategoryId){showRecommendations.value=false;emit('update:selectedCategoryId',id)}
function illustrationFor(game:ExerciseGame){
  if(['baduanjin','resistance','walking','stretch','balance'].includes(game.id))return '/static/replica-v7/selection-'+game.id+'.png';
  if(game.id==='breathing'||game.id==='music')return '/static/replica-v7/assistant-advice.png';
  return game.poster;
}
</script>

<style scoped lang="scss">
.exercise-selection-panel { display: grid; gap: 24rpx; padding: 22rpx 28rpx 40rpx; }
.selection-summary { padding: 28rpx 22rpx; border: 2rpx solid #fff; border-radius: 36rpx; background: #ffffffeb; box-shadow: var(--shadow-card); }
.summary-heading { display: flex; align-items: center; gap: 17rpx; }
.summary-shoe { display: flex; flex-shrink: 0; width: 80rpx; height: 80rpx; align-items: center; justify-content: center; border-radius: 50%; background: var(--gradient-brand); }
.summary-copy { flex: 1; min-width: 0; }
.summary-copy > text { display: block; font-size: 27rpx; line-height: 1.6; font-weight: 650; }
.summary-copy > text > text { font-size: 43rpx; font-weight: 800; color: #008c79; }
.summary-copy > text:last-child { margin-top: 9rpx; color: #73847a; font-size: 23rpx; font-weight: 400; }
.selection-ring { width: 128rpx; height: 128rpx; padding: 12rpx; flex-shrink: 0; border-radius: 50%; background: conic-gradient(#0aa18a var(--progress), #e4f2ed 0); }
.selection-ring > view { display: flex; width: 100%; height: 100%; flex-direction: column; align-items: center; justify-content: center; border-radius: 50%; background: #fff; }
.selection-ring text:first-child { color: #007b6d; font-size: 32rpx; font-weight: 750; }
.selection-ring text:last-child { font-size: 23rpx; color: #577768; }
.selection-metrics { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 10rpx; margin-top: 28rpx; }
.selection-metrics > view { display: flex; min-width: 0; padding: 20rpx 4rpx; gap: 12rpx; align-items: center; flex-direction: column; border-radius: 22rpx; background: #f2f9f6; }
.selection-metrics text:first-of-type { font-size: 23rpx; color: #61776a; }
.selection-metrics text:nth-of-type(2) { font-size: 35rpx; color: #123f33; font-weight: 750; }
.selection-metrics text:last-child { font-size: 23rpx; color: #5d7868; line-height: 1.5; text-align: center; }
.selection-prescription { display: grid; width: 100%; grid-template-columns: 168rpx minmax(0,1fr); gap: 24rpx; padding: 22rpx; align-items: center; border-radius: 34rpx; background: #fff; text-align: left; line-height: 1.5; box-shadow: var(--shadow-card); }
.selection-prescription > image { width: 168rpx; height: 202rpx; border-radius: 25rpx; background: #f1faf6; }
.selection-prescription > view > text { display: block; }
.selection-prescription > view > text:first-child { color: #64776b; font-size: 23rpx; }
.selection-prescription > view > text:nth-child(2) { margin-top: 10rpx; color: #154c3e; font-size: 30rpx; font-weight: 750; }
.prescription-facts { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 13rpx; }
.prescription-facts > text { padding: 8rpx 12rpx; border-radius: 12rpx; background: #f0f8f4; color: #4a7662; font-size: 23rpx; }
.prescription-hint { margin-top: 12rpx; color: #038673; font-size: 23rpx; }
.selection-category-bar { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 12rpx; padding: 12rpx; border-radius: 32rpx; background: #fff; box-shadow: var(--shadow-card); }
.selection-category-bar > button { display: flex; width: 100%; min-width: 0; min-height: 137rpx; padding: 13rpx 0; gap: 14rpx; align-items: center; justify-content: center; flex-direction: column; border-radius: 26rpx; background: #f1f8f4; color: #557767; font-size: 23rpx; line-height: 1.5; }
.selection-category-bar > button.selected { background: var(--gradient-brand); color: #fff; font-weight: 700; }
.selection-section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 15rpx; padding: 0 8rpx; }
.selection-section-title > text:first-child { flex-shrink: 0; font-size: 28rpx; font-weight: 700; }
.selection-section-title > text:last-child { color: #668573; font-size: 23rpx; line-height: 1.5; text-align: right; }
.selection-games { display: grid; gap: 22rpx; }
.selection-game { display: grid; width: 100%; min-width: 0; grid-template-columns: 40% minmax(0,1fr); align-items: stretch; gap: 24rpx; padding: 22rpx; border-radius: 34rpx; background: #fff; box-shadow: var(--shadow-card); text-align: left; line-height: 1.5; }
.selection-game > image { width: 100%; height: 260rpx; border-radius: 26rpx; background: #e9f6ef; }
.selection-game-copy { display: flex; min-width: 0; flex-direction: column; gap: 12rpx; }
.selection-recommended { align-self: flex-start; padding: 4rpx 12rpx; border-radius: 10rpx; background: #e0f6ed; color: #067867; font-size: 23rpx; }
.selection-game-title { color: #103f31; font-size: 32rpx; font-weight: 750; line-height: 1.4; }
.selection-game-meta { color: #567d68; font-size: 24rpx; line-height: 1.6; }
.selection-game-description { color: #67776c; font-size: 23rpx; line-height: 1.6; }
.selection-start { display: flex; min-height: 76rpx; margin-top: auto; padding: 10rpx; align-items: center; justify-content: center; border-radius: 999rpx; background: var(--gradient-brand); color: #fff; font-size: 27rpx; font-weight: 700; }
.selection-boundary { padding: 4rpx 12rpx; color: #7b9283; font-size: 23rpx; line-height: 1.6; }
</style>
<style scoped lang="scss">
.selection-show-all{padding:0;background:transparent;color:#008d80;font-size:23rpx;line-height:1.5}.selection-game{padding:14rpx;min-height:160rpx}.selection-game>image{height:155rpx}.selection-game-copy{padding-bottom:44rpx}.selection-game-description{display:none}.selection-prescription{grid-template-columns:100rpx minmax(0,1fr)}.selection-prescription>image{width:100rpx;height:126rpx}.selection-games{gap:14rpx}.selection-category-bar>button{min-height:98rpx}.exercise-selection-panel{gap:18rpx}
</style>
<style scoped lang="scss">
.selection-summary{background:#fff;border:0;border-radius:30rpx;padding:22rpx}.selection-metrics{margin-top:18rpx;gap:8rpx}.selection-metrics>view{background:#f4f7f7;padding:12rpx 3rpx;gap:7rpx}.selection-metrics text:last-child{font-size:21rpx}.selection-metrics text:nth-of-type(2){font-size:32rpx}.selection-ring{width:110rpx;height:110rpx}.summary-shoe{display:none}.selection-prescription{padding:16rpx 20rpx;gap:18rpx;border-radius:30rpx;grid-template-columns:130rpx minmax(0,1fr)}.selection-prescription>image{width:130rpx;height:174rpx;background:#fff}.selection-prescription>view>text:nth-child(2){font-size:28rpx;margin-top:6rpx}.prescription-facts{margin-top:7rpx}.prescription-facts>text{padding:5rpx 9rpx}.selection-category-bar{padding:0;background:transparent;box-shadow:none;gap:10rpx}.selection-category-bar>button{min-height:117rpx;gap:8rpx;background:#fff;font-size:22rpx;border-radius:22rpx}.selection-section-title{padding:0}.selection-game{position:relative;grid-template-columns:32% minmax(0,1fr);gap:17rpx;padding:16rpx;border-radius:25rpx;align-items:center}.selection-game>image{height:165rpx;border-radius:18rpx;background:#fff}.selection-game-copy{gap:6rpx;padding-bottom:50rpx}.selection-game-title{font-size:29rpx;color:#142f33}.selection-game-meta,.selection-game-description{font-size:22rpx;color:#607078;line-height:1.5}.selection-start{position:absolute;bottom:15rpx;right:16rpx;min-height:44rpx;padding:5rpx 18rpx;font-size:22rpx}.selection-recommended{font-size:20rpx}.selection-games{gap:17rpx}
</style>
