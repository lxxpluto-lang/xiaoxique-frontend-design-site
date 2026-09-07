<template>
  <view class="session-report-overview" :data-state="session.status" data-testid="region-session-overview">
    <view class="result-hero" :class="{ 'result-hero--stopped': stopped }">
      <image class="v7-result-leaves" src="/static/replica-v7/session-leaves.png" mode="aspectFit" aria-hidden="true" />
      <view class="result-halo" aria-hidden="true" />
      <view class="result-ring" :style="{ '--result-progress': progress + '%' }" data-testid="session-result-ring">
        <view><text>{{ stopped ? '停' : hasScore ? session.score : '✓' }}</text><text>{{ stopped ? '安全停止' : hasScore ? '动作评分' : '运动已记录' }}</text></view>
      </view>
      <text class="result-title">{{ stopped ? '本次运动已停止并记录' : session.title + '完成' }}</text>
      <view class="result-facts"><text>{{ duration }}</text><text v-if="hasScore">动作评分 {{ session.score }}</text><text v-if="valid(session.assessment?.post) && finite(session.assessment?.post?.borg)">Borg {{ session.assessment?.post?.borg }}</text><text>{{ session.pointsAwarded ? '+' + session.pointsAwarded + '积分' : '未新增积分' }}</text></view>
      <text v-if="stopped" class="result-note">{{ session.stoppedReason || '按身体感受停止' }} · 停止不会扣除已有积分</text>
      <text v-else class="result-note">{{ session.demoCompleted ? '快速演示记录 · ' : '' }}{{ hasScore ? '评分仅为互动演示，不代表康复疗效' : '训练记录不代表康复疗效' }}</text>
    </view>
    <view v-if="session.assessment" class="vital-comparison" data-testid="region-session-comparison">
      <text class="comparison-title">运动前 / 后对比</text>
      <view class="comparison-header"><text>指标</text><text>运动前</text><text /><text>运动后</text></view>
      <view v-for="metric in metricRows" :key="metric.id" class="comparison-row" :data-metric="metric.id">
        <view><AppIcon :src="metric.icon" :size="35" /><text>{{ metric.label }}</text></view>
        <text :class="{ 'comparison-missing': metric.pre === '未采集' }">{{ metric.pre }}</text>
        <text class="comparison-arrow" aria-hidden="true">→</text>
        <text :class="{ 'comparison-missing': metric.post === '未采集' }">{{ metric.post }}</text>
      </view>
      <text class="comparison-units">单位：血压 mmHg · 心率 次/分 · 血氧 %</text>
      <button class="v7-comparison-toggle" data-testid="session-sources-toggle" :aria-expanded="sourcesExpanded" @tap="sourcesExpanded = !sourcesExpanded">数据来源与解读说明 <text>{{ sourcesExpanded ? '收起 ⌃' : '展开 ⌄' }}</text></button>
      <view v-if="sourcesExpanded" data-testid="session-source-details">
      <view class="comparison-sources"><text>前：{{ snapshotSource(session.assessment.pre) }}</text><text>后：{{ snapshotSource(session.assessment.post) }}</text></view>
      <text class="comparison-explanation">{{ session.assessment.comparison }}</text>
      <text class="comparison-boundary">箭头仅表示前后记录顺序，不表示改善；缺失或过期值不用于对比。</text>
      </view>
    </view>
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { TrainingSession, VitalSnapshot } from '@/lib/prototype-data'
const props = defineProps<{ session: TrainingSession }>()
const sourcesExpanded = ref(false)
const stopped = computed(() => props.session.status === 'stopped')
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const valid = (snapshot?: VitalSnapshot) => snapshot?.quality === 'valid'
const hasScore = computed(() => !stopped.value && props.session.poseScored && finite(props.session.score))
const progress = computed(() => stopped.value ? 0 : hasScore.value ? Math.min(100, Math.max(0, props.session.score)) : 100)
const duration = computed(() => { const seconds = Math.max(0, Math.floor(props.session.durationSeconds)); return Math.floor(seconds / 60) + '分' + (seconds % 60 ? seconds % 60 + '秒' : '') })
function value(snapshot: VitalSnapshot | undefined, key: 'bloodPressure' | 'heartRate' | 'oxygenSaturation' | 'borg' | 'discomfortScore') {
  if (!valid(snapshot) || !snapshot) return '未采集'
  if (key === 'bloodPressure') return finite(snapshot.systolicBloodPressure) && finite(snapshot.diastolicBloodPressure) ? snapshot.systolicBloodPressure + '/' + snapshot.diastolicBloodPressure : '未采集'
  return finite(snapshot[key]) ? String(snapshot[key]) + (key === 'oxygenSaturation' ? '%' : '') : '未采集'
}
const metricRows = computed(() => ([
  { key: 'bloodPressure' as const, id: 'METRIC-SESSION-BP', label: '血压', icon: 'assessment' },
  { key: 'heartRate' as const, id: 'METRIC-SESSION-HR', label: '心率', icon: 'heart-rate' },
  { key: 'oxygenSaturation' as const, id: 'METRIC-SESSION-SPO2', label: '血氧', icon: 'device' },
  { key: 'borg' as const, id: 'METRIC-SESSION-BORG', label: 'Borg', icon: 'exercise' },
  { key: 'discomfortScore' as const, id: 'METRIC-SESSION-DISCOMFORT', label: '不适评分', icon: 'safety' },
]).filter(row => ['bloodPressure', 'heartRate', 'oxygenSaturation'].includes(row.key) || finite(props.session.assessment?.pre?.[row.key as 'borg' | 'discomfortScore']) || finite(props.session.assessment?.post?.[row.key as 'borg' | 'discomfortScore'])).map(row => ({ ...row, icon: '/static/icons/magpie-line/' + row.icon + '.svg', pre: value(props.session.assessment?.pre, row.key), post: value(props.session.assessment?.post, row.key) })))
const sourceNames = { 'hospital-device': '医院/直接设备', 'apple-health': 'Apple健康', 'health-connect': 'Health Connect', manual: '手动填写', 'demo-device': '模拟设备' }
const qualityNames = { valid: '有效', missing: '未采集', stale: '已过期', denied: '未授权' }
function snapshotSource(snapshot?: VitalSnapshot) { return snapshot ? (sourceNames[snapshot.source] || '未知来源') + ' · ' + (qualityNames[snapshot.quality] || '待核对') : '未采集' }
</script>

