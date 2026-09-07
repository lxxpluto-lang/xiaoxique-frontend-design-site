<template>
  <view class="insight-card" :class="'insight-'+insight.level" data-testid="training-insight">
    <image class="insight-mascot" src="/static/replica-v7/report-bird.png" mode="aspectFit" />
    <view class="insight-heading"><text>小喜训练后解读</text><text>RAG生成 · 待医生确认</text></view>
    <button class="insight-summary" data-testid="training-insight-report" @tap="emit('report')"><view><text>{{ insight.title }}</text><text>{{ insight.summary }}</text></view><text>›</text></button>
    <view class="insight-row"><image src="/static/replica-v7/trend-icon.png" mode="aspectFit"/><text>最近变化</text><text>{{ insight.change }}</text></view>
    <view class="insight-row"><image src="/static/replica-v7/nutrition-icon.png" mode="aspectFit"/><text>饮食提醒</text><text>少盐少油，饮食安排遵循医护指导</text></view>
    <view class="insight-row"><image src="/static/replica-v7/shoe-icon.png" mode="aspectFit"/><text>运动注意</text><text>{{ insight.exercise }}</text></view>
    <view class="insight-boundary"><text>依据：{{ insight.source }}</text><text>仅作健康教育参考，不替代医生诊断或处方</text></view>
  </view>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { AIAdvice, TrainingSession } from '@/lib/prototype-data';
import { buildTrainingInsight } from '@/lib/training-insight';
const props=defineProps<{sessions:TrainingSession[];today:string;advice?:AIAdvice}>();
const emit=defineEmits<{(e:'report'):void}>();
const insight=computed(()=>buildTrainingInsight(props.sessions,props.today,props.advice));
</script>
<style scoped lang="scss">
.insight-card{padding:25rpx 24rpx 18rpx;border-radius:30rpx;background:#fff;box-shadow:var(--shadow-card)}.insight-heading{display:flex;align-items:center;justify-content:space-between;gap:10rpx;flex-wrap:wrap;margin-left:146rpx}.insight-heading>text:first-child{color:#008c82;font-size:25rpx;font-weight:700}.insight-heading>text:last-child{padding:5rpx 12rpx;background:#eef8f5;color:#168f87;border-radius:999rpx;font-size:20rpx}.insight-summary{display:flex;align-items:center;text-align:left;gap:18rpx;width:100%;padding:8rpx 0 14rpx;background:transparent}.insight-summary>image{width:132rpx;height:149rpx;flex-shrink:0}.insight-summary>view{min-width:0;flex:1}.insight-summary>view>text{display:block;font-size:30rpx;font-weight:750;line-height:1.5}.insight-summary>view>text+text{margin-top:10rpx;font-size:23rpx;font-weight:400;color:#5c7183;line-height:1.65}.insight-summary>text{font-size:32rpx;color:#009d8d}.insight-row{display:grid;grid-template-columns:72rpx 124rpx minmax(0,1fr);align-items:center;gap:14rpx;border-top:1rpx solid #e7eeeb;padding:13rpx 0;min-height:90rpx}.insight-row image{width:70rpx;height:70rpx}.insight-row>text:nth-child(2){font-size:25rpx;font-weight:650;white-space:nowrap;border-left:2rpx solid #b8e3d9;padding-left:14rpx}.insight-row>text:last-child{font-size:23rpx;color:#54697b;line-height:1.6}.insight-boundary{padding-top:13rpx;border-top:1rpx solid #e7eeeb;display:grid;gap:6rpx;font-size:20rpx;line-height:1.55;color:#718092}.insight-stop{border:1rpx solid #f5b9b4}.insight-attention{border:1rpx solid #e9d6a7}
</style>
<style scoped lang="scss">
.insight-card{position:relative;padding:24rpx 23rpx 17rpx}.insight-mascot{position:absolute;left:13rpx;top:20rpx;width:159rpx;height:185rpx}.insight-heading{margin-left:165rpx;gap:8rpx}.insight-heading>text:first-child{font-size:24rpx}.insight-heading>text:last-child{font-size:18rpx;padding:5rpx 8rpx}.insight-summary{box-sizing:border-box;min-height:137rpx;margin:0;padding:13rpx 0 14rpx 165rpx;line-height:1.5}.insight-summary>view>text{font-size:28rpx;line-height:1.4}.insight-summary>view>text+text{font-size:22rpx;line-height:1.5;margin-top:10rpx}.insight-row{grid-template-columns:69rpx 114rpx minmax(0,1fr);gap:13rpx;min-height:82rpx;padding:9rpx 0}.insight-row>text:nth-child(2){font-size:24rpx;padding-left:13rpx}.insight-row>text:last-child{font-size:22rpx;line-height:1.5}.insight-row image{width:67rpx;height:67rpx}.insight-boundary{font-size:19rpx;line-height:1.5;gap:5rpx;padding-top:11rpx}
</style>
