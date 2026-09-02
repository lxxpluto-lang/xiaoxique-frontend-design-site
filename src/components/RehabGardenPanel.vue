<template>
  <view class="garden-panel" data-testid="rehab-garden-panel">
    <view
      class="garden-summary"
      data-testid="region-garden-hero"
      :data-state="garden.stageLabel"
    >
      <view class="garden-miniature" aria-hidden="true">
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

      <view class="garden-summary-copy">
        <text class="garden-kicker">我的运动小菜园</text>
        <text class="garden-title">{{ garden.stageLabel }}</text>
        <text class="garden-day"
          >成长第{{ garden.cycleDay }}/{{ garden.cycleLength }}天</text
        >
        <text class="garden-remaining"
          >距离下次收获还有 {{ garden.remainingDays }} 个有效训练日</text
        >
      </view>

      <view class="harvest-count">
        <text>{{ garden.harvestCount }}</text>
        <text>已收获</text>
      </view>
    </view>

    <view class="garden-section-tabs" data-testid="garden-section-tabs">
      <button
        :class="{ selected: section === 'growth' }"
        data-testid="garden-section-growth"
        @tap="selectSection('growth')"
      >
        成长
      </button>
      <button
        :class="{ selected: section === 'checkin' }"
        data-testid="garden-section-checkin"
        @tap="selectSection('checkin')"
      >
        打卡
      </button>
    </view>

    <view
      v-if="section === 'growth'"
      class="garden-section-content growth-content"
      data-testid="garden-growth-content"
    >
      <view class="growth-track" data-testid="garden-growth-track">
        <view
          v-for="(stage, index) in stages"
          :key="stage"
          class="growth-node"
          :class="{
            reached: garden.stageIndex > index,
            current: garden.stageIndex > 0 && garden.stageIndex - 1 === index,
          }"
        >
          <view><text>{{ index + 1 }}</text></view>
          <text>{{ stage }}</text>
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

      <text class="garden-boundary">成长代表训练打卡，不代表康复疗效。</text>
    </view>

    <view
      v-else
      class="garden-section-content checkin-content"
      data-testid="garden-checkin-content"
    >
      <view class="checkin-summary" data-testid="garden-checkin-summary">
        <view>
          <text>{{
            checkIn.checkedToday
              ? "今天已自动打卡"
              : "完成一次有效运动后自动打卡"
          }}</text>
          <text>每天最多记录一次有效运动</text>
        </view>
        <view>
          <text>连续 {{ checkIn.streak }} 天</text>
          <text>累计 {{ checkIn.totalDays }} 天</text>
        </view>
      </view>

      <view class="calendar-card" data-testid="garden-checkin-calendar">
        <view class="calendar-heading">
          <button @tap="emit('shift-month', -1)">‹</button>
          <text>{{ checkIn.calendarTitle }}</text>
          <button
            :disabled="!checkIn.canGoNextMonth"
            @tap="emit('shift-month', 1)"
          >
            ›
          </button>
        </view>
        <view class="calendar-week">
          <text v-for="day in weekDays" :key="day">{{ day }}</text>
        </view>
        <view class="calendar-grid">
          <view
            v-for="item in checkIn.calendarCells"
            :key="item.key"
            :class="{
              blank: item.blank,
              done: item.checked,
              today: item.today,
              future: item.future,
            }"
          >
            <text v-if="!item.blank">{{ item.day }}</text>
            <image
              v-if="item.checked"
              src="/static/icons/cabbage-checkin.svg"
              mode="aspectFit"
            />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

type GardenSection = "growth" | "checkin";

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

interface CalendarCell {
  key: string;
  day?: number;
  blank: boolean;
  checked: boolean;
  today: boolean;
  future: boolean;
}

interface GardenCheckInViewState {
  checkedToday: boolean;
  streak: number;
  totalDays: number;
  calendarTitle: string;
  canGoNextMonth: boolean;
  calendarCells: CalendarCell[];
}

const props = defineProps<{
  garden: GardenViewState;
  checkIn: GardenCheckInViewState;
  section: GardenSection;
}>();

const emit = defineEmits<{
  (event: "update:section", value: GardenSection): void;
  (event: "shift-month", offset: number): void;
}>();

