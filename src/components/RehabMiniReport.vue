<template>
  <view class="mini-report" data-testid="hospital-report-screen" :data-state="completed.length ? 'ready' : 'empty'">
    <view class="mini-hero" data-testid="region-mini-report-summary">
      <image src="/static/replica-v7/mini-report-hero.png" mode="aspectFit" aria-hidden="true" />
      <text class="mini-title">康复小报告</text>
      <text class="mini-greeting">{{ name }}，{{ completed.length ? '每一次坚持，都有记录' : '从第一次运动开始' }}</text>
      <text class="mini-subtitle">{{ rangeLabel }} · {{ completed.length ? `已完成 ${trainingDays} 个训练日` : '完成运动后，这里会汇总你的记录' }}</text>
    </view>
    <view class="range-tabs" role="tablist"><button v-for="days in [7, 30]" :key="days" :class="{ selected: period === days }" :aria-selected="period === days" data-testid="mini-report-period" @tap="period = days">近 {{ days }} 天</button></view>
    <view class="mini-metrics" data-testid="region-mini-report-metrics">
      <view><AppIcon src="/static/icons/magpie-line/record.svg" :size="50" /><text>记录周期</text><text>{{ period }}<text>天</text></text></view>
      <view><AppIcon src="/static/icons/magpie-line/report.svg" :size="50" /><text>完成训练</text><text>{{ completed.length }}<text>次</text></text></view>
      <view><AppIcon src="/static/icons/magpie-line/heart-rate.svg" :size="50" /><text>运动前心率</text><text class="heart-value">{{ heartTrend }}</text><text class="metric-note">{{ heartSamples.length >= 2 ? '次/分 · 不等同静息趋势' : '有效记录不足' }}</text></view>
    </view>
    <view v-if="stopped.length" class="mini-stop" role="status">本周期保留 {{ stopped.length }} 次停止记录，未计入完成次数。请结合身体感受与医生意见查看。</view>
    <text class="advice-heading">居家期间请继续保持</text>
    <view class="mini-advice-list" data-testid="region-mini-report-advice">
      <button v-for="(item,index) in adviceItems" :key="item.id" class="mini-advice" :class="{ expanded: expanded === item.id }" data-testid="mini-report-advice" :aria-expanded="expanded === item.id" @tap="expanded = expanded === item.id ? '' : item.id">
        <view class="mini-advice-icon"><image :src="'/static/replica-v7/mini-'+item.id+'.png'" mode="aspectFit" /></view><view><text>{{ item.title }}</text><text>{{ item.summary }}</text><text v-if="expanded === item.id" class="advice-detail">{{ item.detail }}</text></view><text>{{ expanded === item.id ? '⌄' : '›' }}</text>
      </button>
      <view class="mini-boundary"><AppIcon src="/static/icons/magpie-line/safety.svg" :size="52" /><view><text>本地规则汇总 · 待医生确认</text><text>报告不替代正式出院小结或诊疗意见。训练记录不代表康复疗效。</text><text v-if="pendingReviews">有 {{ pendingReviews }} 条运动建议待确认</text></view></view>
    </view>
    <button class="mini-primary" data-testid="mini-report-records" @tap="emit('records')">查看训练明细</button>
    <button v-if="mode === 'cardiac' && pendingReviews" class="mini-secondary" data-testid="mini-report-reviews" @tap="emit('reviews')">查看待确认建议</button>
    <text class="mini-source">来源：本机训练记录{{ mode === 'cardiac' ? ` · 医院演示处方 ${version}` : ' · 日常运动模式' }}。缺失值不使用 0 替代。</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { TrainingSession, UserMode, DoctorReview } from '@/lib/prototype-data'
