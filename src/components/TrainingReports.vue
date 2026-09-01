<template>
  <view class="reports" data-testid="training-reports">
    <view class="report-tabs"><button :class="{ active: tab === 'daily' }" @tap="tab = 'daily'">单次报告</button><button :class="{ active: tab === 'monthly' }" @tap="tab = 'monthly'">阶段性报告</button></view>

    <template v-if="tab === 'daily'">
      <view v-if="selectedDaily" class="report-detail">
        <button class="back" @tap="selectedDate = ''">‹ 返回报告列表</button>
        <view class="report-hero"><text>单次训练报告</text><text>{{ dateLabel(selectedDaily.date) }}</text><text>{{ selectedDaily.completedCount }} 项 · {{ minutes(selectedDaily.totalSeconds) }} 分钟 · 处方 {{ selectedDaily.prescriptionCompleted }}/{{ prescriptionItems.length }}</text></view>
        <view class="report-section"><text class="section-title">当日结论</text><text class="patient-summary">{{ dailyConclusion(selectedDaily) }}</text><view class="metric-grid"><view><text>{{ minutes(selectedDaily.totalSeconds) }}</text><text>总分钟</text></view><view><text>{{ selectedDaily.completedCount }}</text><text>完成项目</text></view><view><text>{{ selectedDaily.prescriptionCompleted }}/{{ prescriptionItems.length }}</text><text>处方完成</text></view><view><text>{{ selectedDaily.completeness === 'complete' ? '完整' : '待补充' }}</text><text>身体数据</text></view></view></view>
        <view class="report-section"><text class="section-title">处方与执行</text><view v-for="(item,index) in prescriptionItems" :key="item.project" class="execution-row"><view><text>{{ item.project }}</text><text>{{ item.intensity }} · {{ item.duration }}</text></view><text :class="{ done: itemDone(selectedDaily, index) }">{{ itemDone(selectedDaily, index) ? '已完成' : '未完成' }}</text></view></view>
        <view class="report-section"><text class="section-title">当天全部运动</text><view v-for="session in selectedDaily.sessions" :key="session.id" class="session-card"><view><text>{{ session.title }}</text><text>{{ session.planType === 'prescription' ? '医院处方' : '自选运动 · 非医院处方' }} · {{ timeLabel(session.createdAt) }}</text></view><text>{{ session.status === 'completed' ? minutes(session.durationSeconds) + '分钟' : '已停止' }}</text><view class="session-metrics"><text>评分 {{ session.score || '—' }}</text><text>心率 {{ snapshotValue(session,'heartRate') }}</text><text>血氧 {{ snapshotValue(session,'oxygenSaturation') }}</text><text>Borg {{ snapshotValue(session,'borg') }}</text></view><text v-if="session.advice" class="advice">小喜解读：{{ session.advice.title }}。{{ session.advice.summary }}</text></view></view>
        <view class="report-section boundary"><text class="section-title">解读边界</text><text>缺失或过期数据统一显示“未采集”，不会用0代替。小喜只解释记录和规则，医院处方调整必须由医生确认。</text></view>
      </view>
      <view v-else class="report-list"><button v-for="report in dailyReports" :key="report.date" @tap="selectedDate = report.date"><view><text>{{ dateLabel(report.date) }}</text><text>{{ report.completedCount }} 项 · {{ minutes(report.totalSeconds) }} 分钟</text></view><view><text>处方 {{ report.prescriptionCompleted }}/{{ prescriptionItems.length }}</text><text>查看 ›</text></view></button><view v-if="!dailyReports.length" class="empty">完成运动后，这里会按自然日生成一份单次报告。</view></view>
    </template>

    <template v-else>
      <view v-if="selectedMonth && selectedMonthly" class="report-detail">
        <button class="back" @tap="selectedMonth = ''">‹ 返回阶段报告</button>
        <view class="stage-hero"><text>{{ selectedMonthly.month.replace('-', '年') }}月阶段报告</text><text>{{ selectedMonthly.validDays >= 5 ? stageConclusion(selectedMonthly) : '有效训练日不足，暂不生成医学结论' }}</text><view><text>{{ selectedMonthly.validDays }}</text><text>有效训练日</text><text>{{ minutes(selectedMonthly.totalSeconds) }}</text><text>累计分钟</text><text>{{ selectedMonthly.completionRate }}%</text><text>完成率</text></view></view>
        <view v-if="selectedMonthly.validDays >= 5" class="report-section"><text class="section-title">执行效果</text><view class="metric-grid"><view><text>{{ selectedMonthly.dataCompletenessRate }}%</text><text>数据完整率</text></view><view><text>{{ stageAverage('heartRate') }}</text><text>平均心率</text></view><view><text>{{ stageMinimumOxygen }}</text><text>最低血氧</text></view><view><text>{{ stageAverage('borg') }}</text><text>平均Borg</text></view></view><text class="patient-summary">处方版本 {{ prescriptionVersion }} · FITT执行趋势保持稳定。异常、暂停和数据缺失已单独保留，身体指标不参与积分或排名。</text></view>
        <view class="report-section"><text class="section-title">安全与下一步</text><text class="patient-summary">{{ stoppedCount }} 次停止或异常记录。继续按医生处方完成训练；出现胸痛、明显气促或头晕时立即停止并按医院指引处理。</text></view>
      </view>
      <view v-else class="report-list"><button v-for="report in monthlyReports" :key="report.month" @tap="selectedMonth = report.month"><view><text>{{ report.month.replace('-', '年') }}月</text><text>{{ report.validDays >= 5 ? '阶段报告已生成' : report.validDays + '/5 个有效训练日' }}</text></view><view><text>{{ report.validDays >= 5 ? minutes(report.totalSeconds) + '分钟' : '继续积累' }}</text><text>查看 ›</text></view></button><view v-if="!monthlyReports.length" class="empty">当月达到5个有效训练日后生成阶段性报告。</view></view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { prescriptionItemKey, type SharedPrescriptionItem } from '@/lib/shared-patient'
