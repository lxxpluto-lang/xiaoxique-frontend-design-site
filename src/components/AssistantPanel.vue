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
.assistant-panel { display: grid; gap: 22rpx; }.assistant-hero { display: grid; min-height: 220rpx; padding: 26rpx; grid-template-columns: 138rpx 1fr; align-items: center; gap: 18rpx; border-radius: 30rpx; background: linear-gradient(135deg, #e9faf5, #dff4ee); }.assistant-hero image { width: 138rpx; height: 150rpx; transform: scale(1.14); }
.eyebrow,.title,.copy,.section-title,.advice-brief view text,.boundary { display: block; }.eyebrow { color: #0c7464; font-size: 22rpx; font-weight: 700; }.title { margin-top: 7rpx; color: #172b28; font-size: 34rpx; font-weight: 750; }.copy { margin-top: 8rpx; color: #5f6d69; font-size: 23rpx; line-height: 1.55; }
.advice-brief { display: grid; padding: 22rpx; grid-template-columns: 1fr auto; align-items: center; gap: 14rpx; border: 1rpx solid #cae5df; border-radius: 24rpx; background: #fff; }.advice-brief view text:first-child { color: #7a8985; font-size: 20rpx; }.advice-brief view text:nth-child(2) { margin-top: 5rpx; color: #172b28; font-size: 27rpx; font-weight: 700; }.advice-brief view text:nth-child(3) { margin-top: 5rpx; color: #63706d; font-size: 21rpx; line-height: 1.45; }.advice-brief > text { color: #0c806e; font-size: 22rpx; }.advice-brief.level-attention { border-color: #f0d59c; background: #fffaf0; }.advice-brief.level-stop { border-color: #efc2bf; background: #fff5f4; }
.assistant-primary { display: flex; min-height: 88rpx; align-items: center; justify-content: center; border-radius: 22rpx; color: #fff; background: #11866f; font-size: 26rpx; font-weight: 700; }.question-block { padding: 22rpx; border: 1rpx solid #e6ecea; border-radius: 24rpx; background: #fff; }.section-title { color: #172b28; font-size: 27rpx; font-weight: 700; }.prompt-list { display: grid; gap: 4rpx; margin-top: 11rpx; }.prompt-list button { display: flex; min-height: 70rpx; align-items: center; justify-content: space-between; color: #33433f; font-size: 23rpx; text-align: left; border-top: 1rpx solid #edf1f0; }.prompt-list button:first-child { border-top: 0; }.prompt-list button text { color: #8aa09a; }
.dialog-list { display: grid; gap: 10rpx; }.dialog { max-width: 88%; padding: 15rpx 18rpx; border-radius: 18rpx; font-size: 22rpx; line-height: 1.5; }.dialog--assistant { background: #fff; }.dialog--user { justify-self: end; color: #fff; background: #11866f; }.assistant-input { display: grid; padding: 7rpx; grid-template-columns: 1fr 104rpx; gap: 7rpx; border: 1rpx solid #cddbd7; border-radius: 20rpx; background: #fff; }.assistant-input input { height: 70rpx; padding: 0 14rpx; font-size: 22rpx; }.assistant-input button { display: flex; align-items: center; justify-content: center; border-radius: 15rpx; color: #fff; background: #11866f; font-size: 22rpx; }.boundary { padding: 18rpx; border-radius: 18rpx; color: #776b69; background: #f5f3f2; font-size: 20rpx; line-height: 1.5; }
</style>
