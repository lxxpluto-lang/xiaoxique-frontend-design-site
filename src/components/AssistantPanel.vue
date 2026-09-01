<template>
  <view class="assistant-panel" data-testid="assistant-task-center">
    <view class="assistant-hero">
      <image :src="mascot" mode="aspectFit" />
      <view>
        <text class="eyebrow">小喜健康助手</text>
        <text class="title">先选一件要完成的事</text>
        <text class="copy">我会结合今日计划和已有数据给出下一步，不用从空白问题开始。</text>
      </view>
    </view>

    <view class="assistant-context" data-testid="assistant-context">
      <view><text class="context-label">今日计划</text><text class="context-value">{{ planTitle }}</text></view>
      <view><text class="context-label">当前进度</text><text class="context-value">{{ planCompleted ? '核心任务已完成' : '核心任务待完成' }}</text></view>
      <view><text class="context-label">连续行动</text><text class="context-value">{{ streak }} 天</text></view>
    </view>

    <view class="task-section-heading"><text>我能帮你完成</text><text>选择后直接给出结构化建议</text></view>
    <view class="task-grid">
      <button v-for="task in taskCards" :key="task.id" class="task-card" :class="{ active: activeTask === task.id }" :data-testid="'assistant-task-' + task.id" @tap="activeTask = task.id">
        <text class="task-card__mark">{{ task.mark }}</text><text class="task-card__title">{{ task.title }}</text><text class="task-card__copy">{{ task.copy }}</text>
      </button>
    </view>

    <view class="assistant-result" :data-state="activeTask" data-testid="assistant-structured-result">
      <view class="result-heading"><view><text class="result-kicker">小喜已结合当前资料</text><text class="result-title">{{ activeResult.title }}</text></view><text class="result-state">{{ activeResult.state }}</text></view>
      <text class="result-summary">{{ activeResult.summary }}</text>
      <view class="evidence-list"><view v-for="item in activeResult.evidence" :key="item.label"><text>{{ item.label }}</text><text>{{ item.value }}</text></view></view>
      <view class="next-step-list"><text class="next-step-title">建议下一步</text><view v-for="(step, index) in activeResult.steps" :key="step"><text>{{ index + 1 }}</text><text>{{ step }}</text></view></view>
      <button class="assistant-primary" data-testid="assistant-primary-action" @tap="handlePrimaryAction">{{ activeResult.action }}</button>
      <text class="result-source">{{ activeResult.source }}</text>
    </view>

    <view class="followup-block">
      <text class="followup-title">还想继续问</text>
      <view class="dialog-list"><view v-for="(message, index) in messages" :key="index" class="dialog" :class="'dialog--' + message.role"><text>{{ message.text }}</text></view></view>
      <view class="prompt-row"><button v-for="prompt in prompts" :key="prompt" @tap="ask(prompt)">{{ prompt }}</button></view>
      <view class="assistant-input"><input v-model="query" confirm-type="send" placeholder="补充描述你的情况" @confirm="send" /><button @tap="send">发送</button></view>
    </view>

    <view class="boundary"><text>重要提示</text><text>小喜不诊断疾病、不调整药物或处方。持续胸痛、呼吸困难或意识异常时，请立即停止运动并呼叫 120。</text></view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { HealthMetric, UserMode } from '@/lib/prototype-data'

type TaskId = 'plan' | 'metrics' | 'report' | 'adjust'

const props = defineProps<{
  mode: UserMode
  displayName: string
  mascot: string
  metrics: HealthMetric[]
  completedCount: number
  streak: number
  planTitle: string
  planCompleted: boolean
}>()

const emit = defineEmits<{
  (event: 'start-plan'): void
  (event: 'open-reports'): void
  (event: 'open-devices'): void
  (event: 'open-profile'): void
}>()

const activeTask = ref<TaskId>('plan')
const query = ref('')
const messages = ref<Array<{ role: 'assistant' | 'user'; text: string }>>([])
const prompts = ['运动前有点紧张', '今天时间不够', '数据为什么会波动']

