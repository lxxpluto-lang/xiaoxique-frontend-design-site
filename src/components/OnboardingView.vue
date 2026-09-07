<template>
  <view class="onboarding" :class="{ 'onboarding--binding': step === 'binding' }">
    <view v-if="step === 'mode'" class="brand-row">
      <view class="brand-mark"><image src="/static/replica-v7/onboarding-logo.png" mode="aspectFit" /></view>
      <view><text class="brand-name">小喜鹊运动伙伴</text><text class="brand-caption">科学运动，安心康复</text></view>
    </view>
    <view v-if="step === 'mode'" class="welcome" data-testid="onboarding-mode">
      <view class="welcome-heading" data-testid="region-onboarding-heading">
        <image class="welcome-magpie" src="/static/replica-v7/onboarding-flight.png" mode="aspectFit" />
        <text class="welcome-title">选择使用方式</text><text class="welcome-copy">今天从哪里开始？</text>
      </view>
      <button class="mode-card mode-card--public" data-testid="choose-public" @tap="emit('choose', 'public')">
        <view class="mode-icon"><image src="/static/replica-v7/onboarding-shoe.png" mode="aspectFit" aria-hidden="true" /></view>
        <view class="mode-copy"><text>日常运动</text><text>无需评估，直接开始今日运动</text></view><text class="mode-arrow">›</text>
        <view class="leaf-decoration-mask" aria-hidden="true"><view class="leaf-decoration" /></view>
      </button>
      <button class="mode-card" data-testid="choose-cardiac" @tap="emit('choose', 'cardiac')">
        <view class="mode-icon"><image src="/static/replica-v7/onboarding-checklist.png" mode="aspectFit" aria-hidden="true" /></view>
        <view class="mode-copy"><text>心脏康复</text><text>关联医院计划，按策略记录状态</text></view><text class="mode-arrow">›</text>
        <view class="leaf-decoration-mask" aria-hidden="true"><view class="leaf-decoration" /></view>
      </button>
      <button class="boundary-link" data-testid="open-medical-boundary" @tap="emit('boundary')"><AppIcon src="/static/icons/magpie-line/safety.svg" :size="32" /><text>健康助手与医疗边界 ›</text></button>
    </view>
    <view v-else class="binding" data-testid="onboarding-binding" :data-state="bindingState">
      <view class="binding-header"><button aria-label="返回使用方式" @tap="emit('back')">‹</button><text>关联康复计划</text><view /></view>
      <view class="binding-steps"><text class="current">❶ 输入患者号</text><view /><text :class="{ current: bindingState === 'matched' }">❷ 确认并进入</text></view>
      <view class="binding-card">
        <view class="hospital-row"><view class="hospital-icon"><AppIcon src="/static/icons/magpie-line/archive.svg" :size="52" /></view><view><text>医院</text><text>{{ hospital }}</text></view><text>✓</text></view>
        <view class="patient-field"><text>患者号</text><input :value="visitNumber" data-testid="visit-number" placeholder="输入 256572 或 P-256572" maxlength="16" aria-label="患者号" @input="updateNumber" @confirm="emit('bind')" /></view>
      </view>
      <view v-if="bindingState === 'matched'" class="binding-card matched" data-testid="binding-result"><text class="matched-title">已匹配康复计划</text><view><image src="/static/replica-v7/binding-flight.png" mode="aspectFit" /><view><text>{{ patient }} · {{ stage }}</text><text>处方版本 {{ version }}</text><text>{{ prescriptionNo }}</text></view></view></view>
      <view v-else-if="bindingState === 'error'" class="binding-error" data-testid="binding-error" role="alert">未找到计划，请检查患者号。输入内容已保留，可以修改后重试。</view>
      <view v-else class="binding-hint"><AppIcon src="/static/icons/magpie-line/safety.svg" :size="32" /><text>关联后即可查看医院计划，按个人状态安全运动。</text></view>
      <view class="binding-footer"><button class="binding-primary" data-testid="bind-plan" :loading="bindingState === 'loading'" :disabled="bindingState === 'loading' || !visitNumber.trim()" @tap="emit('bind')">{{ bindingState === 'matched' ? '进入今日计划' : '查询康复计划' }}</button><text>仅用于原型演示，不上传真实信息</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import type { UserMode } from '@/lib/prototype-data'