<style scoped lang="scss">
.session-report-overview { display: grid; gap: 22rpx; }
.result-hero { position: relative; display: flex; align-items: center; flex-direction: column; padding: 30rpx 18rpx 26rpx; overflow: hidden; isolation: isolate; }
.result-halo { position: absolute; z-index: -1; width: 650rpx; height: 520rpx; left: 50%; top: -45rpx; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(ellipse, #f2fffaee 0%, #d2f3e940 45%, transparent 70%); }
.result-ring { width: 290rpx; height: 290rpx; padding: 15rpx; border: 14rpx solid #fff; border-radius: 50%; background: conic-gradient(#19c68e var(--result-progress), #d8eee5 0); box-shadow: 0 14rpx 30rpx #08776520; }
.result-ring > view { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; flex-direction: column; gap: 3rpx; border-radius: 50%; background: #f5fffb; }
.result-ring text:first-child { color: #064b40; font-size: 79rpx; font-weight: 800; line-height: 1.1; }
.result-ring text:last-child { color: #4f7b6d; font-size: 23rpx; }
.result-title { margin-top: 32rpx; color: #083f36; font-size: 39rpx; font-weight: 800; line-height: 1.4; text-align: center; }
.result-facts { display: flex; flex-wrap: wrap; justify-content: center; gap: 9rpx 20rpx; margin-top: 21rpx; padding: 16rpx 20rpx; border-radius: 999rpx; background: #e1f7ee; color: #187a60; font-size: 25rpx; }
.result-note { margin-top: 13rpx; color: #68897a; font-size: 23rpx; line-height: 1.5; text-align: center; }
.result-hero--stopped .result-ring { background: #f1dad4; }
.result-hero--stopped .result-ring text:first-child { color: #a35143; }
.result-hero--stopped .result-halo { background: radial-gradient(ellipse, #f9dcd2, #fff3ed 55%, transparent 72%); }
.result-hero--stopped .result-facts { background: #fff0e9; color: #9c5547; }
.vital-comparison { padding: 28rpx 24rpx; border-radius: 34rpx; background: #fff; box-shadow: var(--shadow-card); }
.comparison-title { display: block; padding-left: 14rpx; border-left: 7rpx solid #20b98b; font-size: 31rpx; font-weight: 750; }
.comparison-header, .comparison-row { display: grid; grid-template-columns: 1.1fr 1fr 25rpx 1fr; align-items: center; gap: 8rpx; text-align: center; }
.comparison-header { margin-top: 26rpx; padding: 12rpx 6rpx; border-radius: 12rpx; background: #f3f8f5; color: #62706a; font-size: 23rpx; }
.comparison-header > text:first-child { text-align: left; padding-left: 10rpx; }
.comparison-row { min-height: 76rpx; border-bottom: 1rpx solid #edf4ef; color: #294c3f; font-size: 25rpx; }
.comparison-row > view { display: flex; align-items: center; gap: 8rpx; text-align: left; }
.comparison-row > text:last-child { font-weight: 650; }
.comparison-row .comparison-arrow { color: #3d7e67; font-size: 27rpx; }
.comparison-row .comparison-missing { color: #6b756f; font-size: 23rpx; font-weight: 400; }
.comparison-sources { display: grid; gap: 8rpx; margin-top: 20rpx; color: #62796c; font-size: 23rpx; }
.comparison-explanation, .comparison-boundary, .comparison-units { display: block; margin-top: 16rpx; color: #63786d; font-size: 23rpx; line-height: 1.6; }
.comparison-boundary { color: #69776f; }
</style>
<style scoped lang="scss">
.v7-comparison-toggle{display:flex;width:100%;min-height:88rpx;padding:12rpx 0;align-items:center;justify-content:space-between;background:#fff;color:#52716d;font-size:23rpx;line-height:1.5}.result-hero{padding-top:12rpx}.result-title{font-size:35rpx;margin-top:22rpx}.result-ring{width:235rpx;height:235rpx}.comparison-row{min-height:67rpx}.comparison-header{margin-top:18rpx}
</style>
<style scoped lang="scss">
.result-hero{position:relative}.v7-result-leaves{position:absolute;right:-30rpx;top:12rpx;width:140rpx;height:270rpx;opacity:.7;pointer-events:none}.result-halo{display:none}.result-title,.result-facts,.result-note{position:relative}.result-ring{position:relative}.vital-comparison{background:#fff;border-radius:30rpx}.comparison-header{background:#f4f7f7}
</style>