const taskCards = [
  { id: 'plan' as const, mark: '练', title: '今天怎么练', copy: '读取计划后给出一个主行动' },
  { id: 'metrics' as const, mark: '数', title: '数值怎么了', copy: '解释变化、来源与可信度' },
  { id: 'report' as const, mark: '报', title: '报告怎么看', copy: '先看结论，再展开证据' },
  { id: 'adjust' as const, mark: '调', title: '计划要调整吗', copy: '结合完成率与身体感受判断' },
]

const activeResult = computed(() => {
  const primaryMetric = props.metrics[0]
  const metricEvidence = props.metrics.slice(0, 2).map((metric) => ({ label: `${metric.label} · ${metric.source}`, value: `${metric.value}${metric.unit}，${metric.status}` }))

  if (activeTask.value === 'metrics') return {
    title: '目前没有需要立即处理的模拟异常', state: '可继续观察',
    summary: '先核对数据来源与同步时间，再看连续趋势。单次变化不会被直接解释为健康结论。',
    evidence: metricEvidence,
    steps: ['确认设备最近一次同步是否成功', '连续记录后再比较趋势范围', '出现明显不适时停止运动并联系专业人员'],
    action: '查看设备与数据来源', source: '依据：当前模拟指标与设备来源；本结果不构成诊断。',
  }

  if (activeTask.value === 'report') return {
    title: props.completedCount ? '今天已有运动记录可查看' : '完成训练后会自动生成结构化报告', state: props.completedCount ? '已有记录' : '等待行动',
    summary: '报告按“完成结果—身体反馈—数据来源—下一步”展示，避免用一个总分替代过程解释。',
    evidence: [{ label: '今日已完成', value: `${props.completedCount} 项` }, { label: '连续行动', value: `${props.streak} 天` }],
    steps: props.completedCount ? ['先看本次是否完成计划内任务', '再看运动前后记录与身体感受', '根据结果决定明日维持或降低强度'] : ['先完成今日核心训练', '记录运动后的真实感受', '生成报告并查看下一步'],
    action: props.completedCount ? '打开我的报告' : '开始今日计划', source: '依据：本机演示训练记录；医院模式另行标记处方内与自主训练。',
  }

  if (activeTask.value === 'adjust') return {
    title: props.planCompleted ? '今天先保持，不必额外加量' : '先完成当前小剂量计划，再判断是否调整', state: '保守建议',
    summary: props.mode === 'cardiac' ? '医院处方不由小喜修改；若身体感受与平时不同，应暂停并联系康复师。' : '一次未完成不会被惩罚。连续几天难以完成时，可以降低时长或更换更容易坚持的动作。',
    evidence: [{ label: '当前计划', value: props.planTitle }, { label: '今日状态', value: props.planCompleted ? '已完成' : '待完成' }],
    steps: props.planCompleted ? ['记录今天的身体感受', '明天保持同等剂量', '连续一周后再看趋势'] : ['先尝试 3 分钟核心任务', '不适时立即停止，不为积分勉强', '连续难以完成时再调整目标'],
    action: props.mode === 'cardiac' ? '查看健康档案' : '查看并确认目标', source: props.mode === 'cardiac' ? '依据：医院共享演示计划；处方调整必须由专业人员完成。' : '依据：当前目标与本机完成记录；不预测确定的减重日期。',
  }

  return {
    title: props.planCompleted ? '今日核心计划已完成' : `建议先完成 ${props.planTitle}`, state: props.planCompleted ? '已完成' : '今日优先',
    summary: props.planCompleted ? '今天不需要为了积分继续加量，可以查看报告并完成恢复记录。' : `结合${props.mode === 'cardiac' ? '医院康复计划' : '日常运动目标'}与当前 ${primaryMetric.label}，先完成一个 3 分钟小任务。`,
    evidence: [{ label: props.mode === 'cardiac' ? '推荐来源' : '当前目标', value: props.mode === 'cardiac' ? '医院共享演示计划' : '建立日常运动习惯' }, { label: `${primaryMetric.label} · ${primaryMetric.source}`, value: `${primaryMetric.value}${primaryMetric.unit}，${primaryMetric.status}` }],
    steps: props.planCompleted ? ['查看本次运动报告', '确认身体恢复情况', '明天继续同等剂量'] : ['先确认今天适合运动', `完成 ${props.planTitle}`, '记录身体感受并生成报告'],
    action: props.planCompleted ? '查看今日报告' : '开始今日计划', source: '依据：当前用户模式、今日任务、本机模拟指标和训练记录。',
  }
})