defineProps<{ step: 'mode' | 'binding'; bindingState: 'idle' | 'loading' | 'matched' | 'error'; visitNumber: string; hospital: string; patient: string; stage: string; version: string; prescriptionNo: string; mascot: string }>()
const emit = defineEmits<{ (e:'choose', mode:UserMode):void; (e:'back'):void; (e:'boundary'):void; (e:'bind'):void; (e:'update:visitNumber',value:string):void }>()
function updateNumber(event: Event | { detail: { value: string } }) {
  const value = 'detail' in event ? event.detail.value : (event.target as HTMLInputElement | null)?.value
  emit('update:visitNumber', String(value ?? ''))
}
</script>

<style scoped lang="scss">
.onboarding { min-height:100vh; padding:58rpx 44rpx 36rpx; background:radial-gradient(ellipse at 90% -10%,#c9f3e9 0,transparent 52%),linear-gradient(150deg,#effbf7,#fff 68%,#f5fcfa); color:var(--color-text-primary); }
.brand-row { display:flex; align-items:center; gap:20rpx; }.brand-mark { width:74rpx; height:74rpx; overflow:hidden; border-radius:22rpx; background:linear-gradient(140deg,#00ad99,#006c62); }.brand-mark image { width:100%; height:100%; }.brand-row text { display:block; }.brand-name { font-size:31rpx; font-weight:750; }.brand-caption { margin-top:6rpx; color:var(--color-text-secondary); font-size:24rpx; }
.welcome-heading { position:relative; display:flex; min-height:322rpx; padding-top:112rpx; flex-direction:column; justify-content:center; }.welcome-title { z-index:1; font-size:56rpx; line-height:1.3; font-weight:800; letter-spacing:-2rpx; }.welcome-copy { z-index:1; margin-top:16rpx; color:var(--color-brand-pressed); font-size:32rpx; }.welcome-magpie { position:absolute; width:300rpx; height:300rpx; top:24rpx; right:0; }
.mode-card { position:relative; display:grid; width:100%; min-height:356rpx; padding:52rpx 30rpx 68rpx; grid-template-columns:170rpx minmax(0,1fr) 56rpx; gap:18rpx; align-items:center; overflow:hidden; border:3rpx solid #fff; border-radius:34rpx; text-align:left; background:rgba(255,255,255,.94); box-shadow:var(--shadow-card); }.mode-card + .mode-card { margin-top:40rpx; }.mode-card--public { border-color:#0bad9b; background:linear-gradient(125deg,#e9fbf5,#f5fdfb); }.mode-icon { display:flex; width:160rpx; height:172rpx; justify-content:center; align-items:center; border:6rpx solid #fff; border-radius:50%; overflow:hidden; background:#f1faf6; box-shadow:0 0 0 2rpx #bdeee2; }.mode-copy { z-index:1; }.mode-copy text { display:block; }.mode-copy text:first-child { font-size:40rpx; font-weight:760; white-space:nowrap; }.mode-copy text:last-child { margin-top:19rpx; color:var(--color-text-secondary); font-size:24rpx; line-height:1.6; }.mode-arrow { display:flex; width:60rpx; height:64rpx; align-items:center; justify-content:center; border-radius:50%; background:var(--gradient-brand); color:#fff; font-size:58rpx; line-height:1; }.recommended { position:absolute; left:32rpx; bottom:38rpx; padding:8rpx 18rpx; border-radius:999rpx; color:#007667; background:#cdf5e9; font-size:24rpx; }.leaf-decoration { position:absolute; width:170rpx; height:170rpx; right:-44rpx; bottom:-70rpx; border-radius:70% 0 70% 0; transform:rotate(-26deg); background:#d6f6eb; }.leaf-decoration::before { content:''; position:absolute; width:90rpx; height:135rpx; left:-65rpx; top:-12rpx; border-radius:80% 0 80% 0; transform:rotate(-40deg); background:#dcf7ee; }
.mode-icon > image { width:100%; height:100%; border-radius:50%; }
.leaf-decoration-mask { position:absolute; inset:0; overflow:hidden; pointer-events:none; border-radius:inherit; }
.boundary-link { display:flex; min-height: 92rpx; margin:180rpx auto 0; align-items:center; justify-content:center; gap:12rpx; color:var(--color-brand-pressed); font-size:24rpx; }
.onboarding--binding { padding:32rpx 30rpx; }.binding { display:flex; min-height:calc(100vh - 64rpx); flex-direction:column; gap:36rpx; }.binding-header { display:grid; align-items:center; grid-template-columns:70rpx 1fr 70rpx; text-align:center; }.binding-header button { width:66rpx; height:66rpx; border:2rpx solid #fff; border-radius:22rpx; background:#f1fcf8; color:#123a34; font-size:62rpx; line-height:.85; }.binding-header>text { font-size:36rpx; font-weight:750; }.binding-steps { display:flex; align-items:center; justify-content:center; gap:16rpx; min-height:64rpx; color:#8e9c97; font-size:26rpx; }.binding-steps>view { width:70rpx; border-top:2rpx dashed #b8ccc6; }.binding-steps .current { color:var(--color-brand-pressed); font-weight:650; }
.binding-card { padding:30rpx; border-radius:38rpx; background:rgba(255,255,255,.95); box-shadow:var(--shadow-card); }.hospital-row { display:flex; align-items:center; gap:22rpx; padding:16rpx 0 40rpx; border-bottom:1rpx solid var(--color-line); }.hospital-icon { display:flex; width:98rpx; height:98rpx; align-items:center; justify-content:center; flex:none; border-radius:50%; background:var(--color-brand-soft); }.hospital-row>view:nth-child(2) { flex:1; min-width:0; }.hospital-row text { display:block; }.hospital-row>view:nth-child(2)>text:first-child { font-size:31rpx; font-weight:750; }.hospital-row>view:nth-child(2)>text:last-child { margin-top:14rpx; font-size:25rpx; color:var(--color-text-secondary); }.hospital-row>text { color:var(--color-brand); }.patient-field { padding-top:34rpx; }.patient-field>text { font-size:30rpx; font-weight:650; }.patient-field input { height:90rpx; margin:22rpx 0 20rpx; padding:0 26rpx; border:2rpx solid #dce5e1; border-radius:22rpx; font-size:28rpx; }
.matched-title { font-size:30rpx; font-weight:750; }.matched>view { display:grid; grid-template-columns:240rpx 1fr; align-items:center; margin-top:24rpx; padding:26rpx 15rpx; border-radius:28rpx; background:linear-gradient(125deg,#def8ef,#f4fcf9); }.matched image { width:240rpx; height:228rpx; }.matched>view text { display:block; line-height:1.5; }.matched>view text:first-child { font-size:28rpx; font-weight:750; }.matched>view text:nth-child(2) { margin-top:18rpx; color:var(--color-brand-pressed); font-size:24rpx; }.matched>view text:last-child { color:var(--color-text-tertiary); font-size:23rpx; }.binding-hint { display:flex; padding:20rpx; align-items:center; gap:12rpx; color:var(--color-text-secondary); font-size:25rpx; line-height:1.6; }.binding-error { padding:26rpx; border-radius:20rpx; color:#b13b3b; background:#fff0ef; font-size:27rpx; line-height:1.6; }.binding-footer { margin-top:auto; padding-top:100rpx; text-align:center; }.binding-primary { display:flex; min-height:92rpx; align-items:center; justify-content:center; color:#fff; background:var(--gradient-brand); border-radius:999rpx; font-size:32rpx; font-weight:750; box-shadow:0 12rpx 24rpx #0c897521; }.binding-primary[disabled] { background:#c3ded5; color:#536d64; box-shadow:none; }.binding-footer>text { display:block; margin-top:28rpx; padding-bottom:36rpx; color:var(--color-text-tertiary); font-size:23rpx; }
@media(max-width:370px) { .mode-card { grid-template-columns:136rpx minmax(0,1fr) 50rpx; gap:12rpx; }.mode-icon { width:128rpx; height:138rpx; }.mode-copy text:first-child { font-size:37rpx; } }
</style>
<style scoped lang="scss">
.onboarding{background:#f4f7f7;padding-top:58rpx}.mode-card,.mode-card--public{background:#fff;border:0;padding:40rpx 22rpx;min-height:350rpx;border-radius:32rpx;grid-template-columns:190rpx minmax(0,1fr) 56rpx}.mode-icon{width:185rpx;height:210rpx;background:transparent;box-shadow:none;border:0;border-radius:0}.mode-icon>image{border-radius:0}.leaf-decoration-mask{display:none}.welcome-heading{min-height:340rpx;padding-top:120rpx}.welcome-magpie{right:-24rpx;width:305rpx;height:300rpx;top:6rpx}.welcome-title{font-size:52rpx}.brand-mark{width:86rpx;height:90rpx;background:transparent}.brand-name{font-size:32rpx}.mode-copy text:first-child{font-size:38rpx}.mode-copy text:last-child{font-size:23rpx}.boundary-link{background:transparent;margin-top:110rpx}.matched>view{background:#fff;border:1rpx solid #e4ecea}.binding-card{background:#fff;border-radius:30rpx}.binding-header button{background:#fff;padding:0}.binding-footer{padding-top:32rpx}
@media(max-width:370px){.mode-card{grid-template-columns:160rpx minmax(0,1fr) 50rpx;gap:12rpx}.mode-icon{width:156rpx;height:190rpx}.mode-copy text:first-child{font-size:34rpx}}
</style>