import type { MonthlyTrainingReport, TrainingSession, VitalSnapshot } from '@/lib/prototype-data'

const props = defineProps<{ sessions: TrainingSession[]; prescriptionItems: SharedPrescriptionItem[]; prescriptionVersion: string }>()
const tab = ref<'daily' | 'monthly'>('daily')
const selectedDate = ref('')
const selectedMonth = ref('')
const completedSessions = computed(() => props.sessions.filter((item) => item.status === 'completed'))
const dailyReports = computed(() => {
  const dates = [...new Set(props.sessions.map((item) => item.localDate || item.createdAt.slice(0,10)))]
  return dates.sort().reverse().map((date) => {
    const sessions = props.sessions.filter((item) => (item.localDate || item.createdAt.slice(0,10)) === date)
    const completed = sessions.filter((item) => item.status === 'completed')
    return { date, sessions, totalSeconds: completed.reduce((sum,item)=>sum+item.durationSeconds,0), completedCount: completed.length, prescriptionCompleted: new Set(completed.map((item)=>item.prescriptionItemKey).filter(Boolean)).size, completeness: sessions.some((item)=>item.assessment?.completeness === 'complete') ? 'complete' : 'partial' }
  })
})
const selectedDaily = computed(() => dailyReports.value.find((item) => item.date === selectedDate.value))
const monthlyReports = computed<MonthlyTrainingReport[]>(() => {
  const current = new Date(); const currentMonth = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`
  const months = new Set(completedSessions.value.map((item)=>(item.localDate || item.createdAt.slice(0,10)).slice(0,7))); months.add(currentMonth)
  return [...months].sort().reverse().map((month) => {
    const sessions = completedSessions.value.filter((item)=>(item.localDate || item.createdAt.slice(0,10)).startsWith(month)); const days = new Set(sessions.map((item)=>item.localDate || item.createdAt.slice(0,10)))
    const completeAssessments = sessions.filter((item)=>item.assessment?.completeness === 'complete').length
    return { id:`MONTH-${month}`, month, validDays:days.size, sessionIds:sessions.map((item)=>item.id), totalSeconds:sessions.reduce((sum,item)=>sum+item.durationSeconds,0), completionRate:Math.min(100,Math.round(sessions.filter((item)=>item.planType==='prescription').length / Math.max(1,days.size*props.prescriptionItems.length)*100)), dataCompletenessRate:Math.round(completeAssessments/Math.max(1,sessions.length)*100) }
  })
})
const selectedMonthly = computed(() => monthlyReports.value.find((item)=>item.month===selectedMonth.value))
const monthSessions = computed(() => completedSessions.value.filter((item)=>(item.localDate || item.createdAt.slice(0,10)).startsWith(selectedMonth.value)))
const stoppedCount = computed(() => props.sessions.filter((item)=>(item.localDate || item.createdAt.slice(0,10)).startsWith(selectedMonth.value) && item.status==='stopped').length)
const stageMinimumOxygen = computed(() => { const values=monthSessions.value.flatMap((s)=>[s.assessment?.pre?.oxygenSaturation,s.assessment?.post?.oxygenSaturation]).filter((v):v is number=>typeof v==='number'); return values.length?`${Math.min(...values)}%`:'未采集' })
function minutes(seconds:number){return Math.round(seconds/60)}
function dateLabel(date:string){const parts=date.split('-');return `${Number(parts[1])}月${Number(parts[2])}日`}
function timeLabel(value:string){const date=new Date(value);return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`}
function itemDone(report:any,index:number){return report.sessions.some((session:TrainingSession)=>session.status==='completed'&&session.prescriptionItemKey===prescriptionItemKey(props.prescriptionItems[index],index))}
function snapshotValue(session:TrainingSession,key:keyof VitalSnapshot){const value=session.assessment?.post?.[key] ?? session.assessment?.pre?.[key];return typeof value==='number'?String(value):'未采集'}
function dailyConclusion(report:any){if(report.completedCount===0)return '当天未形成有效完成记录。';if(report.prescriptionCompleted===props.prescriptionItems.length)return '当天医生处方已全部完成，请按建议完成恢复和休息。';return `当天完成${report.completedCount}项运动，医院处方仍有未完成项目。`}
function stageConclusion(report:MonthlyTrainingReport){return report.completionRate>=75?'本月训练节奏较稳定，建议维持当前处方强度。':'本月已形成训练记录，下一阶段优先提高处方完成度。'}
function stageAverage(key:'heartRate'|'borg'){const values=monthSessions.value.flatMap((s)=>[s.assessment?.post?.[key],s.assessment?.pre?.[key]]).filter((v):v is number=>typeof v==='number');return values.length?String(Math.round(values.reduce((a,b)=>a+b,0)/values.length)):'未采集'}
</script>

<style scoped lang="scss">
.reports { display:grid; gap:20rpx; }.report-tabs { display:grid; grid-template-columns:1fr 1fr; padding:8rpx; border-radius:18rpx; background:#fff; }.report-tabs button { min-height:72rpx; border-radius:14rpx; color:#64748b; font-size:25rpx; }.report-tabs button.active { color:#fff; background:#0ea5a4; font-weight:700; }.report-list { display:grid; gap:14rpx; }.report-list > button { display:flex; min-height:128rpx; padding:24rpx; align-items:center; justify-content:space-between; border-radius:24rpx; background:#fff; box-shadow:0 4rpx 16rpx rgba(15,23,42,.05); text-align:left; }.report-list button view { display:flex; flex-direction:column; gap:8rpx; }.report-list button view:first-child text:first-child { color:#1e293b; font-size:29rpx; font-weight:700; }.report-list button text { color:#64748b; font-size:22rpx; }.report-list button view:last-child { align-items:flex-end; }.empty { padding:44rpx 28rpx; border-radius:24rpx; color:#64748b; background:#fff; font-size:24rpx; text-align:center; }.back { color:#0f766e; font-size:24rpx; }.report-detail { display:grid; gap:18rpx; }.report-hero,.stage-hero { display:flex; padding:30rpx; flex-direction:column; border-radius:24rpx; color:#fff; background:linear-gradient(135deg,#0f766e,#0ea5a4); }.report-hero text:first-child { color:#ccfbf1; font-size:21rpx; }.report-hero text:nth-child(2),.stage-hero>text:first-child { margin-top:8rpx; font-size:34rpx; font-weight:700; }.report-hero text:last-child,.stage-hero>text:nth-child(2) { margin-top:10rpx; color:#ccfbf1; font-size:23rpx; line-height:1.5; }.report-section { padding:26rpx; border-radius:24rpx; background:#fff; box-shadow:0 4rpx 16rpx rgba(15,23,42,.04); }.section-title { display:block; color:#1e293b; font-size:28rpx; font-weight:700; }.patient-summary { display:block; margin-top:12rpx; color:#475569; font-size:24rpx; line-height:1.65; }.metric-grid { display:grid; margin-top:20rpx; grid-template-columns:1fr 1fr; gap:12rpx; }.metric-grid view { display:flex; padding:18rpx; align-items:center; flex-direction:column; border-radius:16rpx; background:#f8fafc; }.metric-grid view text:first-child { color:#0f766e; font-size:31rpx; font-weight:700; }.metric-grid view text:last-child { margin-top:5rpx; color:#64748b; font-size:20rpx; }.execution-row { display:flex; min-height:86rpx; align-items:center; justify-content:space-between; border-top:1rpx solid #f1f5f9; }.execution-row view { display:flex; min-width:0; flex-direction:column; gap:5rpx; }.execution-row view text:first-child { color:#1e293b; font-size:25rpx; font-weight:600; }.execution-row view text:last-child { color:#64748b; font-size:20rpx; }.execution-row>text { color:#94a3b8; font-size:21rpx; }.execution-row>text.done { color:#0ea5a4; }.session-card { display:grid; padding:20rpx 0; grid-template-columns:1fr auto; gap:10rpx; border-top:1rpx solid #f1f5f9; }.session-card>view:first-child { display:flex; flex-direction:column; gap:5rpx; }.session-card>view:first-child text:first-child { color:#1e293b; font-size:26rpx; font-weight:650; }.session-card text { color:#64748b; font-size:20rpx; }.session-metrics { display:grid; grid-column:1/3; grid-template-columns:1fr 1fr; gap:8rpx; }.session-metrics text { padding:10rpx; border-radius:10rpx; background:#f8fafc; }.advice { grid-column:1/3; padding:14rpx; border-radius:12rpx; color:#475569!important; background:#ecfdf5; line-height:1.5; }.boundary { background:#f8fafc; }.boundary>text:last-child { display:block; margin-top:10rpx; color:#64748b; font-size:22rpx; line-height:1.6; }.stage-hero>view { display:grid; margin-top:24rpx; grid-template-columns:repeat(3,1fr); }.stage-hero>view text:nth-child(odd) { font-size:32rpx; font-weight:700; }.stage-hero>view text:nth-child(even) { color:#ccfbf1; font-size:18rpx; }
</style>