function handlePrimaryAction() {
  if (activeTask.value === 'metrics') emit('open-devices')
  else if (activeTask.value === 'report') props.completedCount ? emit('open-reports') : emit('start-plan')
  else if (activeTask.value === 'adjust') emit('open-profile')
  else props.planCompleted ? emit('open-reports') : emit('start-plan')
}

function answer(question: string) {
  if (/胸痛|不舒服|气促|头晕|心悸|呼吸困难/.test(question)) return '请立即停止运动并休息。若症状明显、持续或加重，请联系医生；持续胸痛、呼吸困难或意识异常请呼叫 120。'
  if (/时间|来不及|太忙/.test(question)) return '可以先完成 3 分钟核心任务，不需要为了积分加量。若连续几天无法完成，再到健康档案调整目标。'
  if (/数据|波动|指标/.test(question)) return '先核对数据来源和同步时间，再看连续趋势。单次变化不能替代专业判断。'
  return '我会优先围绕今日计划、身体数值、运动报告和计划调整回答；医疗诊断与处方调整仍需专业人员完成。'
}

function ask(value: string) { messages.value.push({ role: 'user', text: value }, { role: 'assistant', text: answer(value) }) }
function send() { const value = query.value.trim(); if (!value) return; query.value = ''; ask(value) }
</script>