const props = defineProps<{ sessions: TrainingSession[]; name: string; mode: UserMode; version: string; reviews: DoctorReview[] }>()
const emit=defineEmits<{(e:'records'):void;(e:'reviews'):void}>()
const period=ref(7)
const expanded=ref('')
const dateKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const range=computed(()=>{const end=new Date();const start=new Date(end.getFullYear(),end.getMonth(),end.getDate());start.setDate(start.getDate()-period.value+1);return {start:dateKey(start),end:dateKey(end)}})
const rangeLabel=computed(()=>`${range.value.start.replace(/-/g,'.')} — ${range.value.end.replace(/-/g,'.')}`)
const records=computed(()=>props.sessions.filter(s=>{const day=s.localDate||dateKey(new Date(s.createdAt));return day>=range.value.start&&day<=range.value.end}))
const completed=computed(()=>records.value.filter(s=>s.status==='completed'))
const stopped=computed(()=>records.value.filter(s=>s.status==='stopped'))
const trainingDays=computed(()=>new Set(completed.value.map(s=>s.localDate||dateKey(new Date(s.createdAt)))).size)
const heartSamples=computed(()=>completed.value.slice().sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).flatMap(s=>s.assessment?.pre?.quality==='valid'&&Number.isFinite(s.assessment.pre.heartRate)?[Number(s.assessment.pre.heartRate)]:[]))
const heartTrend=computed(()=>heartSamples.value.length>=2?`${heartSamples.value[0]}→${heartSamples.value[heartSamples.value.length-1]}`:'未采集')
const pendingReviews=computed(()=>props.reviews.filter(r=>r.status==='pending'&&records.value.some(s=>s.advice?.id===r.adviceId)).length)
const adviceItems=computed(()=>[
  {id:'diet',title:'饮食管理',icon:'/static/icons/magpie-line/knowledge.svg',summary:'查看饮食记录，遵循医生或营养师建议',detail:'本报告没有完整饮食资料，不生成个体化营养处方。饮食建议应由医护人员结合你的情况确认。'},
  {id:'heart',title:'心率管理',icon:'/static/icons/magpie-line/heart-rate.svg',summary:'以医生确认的目标心率和身体感受为准',detail:heartSamples.value.length>=2?'以上仅为运动前采集值的首末比较，不能据此判断疗效、调整强度或替代静息心率趋势。':'当前缺少足够有效记录，请核对测量来源和时间。没有记录不代表正常。'},
  {id:'exercise',title:'居家运动',icon:'/static/icons/magpie-line/exercise.svg',summary:props.mode==='cardiac'?'按医院处方完成，不自行增加强度或时长':'选择适合自己的运动，按当日状态完成',detail:props.mode==='cardiac'?`执行原处方 ${props.version}。需要调整计划时提交医生确认；停止记录不会扣除已有积分。`:'训练时长和强度以所选项目及个人状态为准；不需要为了积分额外加量。'},
  {id:'safety',title:'安全提醒',icon:'/static/icons/magpie-line/safety.svg',summary:'出现胸痛、明显气促、头晕等不适应停止',detail:'根据医院指引联系专业人员。明显、持续或加重的不适应及时就医；紧急情况请呼叫 120。小喜不提供诊断。'},
])
</script>

