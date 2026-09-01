<template>
  <view class="assistant-panel" data-testid="assistant-screen">
    <view class="assistant-hero">
      <image :src="mascot" mode="aspectFit" />
      <view>
        <text class="eyebrow">小喜 · 今日建议</text>
        <text class="title">{{ suggestionTitle }}</text>
        <text class="copy">{{ suggestionCopy }}</text>
      </view>
    </view>
    <view v-if="latestAdvice" class="advice-brief" :class="'level-' + latestAdvice.level" @tap="emit('open-reports')">
      <view><text>最近一次运动解读</text><text>{{ latestAdvice.title }}</text><text>{{ latestAdvice.summary }}</text></view><text>查看 ›</text>
    </view>
    <button class="assistant-primary" @tap="handlePrimary">{{ planCompleted ? '查看本次解读' : '开始今日运动' }}</button>
    <view class="question-block">
      <text class="section-title">你可以这样问</text>
      <view class="prompt-list"><button v-for="prompt in prompts" :key="prompt" @tap="ask(prompt)">{{ prompt }}<text>›</text></button></view>
    </view>
    <view v-if="messages.length" class="dialog-list"><view v-for="(message, index) in messages" :key="index" class="dialog" :class="'dialog--' + message.role">{{ message.text }}</view></view>
    <view class="assistant-input"><input v-model="query" placeholder="问问今天怎么练、数据怎么看" confirm-type="send" @confirm="send" /><button @tap="send">发送</button></view>
    <text class="boundary">小喜只做健康教育和规则解释，不能诊断疾病或直接修改医院处方。</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AIAdvice, UserMode } from '@/lib/prototype-data'

const props = defineProps<{ mode: UserMode; displayName: string; mascot: string; completedCount: number; streak: number; planTitle: string; planCompleted: boolean; latestAdvice?: AIAdvice }>()
const emit = defineEmits<{ (event: 'start-plan'): void; (event: 'open-reports'): void; (event: 'open-devices'): void; (event: 'open-profile'): void }>()
const prompts = ['今天适合怎么练？', '身体数据怎么理解？', '为什么建议联系医生？']
const messages = ref<Array<{ role: 'user' | 'assistant'; text: string }>>([])
const query = ref('')
const suggestionTitle = computed(() => props.planCompleted ? '今天的核心行动已完成' : `先完成 ${props.planTitle}`)
const suggestionCopy = computed(() => {
  if (props.latestAdvice?.level === 'stop') return '身体信号优先，先停止运动并按提示寻求专业帮助。'
  if (props.latestAdvice?.level === 'attention') return '最近一次恢复状态需要关注，患者计划等待医生确认。'
  if (props.planCompleted) return `连续 ${props.streak} 天，今天不需要为了积分额外加量。`
  return props.mode === 'cardiac' ? '开始前会按医院策略读取状态，异常时不会进入训练。' : '普通用户直接开始，完成后自动记录运动。'
})
function handlePrimary() { props.planCompleted ? emit('open-reports') : emit('start-plan') }
function answer(question: string) {
  if (/数据|心率|血氧/.test(question)) return props.latestAdvice ? `${props.latestAdvice.title}：${props.latestAdvice.summary}` : '先确认数据来源和时间；缺失或过期数据不会被判断为正常。'
  if (/医生|联系/.test(question)) return '患者计划的调整必须由医生确认。小喜只说明触发规则和下一步，不替代诊断。'
  if (/怎么练|今天/.test(question)) return props.planCompleted ? '今天保持当前剂量即可，明天继续本周路径。' : `先完成 ${props.planTitle}；有不适时立即停止。`
  if (/胸痛|气促|晕/.test(question)) return '请立即停止运动。症状明显、持续或加重时及时就医；紧急情况请呼叫120。'
  return '我会围绕今日计划、身体数据和运动报告回答；处方调整由医生确认。'
}
function ask(value: string) { messages.value.push({ role: 'user', text: value }, { role: 'assistant', text: answer(value) }) }
function send() { const value = query.value.trim(); if (!value) return; query.value = ''; ask(value) }
</script>

<style scoped lang="scss">
.assistant-panel { display: grid; gap: 24rpx; }.assistant-hero { display: grid; min-height: 232rpx; padding: 32rpx; grid-template-columns: 144rpx 1fr; align-items: center; gap: 24rpx; border-radius: 24rpx; background: linear-gradient(135deg,#ecfdf5,#ccfbf1); box-shadow: 0 4rpx 16rpx rgba(15,23,42,.04); }.assistant-hero image { width: 144rpx; height: 160rpx; }
.eyebrow,.title,.copy,.section-title,.advice-brief view text,.boundary { display: block; }.eyebrow { color: #0f766e; font-size: 24rpx; font-weight: 600; }.title { margin-top: 8rpx; color: #1e293b; font-size: 36rpx; font-weight: 700; }.copy { margin-top: 8rpx; color: #64748b; font-size: 26rpx; line-height: 1.55; }
.advice-brief { display: grid; padding: 32rpx; grid-template-columns: 1fr auto; align-items: center; gap: 16rpx; border: 0; border-radius: 24rpx; background: #fff; box-shadow: 0 4rpx 16rpx rgba(15,23,42,.04); }.advice-brief view text:first-child { color: #64748b; font-size: 24rpx; }.advice-brief view text:nth-child(2) { margin-top: 8rpx; color: #1e293b; font-size: 32rpx; font-weight: 600; }.advice-brief view text:nth-child(3) { margin-top: 8rpx; color: #64748b; font-size: 26rpx; line-height: 1.5; }.advice-brief > text { color: #0ea5a4; font-size: 26rpx; }.advice-brief.level-attention { background: #fffbeb; }.advice-brief.level-stop { background: #fef2f2; }
.assistant-primary { display: flex; min-height: 88rpx; align-items: center; justify-content: center; border-radius: 16rpx; color: #fff; background: #0ea5a4; font-size: 32rpx; font-weight: 600; }.question-block { padding: 32rpx; border: 0; border-radius: 24rpx; background: #fff; box-shadow: 0 4rpx 16rpx rgba(15,23,42,.04); }.section-title { color: #1e293b; font-size: 32rpx; font-weight: 600; }.prompt-list { display: grid; margin-top: 16rpx; }.prompt-list button { display: flex; min-height: 88rpx; align-items: center; justify-content: space-between; color: #475569; font-size: 28rpx; text-align: left; border-top: 1rpx solid #f1f5f9; }.prompt-list button:first-child { border-top: 0; }.prompt-list button text { color: #cbd5e1; }
.dialog-list { display: grid; gap: 12rpx; }.dialog { max-width: 88%; padding: 18rpx 22rpx; border-radius: 16rpx; font-size: 26rpx; line-height: 1.5; }.dialog--assistant { background: #fff; box-shadow: 0 4rpx 16rpx rgba(15,23,42,.04); }.dialog--user { justify-self: end; color: #fff; background: #0ea5a4; }.assistant-input { display: grid; padding: 8rpx; grid-template-columns: 1fr 120rpx; gap: 8rpx; border: 1rpx solid #e2e8f0; border-radius: 16rpx; background: #fff; }.assistant-input input { height: 72rpx; padding: 0 16rpx; font-size: 26rpx; }.assistant-input button { display: flex; align-items: center; justify-content: center; border-radius: 12rpx; color: #fff; background: #0ea5a4; font-size: 26rpx; }.boundary { padding: 20rpx; border-radius: 16rpx; color: #64748b; background: #f1f5f9; font-size: 22rpx; line-height: 1.5; }
</style>
