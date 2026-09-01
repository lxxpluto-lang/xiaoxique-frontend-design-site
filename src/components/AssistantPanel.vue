<template>
  <view class="assistant-panel" data-testid="assistant-screen">
    <view class="assistant-hero">
      <image :src="mascot" mode="aspectFit" />
      <view>
        <text class="eyebrow">小喜 · 健康问答</text>
        <text class="title">有问题就问我</text>
        <text class="copy">我可以解释今日处方、身体数据和训练报告。</text>
      </view>
    </view>
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
import { ref } from 'vue'
import type { AIAdvice, UserMode } from '@/lib/prototype-data'

const props = defineProps<{ mode: UserMode; displayName: string; mascot: string; completedCount: number; streak: number; planTitle: string; planCompleted: boolean; latestAdvice?: AIAdvice }>()
defineEmits<{ (event: 'start-plan'): void; (event: 'open-reports'): void; (event: 'open-devices'): void; (event: 'open-profile'): void }>()
const prompts = ['医生今天给我安排了什么？', '身体数据怎么理解？', '单次报告怎么看？']
const messages = ref<Array<{ role: 'user' | 'assistant'; text: string }>>([])
const query = ref('')
function answer(question: string) {
  if (/数据|心率|血氧/.test(question)) return props.latestAdvice ? `${props.latestAdvice.title}：${props.latestAdvice.summary}` : '先确认数据来源和时间；缺失或过期数据不会被判断为正常。'
  if (/医生|联系/.test(question)) return '患者计划的调整必须由医生确认。小喜只说明触发规则和下一步，不替代诊断。'
  if (/处方|怎么练|今天/.test(question)) return props.mode === 'cardiac' ? `请按“今日”中的医院处方逐项完成；当前卡片会展示强度和时长。有不适时立即停止。` : `可从“今日”选择 ${props.planTitle}，完成后会自动记录。`
  if (/报告/.test(question)) return '单次报告合并当天全部运动；阶段性报告在当月累计5个有效训练日后生成。缺失数据会明确标记为未采集。'
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