<style scoped lang="scss">
.mini-report { display:grid; gap:24rpx; }.mini-hero { position:relative; min-height:290rpx; padding:30rpx 4rpx; }.mini-hero>image { position:absolute; width:255rpx; height:255rpx; right:-12rpx; top:15rpx; }.mini-hero>text { position:relative; display:block; max-width:75%; }.mini-title { color:#004e45; font-size:64rpx; font-weight:800; letter-spacing:2rpx; }.mini-greeting { margin-top:28rpx; font-size:30rpx; font-weight:750; line-height:1.5; }.mini-subtitle { margin-top:16rpx; font-size:23rpx; color:var(--color-text-secondary); line-height:1.6; }.range-tabs { display:flex; width:260rpx; padding:5rpx; border-radius:999rpx; background:#e3f3ed; }.range-tabs button { display:flex; align-items:center; justify-content:center; flex:1; min-width:0; padding:0; line-height:1.4; white-space:nowrap; min-height: 92rpx; color:#48685d; font-size:24rpx; border-radius:999rpx; }.range-tabs button.selected { color:#fff; background:var(--gradient-brand); }
.mini-metrics { display:grid; grid-template-columns:1fr 1fr 1.25fr; padding:36rpx 18rpx; border:2rpx solid #fff; border-radius:36rpx; background:#ffffffed; box-shadow:var(--shadow-card); }.mini-metrics>view { display:flex; align-items:center; flex-direction:column; gap:18rpx; padding:0 10rpx; border-right:1rpx solid #d9ebe4; }.mini-metrics>view:last-child { border:0; }.mini-metrics>view>text:nth-of-type(1) { font-size:25rpx; }.mini-metrics>view>text:nth-of-type(2) { font-size:58rpx; font-weight:750; color:#007a69; }.mini-metrics>view>text:nth-of-type(2)>text { margin-left:7rpx; font-size:24rpx; font-weight:500; }.mini-metrics>view>text.heart-value { margin-top:8rpx; font-size:36rpx; }.metric-note { color:var(--color-text-tertiary); font-size:23rpx; text-align:center; }.mini-stop { padding:24rpx; border-radius:20rpx; background:#fff0e9; color:#995e33; font-size:25rpx; line-height:1.6; }.advice-heading { margin:10rpx 0 0; color:#007f70; text-align:center; font-size:30rpx; font-weight:700; }
.mini-advice-list { display:grid; gap:15rpx; padding:20rpx; border-radius:34rpx; border:1rpx solid #d4ede4; background:#fff; box-shadow:var(--shadow-card); }.mini-advice { display:grid; padding:18rpx 12rpx; align-items:center; grid-template-columns:100rpx 1fr 24rpx; gap:14rpx; border:1rpx solid #dcefe8; border-radius:42rpx; background:#fff; text-align:left; }.mini-advice-icon { display:flex; width:96rpx; height:96rpx; align-items:center; justify-content:center; border-radius:50%; background:linear-gradient(135deg,#e0f6ed,#f2fbf7); }.mini-advice>view:nth-child(2)>text { display:block; }.mini-advice>view:nth-child(2)>text:first-child { color:#08574b; font-size:30rpx; font-weight:750; }.mini-advice>view:nth-child(2)>text:nth-child(2) { margin-top:8rpx; font-size:24rpx; color:#657771; line-height:1.6; }.mini-advice>text { color:#4a7c6e; font-size:40rpx; }.mini-advice .advice-detail { margin-top:14rpx; font-size:23rpx; line-height:1.7; color:#487467; }.mini-advice.expanded { background:#f1fbf7; }.mini-boundary { display:flex; gap:16rpx; padding:24rpx 16rpx; border-radius:22rpx; background:#edf9f4; align-items:flex-start; }.mini-boundary text { display:block; color:#50766b; font-size:23rpx; line-height:1.6; }.mini-boundary text:first-child { margin-bottom:6rpx; color:#185d4f; font-weight:700; font-size:26rpx; }
.mini-primary,.mini-secondary { display:flex; min-height: 92rpx; align-items:center; justify-content:center; border-radius:26rpx; font-size:31rpx; font-weight:700; }.mini-primary { color:#fff; background:var(--gradient-brand); }.mini-secondary { color:#007966; border:1rpx solid #91cdbb; background:#fff; }.mini-source { color:var(--color-text-tertiary); font-size:23rpx; line-height:1.6; }
</style>
<style scoped lang="scss">
.mini-hero{min-height:280rpx}.mini-hero>image{width:310rpx;height:260rpx;right:-5rpx;top:26rpx}.mini-hero>text{max-width:65%}.mini-title{font-size:53rpx;color:#102e32}.mini-greeting{font-size:27rpx;line-height:1.5;max-width:58%}.mini-subtitle{max-width:58%;font-size:23rpx}.mini-metrics{background:#fff;border-radius:30rpx;padding:26rpx 12rpx}.mini-advice-list{padding:0;border:0;background:transparent;box-shadow:none;gap:17rpx}.mini-advice{grid-template-columns:135rpx minmax(0,1fr) 24rpx;padding:20rpx 18rpx;border:0;border-radius:28rpx;box-shadow:var(--shadow-card);line-height:1.5}.mini-advice-icon{width:128rpx;height:128rpx;background:transparent;border-radius:0}.mini-advice-icon image{width:100%;height:100%}.mini-advice>view:nth-child(2)>text:first-child{color:#152e30;font-size:29rpx}.mini-advice>view:nth-child(2)>text:nth-child(2){color:#607078}.mini-boundary{background:#edf6f4}.range-tabs button{min-height:76rpx}
</style>