<style scoped lang="scss">
.assistant-panel { display: grid; gap: 24rpx; }
.assistant-hero { display: grid; min-height: 220rpx; padding: 24rpx; grid-template-columns: 150rpx 1fr; align-items: center; gap: 20rpx; overflow: hidden; border: 1rpx solid #b9e9dc; border-radius: 28rpx; background: linear-gradient(135deg, #eefbf7 0%, #ddf6ee 100%); }
.assistant-hero image { width: 150rpx; height: 150rpx; transform: scale(1.16); }
.eyebrow, .title, .copy, .context-label, .context-value, .task-card__mark, .task-card__title, .task-card__copy, .result-kicker, .result-title, .result-summary, .result-source, .next-step-title, .followup-title { display: block; }
.eyebrow { color: #0c7464; font-size: 22rpx; font-weight: 700; }
.title { margin-top: 7rpx; color: #1f2329; font-size: 34rpx; font-weight: 700; }
.copy { margin-top: 8rpx; color: #646a73; font-size: 23rpx; line-height: 1.55; }
.assistant-context { display: grid; padding: 20rpx 10rpx; grid-template-columns: 1.3fr 1fr .7fr; border: 1rpx solid #ebeef2; border-radius: 24rpx; background: #fff; }
.assistant-context > view { min-width: 0; padding: 0 16rpx; border-left: 1rpx solid #ebeef2; }
.assistant-context > view:first-child { border-left: 0; }
.context-label { color: #7c8582; font-size: 20rpx; }.context-value { overflow: hidden; margin-top: 7rpx; color: #1f2329; font-size: 23rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.task-section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16rpx; }.task-section-heading text:first-child { color: #1f2329; font-size: 29rpx; font-weight: 700; }.task-section-heading text:last-child { color: #7c8582; font-size: 21rpx; }
.task-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14rpx; }.task-card { min-height: 170rpx; padding: 20rpx; border: 1rpx solid #e1e7e5; border-radius: 22rpx; background: #fff; text-align: left; }.task-card.active { border-color: #53b8a4; background: #eefbf7; box-shadow: 0 10rpx 24rpx rgba(22,160,133,.08); }
.task-card__mark { display: flex; width: 46rpx; height: 46rpx; align-items: center; justify-content: center; border-radius: 15rpx; color: #0c7464; font-size: 21rpx; font-weight: 700; background: #ddf6ee; }.task-card__title { margin-top: 12rpx; color: #1f2329; font-size: 26rpx; font-weight: 700; }.task-card__copy { margin-top: 5rpx; color: #646a73; font-size: 21rpx; line-height: 1.45; }
.assistant-result { padding: 26rpx; border: 1rpx solid #b9e9dc; border-radius: 26rpx; background: #fff; }.result-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18rpx; }.result-heading > view { min-width: 0; flex: 1; }.result-kicker { color: #16a085; font-size: 21rpx; font-weight: 700; }.result-title { margin-top: 7rpx; color: #1f2329; font-size: 30rpx; font-weight: 700; line-height: 1.4; }.result-state { flex-shrink: 0; padding: 8rpx 12rpx; border-radius: 999rpx; color: #0c7464; font-size: 20rpx; font-weight: 700; background: #ddf6ee; }.result-summary { margin-top: 16rpx; color: #4f5b57; font-size: 24rpx; line-height: 1.6; }
.evidence-list { margin-top: 20rpx; overflow: hidden; border: 1rpx solid #ebeef2; border-radius: 20rpx; }.evidence-list view { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; padding: 16rpx 18rpx; border-top: 1rpx solid #ebeef2; }.evidence-list view:first-child { border-top: 0; }.evidence-list text { color: #646a73; font-size: 21rpx; }.evidence-list text:last-child { color: #1f2329; font-weight: 600; text-align: right; }
.next-step-list { margin-top: 20rpx; }.next-step-title { margin-bottom: 10rpx; color: #1f2329; font-size: 23rpx; font-weight: 700; }.next-step-list > view { display: grid; margin-top: 9rpx; grid-template-columns: 38rpx 1fr; align-items: start; gap: 10rpx; color: #4f5b57; font-size: 22rpx; line-height: 1.5; }.next-step-list > view text:first-child { display: flex; width: 34rpx; height: 34rpx; align-items: center; justify-content: center; border-radius: 50%; color: #0c7464; font-size: 19rpx; font-weight: 700; background: #ddf6ee; }
.assistant-primary { display: flex; width: 100%; min-height: 84rpx; margin-top: 22rpx; align-items: center; justify-content: center; border-radius: 20rpx; color: #fff; font-size: 25rpx; font-weight: 700; background: #16a085; }.result-source { margin-top: 13rpx; color: #8b9692; font-size: 20rpx; line-height: 1.5; }
.followup-block { padding: 24rpx; border: 1rpx solid #ebeef2; border-radius: 24rpx; background: #fff; }.followup-title { color: #1f2329; font-size: 25rpx; font-weight: 700; }.dialog-list { display: grid; gap: 12rpx; margin-top: 15rpx; }.dialog { max-width: 88%; padding: 16rpx 20rpx; border-radius: 18rpx; font-size: 23rpx; line-height: 1.55; }.dialog--assistant { justify-self: start; color: #1f2329; background: #f1f4f3; }.dialog--user { justify-self: end; color: #fff; background: #16a085; }
.prompt-row { display: flex; gap: 9rpx; margin-top: 16rpx; overflow-x: auto; }.prompt-row button { flex-shrink: 0; min-height: 64rpx; padding: 0 16rpx; border: 1rpx solid #cce4df; border-radius: 999rpx; color: #0c7464; font-size: 21rpx; background: #fff; }.assistant-input { display: grid; margin-top: 14rpx; padding: 7rpx; grid-template-columns: 1fr 108rpx; gap: 8rpx; border: 1rpx solid #b9d8d1; border-radius: 18rpx; background: #fff; }.assistant-input input { height: 68rpx; padding: 0 15rpx; font-size: 23rpx; }.assistant-input button { display: flex; min-height: 68rpx; align-items: center; justify-content: center; border-radius: 14rpx; color: #fff; font-size: 22rpx; font-weight: 600; background: #16a085; }
.boundary { display: grid; gap: 7rpx; padding: 20rpx 22rpx; border-left: 6rpx solid #b94f4b; border-radius: 18rpx; color: #7d4140; font-size: 22rpx; line-height: 1.6; background: #fff4f3; }.boundary text:first-child { font-weight: 700; }
</style>
