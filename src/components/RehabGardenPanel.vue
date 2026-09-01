<template>
  <view class="garden-panel" data-testid="rehab-garden-panel">
    <view
      class="garden-hero"
      data-testid="region-garden-hero"
      :data-state="garden.stageLabel"
    >
      <view class="garden-heading">
        <view>
          <text class="garden-kicker">我的运动小菜园</text>
          <text class="garden-title">{{ garden.stageLabel }}</text>
        </view>
        <view class="harvest-count">
          <text>{{ garden.harvestCount }}</text>
          <text>已收获</text>
        </view>
      </view>

      <view class="plant-stage">
        <view class="sun-glow" />
        <view class="plant-wrap" :style="plantStyle">
          <view v-if="garden.stageIndex === 0" class="seed" />
          <image
            v-else
            class="cabbage"
            src="/static/icons/cabbage-checkin.svg"
            mode="aspectFit"
          />
        </view>
        <view class="soil" />
      </view>

      <view class="garden-progress-copy">
        <text>成长第{{ garden.cycleDay }}/{{ garden.cycleLength }}天</text>
        <text>距离下次收获还有 {{ garden.remainingDays }} 个有效训练日</text>
      </view>
      <view class="growth-track" data-testid="garden-growth-track">
        <view
          v-for="(stage, index) in stages"
          :key="stage"
          class="growth-node"
          :class="{
            reached: garden.stageIndex > index,
            current:
              garden.stageIndex > 0 && garden.stageIndex - 1 === index,
          }"
        >
          <view><text>{{ index + 1 }}</text></view>
          <text>{{ stage }}</text>
        </view>
      </view>
    </view>

    <view
      class="today-growth"
      :class="{ done: garden.checkedToday }"
      data-testid="region-garden-growth"
    >
      <view class="today-growth-icon">{{ garden.checkedToday ? "✓" : "芽" }}</view>
      <view>
        <text>{{ garden.checkedToday ? "今天已经长大一步" : "今日还没有成长" }}</text>
        <text>{{ growthMessage }}</text>
      </view>
    </view>

    <view class="garden-plan" data-testid="garden-prescription-summary">
      <view class="garden-plan-heading">
        <view>
          <text>{{ plan.title }}</text>
          <text v-if="mode === 'cardiac'">医院处方 · 已完成 {{ plan.completedCount }}/{{ plan.totalCount }} 项</text>
          <text v-else>{{ plan.allCompleted ? "今日已完成" : "今日推荐" }}</text>
        </view>
        <text>{{ plan.allCompleted ? "已完成" : "待运动" }}</text>
      </view>
      <text class="garden-plan-title">{{ plan.itemTitle }}</text>
      <view class="garden-plan-meta">
        <view><text>时长</text><text>{{ plan.duration }}</text></view>
        <view><text>强度</text><text>{{ plan.intensity }}</text></view>
      </view>
      <button
        class="start-exercise"
        data-testid="garden-start-exercise"
        data-action="ACT-GARDEN-START-EXERCISE"
        @tap="emit('start-exercise')"
      >
        {{ plan.allCompleted ? "查看运动记录" : "开始运动" }}
      </button>
      <text class="start-note">先进入运动页选择项目，不会直接开启摄像头</text>
    </view>

    <text class="garden-boundary">成长代表训练打卡，不代表康复疗效。</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface GardenViewState {
  progress: number;
  cycleDay: number;
  cycleLength: number;
  stageIndex: number;
  stageLabel: string;
  harvestCount: number;
  remainingDays: number;
  checkedToday: boolean;
}

interface GardenPlanSummary {
  title: string;
  itemTitle: string;
  duration: string;
  intensity: string;
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
}

const props = defineProps<{
  garden: GardenViewState;
  plan: GardenPlanSummary;
  mode: "cardiac" | "public";
}>();

const emit = defineEmits<{
  (event: "start-exercise"): void;
}>();

const stages = ["播种", "冒芽", "幼苗", "舒展", "茁壮", "成熟", "收获"];
const plantStyle = computed(() => ({
  transform: `scale(${0.44 + props.garden.stageIndex * 0.09})`,
  opacity: String(0.64 + props.garden.stageIndex * 0.06),
}));
const growthMessage = computed(() =>
  props.garden.checkedToday
    ? "明天继续就好，不需要为了奖励额外加量。"
    : "完成今天第一项有效运动，小白菜就会长大。",
);
</script>