const stages = ["播种", "冒芽", "幼苗", "舒展", "茁壮", "成熟", "收获"];
const weekDays = ["一", "二", "三", "四", "五", "六", "日"];
const plantStyle = computed(() => ({
  transform: `scale(${0.44 + props.garden.stageIndex * 0.09})`,
  opacity: String(0.64 + props.garden.stageIndex * 0.06),
}));
const growthMessage = computed(() =>
  props.garden.checkedToday
    ? "明天继续就好，不需要为了奖励额外加量。"
    : "完成今天第一项有效运动，小白菜就会长大。",
);

function selectSection(section: GardenSection) {
  emit("update:section", section);
}
</script>

<style scoped lang="scss">
.garden-panel { display:grid; gap:18rpx; padding:22rpx 32rpx 40rpx; }
.garden-summary { position:relative; display:grid; min-height:210rpx; padding:24rpx; overflow:hidden; grid-template-columns:148rpx minmax(0,1fr) auto; align-items:center; gap:18rpx; border-radius:30rpx; color:#19473d; background:linear-gradient(155deg,#effbf2 0%,#fff9e9 100%); box-shadow:0 8rpx 28rpx rgba(41,101,75,.09); }
.garden-miniature { position:relative; display:flex; width:148rpx; height:150rpx; align-items:flex-end; justify-content:center; }.sun-glow { position:absolute; top:8rpx; right:8rpx; width:54rpx; height:54rpx; border-radius:50%; background:#ffe28a; box-shadow:0 0 28rpx rgba(255,207,77,.38); }.plant-wrap { position:relative; z-index:2; display:flex; width:108rpx; height:108rpx; align-items:center; justify-content:center; transform-origin:50% 100%; transition:transform .28s ease,opacity .28s ease; }.cabbage { width:108rpx; height:108rpx; }.seed { width:28rpx; height:20rpx; border-radius:55% 45% 55% 45%; background:#6d9145; transform:rotate(-18deg); }.soil { position:absolute; bottom:4rpx; width:142rpx; height:34rpx; border-radius:50%; background:linear-gradient(#9b7041,#79502f); box-shadow:inset 0 6rpx 9rpx rgba(255,255,255,.15); }
.garden-summary-copy { position:relative; z-index:2; min-width:0; }.garden-summary-copy text { display:block; }.garden-kicker { color:#2b7d65; font-size:20rpx; font-weight:700; }.garden-title { margin-top:5rpx; color:#19473d; font-size:34rpx; font-weight:800; }.garden-day { margin-top:8rpx; color:#245c4d; font-size:24rpx; font-weight:750; }.garden-remaining { margin-top:5rpx; color:#64748b; font-size:18rpx; line-height:1.4; }
.harvest-count { min-width:92rpx; padding:12rpx 10rpx; border-radius:18rpx; background:rgba(255,255,255,.78); text-align:center; }.harvest-count text { display:block; }.harvest-count text:first-child { color:#0f766e; font-size:31rpx; font-weight:800; }.harvest-count text:last-child { margin-top:2rpx; color:#64748b; font-size:17rpx; }
.garden-section-tabs { display:grid; padding:7rpx; grid-template-columns:1fr 1fr; gap:7rpx; border-radius:18rpx; background:#e8efec; }.garden-section-tabs button { min-height:64rpx; border-radius:13rpx; color:#64748b; font-size:24rpx; font-weight:650; }.garden-section-tabs button.selected { color:#0f766e; background:#fff; box-shadow:0 3rpx 10rpx rgba(15,118,110,.08); }
.garden-section-content { min-width:0; }.growth-content { display:grid; gap:17rpx; padding:20rpx 22rpx 18rpx; border-radius:24rpx; background:#fff; box-shadow:0 4rpx 16rpx rgba(15,23,42,.04); }
.growth-track { position:relative; display:grid; grid-template-columns:repeat(7,1fr); gap:3rpx; }.growth-track::before { position:absolute; top:18rpx; right:7%; left:7%; height:4rpx; content:""; background:#d8e6d9; }.growth-node { position:relative; z-index:1; display:flex; min-width:0; align-items:center; flex-direction:column; }.growth-node>view { display:flex; width:36rpx; height:36rpx; align-items:center; justify-content:center; border:4rpx solid #eef6ef; border-radius:50%; color:#74847d; background:#d8e6d9; font-size:14rpx; font-weight:700; }.growth-node.reached>view { color:#fff; background:#64a967; }.growth-node.current>view { box-shadow:0 0 0 4rpx rgba(100,169,103,.18); }.growth-node>text { margin-top:7rpx; overflow:hidden; color:#74847d; font-size:13rpx; white-space:nowrap; }.growth-node.current>text { color:#245c4d; font-weight:700; }
.today-growth { display:grid; padding:17rpx 18rpx; grid-template-columns:58rpx 1fr; align-items:center; gap:14rpx; border-radius:18rpx; background:#fff7e8; }.today-growth.done { background:#eaf8f1; }.today-growth-icon { display:flex; width:52rpx; height:52rpx; align-items:center; justify-content:center; border-radius:16rpx; color:#8a641c; background:#ffe7a7; font-size:21rpx; font-weight:800; }.today-growth.done .today-growth-icon { color:#fff; background:#2e9b7b; }.today-growth view:last-child text { display:block; }.today-growth view:last-child text:first-child { color:#1e293b; font-size:23rpx; font-weight:750; }.today-growth view:last-child text:last-child { margin-top:4rpx; color:#64748b; font-size:18rpx; line-height:1.45; }
.garden-boundary { display:block; color:#7b8783; font-size:17rpx; line-height:1.45; text-align:center; }
.checkin-content { display:grid; gap:14rpx; }.checkin-summary { display:grid; padding:19rpx 21rpx; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:16rpx; border-radius:22rpx; background:#fff; box-shadow:0 4rpx 16rpx rgba(15,23,42,.04); }.checkin-summary>view text { display:block; }.checkin-summary>view:first-child text:first-child { color:#1e293b; font-size:23rpx; font-weight:750; }.checkin-summary>view:first-child text:last-child { margin-top:4rpx; color:#64748b; font-size:17rpx; }.checkin-summary>view:last-child { text-align:right; }.checkin-summary>view:last-child text { color:#0f766e; font-size:18rpx; font-weight:700; }.checkin-summary>view:last-child text+text { margin-top:4rpx; }
.calendar-card { margin-top:0; padding:18rpx 20rpx 20rpx; border-radius:22rpx; background:#fff; box-shadow:0 4rpx 16rpx rgba(15,23,42,.04); }.calendar-heading { display:grid; grid-template-columns:54rpx 1fr 54rpx; align-items:center; }.calendar-heading button { min-height:48rpx; color:#0f766e; font-size:30rpx; }.calendar-heading button[disabled] { color:#cbd5e1; }.calendar-heading text { color:#1e293b; font-size:23rpx; font-weight:750; text-align:center; }.calendar-week,.calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); }.calendar-week { margin-top:12rpx; }.calendar-week text { color:#94a3b8; font-size:16rpx; text-align:center; }.calendar-grid { margin-top:6rpx; row-gap:4rpx; }.calendar-grid>view { position:relative; display:flex; min-width:0; height:55rpx; align-items:center; justify-content:center; color:#475569; font-size:17rpx; }.calendar-grid>view.blank { visibility:hidden; }.calendar-grid>view.future { color:#cbd5e1; }.calendar-grid>view.today { border:2rpx solid #0ea5a4; border-radius:10rpx; background:#f0fdfa; }.calendar-grid>view.done,.calendar-grid>view.done.today { color:#1e293b; border-radius:10rpx; background:transparent; }.calendar-grid>view.done image { width:44rpx; height:44rpx; }.calendar-grid>view.done>text:first-child { position:absolute; z-index:1; top:1rpx; left:4rpx; color:#4b6350; font-size:13rpx; font-weight:700; }
@media (max-width:370px) { .garden-panel { padding-right:24rpx; padding-left:24rpx; }.garden-summary { min-height:190rpx; padding:20rpx; grid-template-columns:118rpx minmax(0,1fr); }.garden-miniature { width:118rpx; height:128rpx; }.harvest-count { position:absolute; top:16rpx; right:16rpx; min-width:76rpx; padding:8rpx; }.garden-summary-copy { padding-right:64rpx; }.garden-remaining { max-width:240rpx; }.checkin-summary { align-items:flex-start; grid-template-columns:1fr; }.checkin-summary>view:last-child { display:flex; justify-content:space-between; text-align:left; }.calendar-card { padding-right:14rpx; padding-left:14rpx; } }
@media (prefers-reduced-motion: reduce) { .plant-wrap { transition:none; } }
</style>
