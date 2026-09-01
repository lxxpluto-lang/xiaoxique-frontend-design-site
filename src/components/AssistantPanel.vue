<template>
  <view class="assistant-panel">
    <view class="assistant-hero">
      <image :src="mascot" mode="aspectFit" />
      <view><text class="eyebrow">小喜健康助手</text><text class="title">今天想了解什么？</text><text class="copy">我能解释训练与报告，也会提醒你留意身体信号。</text></view>
    </view>
    <view class="dialog-list">
      <view v-for="(message, index) in messages" :key="index" class="dialog" :class="'dialog--' + message.role"><text>{{ message.text }}</text></view>
    </view>
    <view class="prompt-grid">
      <button v-for="prompt in prompts" :key="prompt" @tap="ask(prompt)">{{ prompt }}</button>
    </view>
    <view class="assistant-input"><input v-model="query" confirm-type="send" placeholder="输入你的问题" @confirm="send" /><button @tap="send">发送</button></view>
    <view class="boundary"><text>重要提示</text><text>小喜不诊断疾病、不调整药物或处方。持续胸痛、呼吸困难或意识异常时，请立即停止运动并呼叫 120。</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { UserMode } from '@/lib/prototype-data'

const props = defineProps<{ mode: UserMode; displayName: string; mascot: string }>()
const query = ref('')
const messages = ref<Array<{ role: 'assistant' | 'user'; text: string }>>([
  { role: 'assistant', text: `你好，${props.displayName}。我可以帮你找到训练、理解报告和查看设备连接说明。` },
])
const prompts = ['今天练什么？', '报告怎么看？', '不舒服怎么办？', '如何连接设备？']

function answer(question: string) {
  if (/胸痛|不舒服|气促|头晕|心悸|呼吸困难/.test(question)) return '请立即停止运动并休息。若症状明显、持续或加重，请联系医生；持续胸痛、呼吸困难或意识异常请呼叫 120。'
  if (/练什么|训练|运动/.test(question)) return props.mode === 'cardiac' ? '你的医院计划项目会在首页标记“今日计划”。其他项目属于自主训练，不计入医院计划进度。' : '首页有八段锦、抗阻训练和音乐律动三项3分钟体验，可以按兴趣直接开始。'
  if (/报告|数据|指标/.test(question)) return props.mode === 'cardiac' ? '患者报告会区分计划内和自主训练，并展示运动前后心率、血氧、血压与Borg记录。' : '大众报告会记录运动时长、专项成绩、打卡和积分，不提供医疗诊断。'
  if (/设备|手环|连接/.test(question)) return '进入“我的—设备与数据来源”可查看模拟连接。正式版本接入设备前会先说明数据用途和授权范围。'
  return '我目前能回答训练、报告、安全提示和设备连接问题。这个回答来自可控原型，不是真实大模型诊疗建议。'
}

function ask(value: string) {
  messages.value.push({ role: 'user', text: value }, { role: 'assistant', text: answer(value) })
}

function send() {
  const value = query.value.trim()
  if (!value) return
  query.value = ''
  ask(value)
}
</script>

<style scoped lang="scss">
.assistant-panel { display: grid; gap: 24rpx; }
.assistant-hero { display: grid; padding: 24rpx; grid-template-columns: 150rpx 1fr; align-items: center; gap: 20rpx; border: 1rpx solid #c6e3df; border-radius: 24rpx; background: #f2faf8; }
.assistant-hero image { width: 150rpx; height: 150rpx; }
.eyebrow, .title, .copy { display: block; }
.eyebrow { color: #0c7464; font-size: 24rpx; font-weight: 600; }
.title { margin-top: 7rpx; color: #1f2329; font-size: 36rpx; font-weight: 700; }
.copy { margin-top: 8rpx; color: #646a73; font-size: 24rpx; line-height: 1.55; }
.dialog-list { display: grid; gap: 14rpx; }
.dialog { max-width: 86%; padding: 18rpx 22rpx; border-radius: 20rpx; font-size: 26rpx; line-height: 1.55; }
.dialog--assistant { justify-self: start; color: #1f2329; background: #fff; }
.dialog--user { justify-self: end; color: #fff; background: #16a085; }
.prompt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14rpx; }
.prompt-grid button { min-height: 88rpx; padding: 16rpx 18rpx; border: 1rpx solid #b9e9dc; border-radius: 20rpx; color: #0c7464; font-size: 24rpx; font-weight: 500; text-align: center; background: #fff; }
.prompt-grid button::after, .assistant-input button::after { border: 0; }
.assistant-input { display: grid; padding: 8rpx; grid-template-columns: 1fr 120rpx; gap: 10rpx; border: 1rpx solid #8fc9c4; border-radius: 20rpx; background: #fff; }
.assistant-input input { height: 72rpx; padding: 0 18rpx; font-size: 26rpx; }
.assistant-input button { display: flex; min-height: 72rpx; align-items: center; justify-content: center; border-radius: 16rpx; color: #fff; font-size: 24rpx; font-weight: 600; background: #16a085; }
.boundary { display: grid; gap: 8rpx; padding: 22rpx; border-left: 6rpx solid #b94f4b; border-radius: 18rpx; color: #7d4140; font-size: 24rpx; line-height: 1.6; background: #fff4f3; }
.boundary text:first-child { font-weight: 700; }
</style>