<style scoped lang="scss">
.garden-panel { display:grid; gap:24rpx; padding:24rpx 32rpx 48rpx; }
.garden-hero { position:relative; overflow:hidden; padding:32rpx; border-radius:32rpx; color:#19473d; background:linear-gradient(155deg,#effbf2 0%,#fff9e9 100%); box-shadow:0 8rpx 28rpx rgba(41,101,75,.09); }
.garden-heading { position:relative; z-index:2; display:flex; align-items:flex-start; justify-content:space-between; gap:20rpx; }.garden-heading text { display:block; }.garden-kicker { color:#2b7d65; font-size:23rpx; font-weight:700; }.garden-title { margin-top:8rpx; font-size:38rpx; font-weight:800; }.harvest-count { min-width:116rpx; padding:14rpx; border-radius:20rpx; background:rgba(255,255,255,.76); text-align:center; }.harvest-count text:first-child { color:#0f766e; font-size:36rpx; font-weight:800; }.harvest-count text:last-child { margin-top:2rpx; color:#64748b; font-size:18rpx; }
.plant-stage { position:relative; display:flex; height:250rpx; align-items:flex-end; justify-content:center; }.sun-glow { position:absolute; top:18rpx; right:34rpx; width:82rpx; height:82rpx; border-radius:50%; background:#ffe28a; box-shadow:0 0 44rpx rgba(255,207,77,.42); }.plant-wrap { position:relative; z-index:2; display:flex; width:164rpx; height:164rpx; align-items:center; justify-content:center; transform-origin:50% 100%; transition:transform .28s ease,opacity .28s ease; }.cabbage { width:164rpx; height:164rpx; }.seed { width:34rpx; height:25rpx; border-radius:55% 45% 55% 45%; background:#6d9145; transform:rotate(-18deg); }.soil { position:absolute; bottom:2rpx; width:232rpx; height:48rpx; border-radius:50%; background:linear-gradient(#9b7041,#79502f); box-shadow:inset 0 8rpx 12rpx rgba(255,255,255,.15); }
.garden-progress-copy { display:flex; margin-top:14rpx; align-items:flex-end; justify-content:space-between; gap:16rpx; }.garden-progress-copy text:first-child { font-size:28rpx; font-weight:800; }.garden-progress-copy text:last-child { color:#64748b; font-size:19rpx; text-align:right; }
.growth-track { position:relative; display:grid; margin-top:22rpx; grid-template-columns:repeat(7,1fr); gap:3rpx; }.growth-track::before { position:absolute; top:20rpx; right:7%; left:7%; height:4rpx; content:""; background:#d8e6d9; }.growth-node { position:relative; z-index:1; display:flex; min-width:0; align-items:center; flex-direction:column; }.growth-node>view { display:flex; width:40rpx; height:40rpx; align-items:center; justify-content:center; border:4rpx solid #eef6ef; border-radius:50%; color:#74847d; background:#d8e6d9; font-size:15rpx; font-weight:700; }.growth-node.reached>view { color:#fff; background:#64a967; }.growth-node.current>view { box-shadow:0 0 0 5rpx rgba(100,169,103,.18); }.growth-node>text { margin-top:9rpx; overflow:hidden; color:#74847d; font-size:14rpx; white-space:nowrap; }.growth-node.current>text { color:#245c4d; font-weight:700; }
.today-growth { display:grid; padding:24rpx; grid-template-columns:72rpx 1fr; align-items:center; gap:18rpx; border-radius:24rpx; background:#fff7e8; }.today-growth.done { background:#eaf8f1; }.today-growth-icon { display:flex; width:64rpx; height:64rpx; align-items:center; justify-content:center; border-radius:20rpx; color:#8a641c; background:#ffe7a7; font-size:25rpx; font-weight:800; }.today-growth.done .today-growth-icon { color:#fff; background:#2e9b7b; }.today-growth view:last-child text { display:block; }.today-growth view:last-child text:first-child { color:#1e293b; font-size:27rpx; font-weight:750; }.today-growth view:last-child text:last-child { margin-top:6rpx; color:#64748b; font-size:21rpx; line-height:1.55; }
.garden-plan { padding:28rpx; border-radius:28rpx; background:#fff; box-shadow:0 6rpx 22rpx rgba(15,23,42,.06); }.garden-plan-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:16rpx; }.garden-plan-heading view text { display:block; }.garden-plan-heading view text:first-child { color:#1e293b; font-size:29rpx; font-weight:750; }.garden-plan-heading view text:last-child { margin-top:5rpx; color:#64748b; font-size:20rpx; }.garden-plan-heading>text { padding:7rpx 13rpx; border-radius:999rpx; color:#0f766e; background:#e9f8f4; font-size:19rpx; font-weight:700; }.garden-plan-title { display:block; margin-top:22rpx; color:#1e293b; font-size:34rpx; font-weight:800; }.garden-plan-meta { display:grid; margin-top:18rpx; grid-template-columns:1fr 1fr; gap:12rpx; }.garden-plan-meta view { padding:16rpx; border-radius:18rpx; background:#f8fafc; }.garden-plan-meta text { display:block; }.garden-plan-meta text:first-child { color:#64748b; font-size:19rpx; }.garden-plan-meta text:last-child { margin-top:4rpx; color:#1e293b; font-size:23rpx; font-weight:700; }.start-exercise { display:flex; width:100%; min-height:88rpx; margin-top:22rpx; align-items:center; justify-content:center; border-radius:18rpx; color:#fff; background:#0ea5a4; font-size:30rpx; font-weight:700; }.start-note { display:block; margin-top:12rpx; color:#7b8783; font-size:18rpx; text-align:center; }.garden-boundary { display:block; padding:18rpx 22rpx; border-radius:20rpx; color:#6c7673; background:#eef1f0; font-size:20rpx; line-height:1.5; text-align:center; }
@media (prefers-reduced-motion: reduce) { .plant-wrap { transition:none; } }
</style>
