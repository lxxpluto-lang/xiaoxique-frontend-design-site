<template>
  <view class="garden-panel" data-testid="rehab-garden-panel">
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

    <view class="garden-page-shell">
      <view
        v-if="section === 'growth'"
        class="garden-section-content garden-growth-page"
        data-testid="garden-growth-content"
      >
        <view
          class="garden-hero"
          data-testid="region-garden-hero"
          :data-state="garden.stageLabel"
        >
          <view class="garden-heading">
            <view>
              <text class="garden-kicker">我的运动小菜园</text>
            </view>
            <view class="harvest-count">
              <text>{{ garden.harvestCount }}</text>
              <text>已收获（棵）</text>
            </view>
          </view>

          <view class="plant-stage" aria-hidden="true">
            <view class="growth-orbit" />
            <view
              class="plant-wrap"
              :class="[plantDayClass, { 'stage-glow': showStageGlow }]"
              :style="plantStyle"
            >
              <image
                class="growth-plant-art"
                :src="growthArtwork"
                mode="aspectFit"
              />
            </view>
          </view>

          <view class="garden-progress-copy">
            <text
              >{{ garden.stageLabel }} · 第{{ garden.cycleDay }}/{{
                garden.cycleLength
              }}天</text
            >
            <text>{{ remainingCopy }}</text>
          </view>

          <view class="growth-track" data-testid="garden-growth-track">
            <view
              v-for="(stage, index) in stages"
              :key="stage"
              class="growth-node"
              :class="{
                reached: garden.cycleDay >= index + 1,
                current: currentTrackIndex === index,
              }"
            >
              <view><image :src="'/static/replica-v7/tree-stage-' + (index+1) + '.png'" mode="aspectFit" /></view>
              <text>{{ stage }}</text>
            </view>
          </view>
        </view>

        <view
          class="today-growth"
          :class="{ done: garden.checkedToday }"
          data-testid="region-garden-growth"
        >
          <image class="growth-companion" src="/static/replica-v7/growth-bird.png" mode="aspectFit" aria-hidden="true" />
          <view class="today-growth-icon"><image :src="garden.checkedToday ? '/static/replica-v7/garden-check-icon.png' : '/static/replica-v7/tree-stage-1.png'" mode="aspectFit" /></view>
          <view>
            <text>{{
              garden.checkedToday ? "今天已经长大一步" : "今日还没有成长"
            }}</text>
            <text>{{ growthMessage }}</text>
          </view>
        </view>

        <view class="cycle-detail-card" data-testid="garden-cycle-detail">
          <view class="cycle-detail-grid">
            <view>
              <image src="/static/replica-v7/garden-calendar-icon.png" mode="aspectFit" />
              <text>本轮开始</text>
              <text>{{ garden.cycleStartLabel }}</text>
            </view>
            <view>
              <image src="/static/replica-v7/garden-exercise-icon.png" mode="aspectFit" />
              <text>有效运动</text>
              <text>{{ garden.cycleDay }}天</text>
            </view>
            <view>
              <image src="/static/replica-v7/garden-shield-icon.png" mode="aspectFit" />
              <text>成长方式</text>
              <text>漏训不倒退</text>
            </view>
          </view>
        </view>

        <view class="garden-rules">
          <text>成长规则</text>
          <text>每天第一次有效运动成长一次</text>
          <text>同一天重复运动不会重复成长</text>
          <text>累计七个有效训练日后收获一棵</text>
        </view>
        <text class="garden-boundary"
          >成长代表运动打卡，不代表康复疗效。</text
        >
      </view>

      <view
        v-else
        class="garden-section-content garden-checkin-page"
        data-testid="garden-checkin-content"
      >
        <view class="checkin-hero" data-testid="garden-checkin-summary">
          <image class="checkin-tree" :src="growthArtwork" mode="aspectFit" aria-hidden="true" data-testid="checkin-growth-art" />
          <view class="checkin-summary-copy">
            <text>{{
              checkIn.checkedToday
                ? "今天已自动打卡"
                : "完成有效运动后自动打卡"
            }}</text>
            <view class="checkin-statistics">
              <view data-testid="checkin-streak"><text>连续</text><text>{{ checkIn.streak }}<text> 天</text></text></view>
              <view data-testid="checkin-total"><text>累计</text><text>{{ checkIn.totalDays }}<text> 天</text></text></view>
            </view>
          </view>
          <view class="checkin-state" :class="{ 'checkin-state--done': checkIn.checkedToday }" :aria-label="checkIn.checkedToday ? '今天已打卡' : '今天待打卡'"><text>{{ checkIn.checkedToday ? "✓" : "待" }}</text><text>{{ checkIn.checkedToday ? '已打卡' : '打卡' }}</text></view>
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
                src="/static/replica-v7/tree-stage-1.png"
                mode="aspectFit"
              />
            </view>
          </view>
        </view>

        <view class="recent-checkins" data-testid="garden-recent-checkins">
          <text class="garden-list-title">最近打卡记录</text>
          <view v-if="checkIn.recentRecords.length" class="recent-checkin-list">
            <view
              v-for="item in checkIn.recentRecords.slice(0, 4)"
              :key="item.key"
            >
              <text>{{ item.dateLabel }}</text>
              <text>{{ item.title }}</text>
              <text>{{ item.durationLabel }}</text>
            </view>
          </view>
          <text v-else class="garden-empty"
            >完成第一次有效运动后，这里会显示打卡记录。</text
          >
        </view>

        <view class="garden-rules">
          <text>打卡规则</text>
          <text>完成每天第一次有效运动后自动记录</text>
          <text>异常停止和未完成训练不计入打卡</text>
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
  cycleStartLabel: string;
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
  recentRecords: Array<{
    key: string;
    dateLabel: string;
    title: string;
    durationLabel: string;
  }>;
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

const stages = ["幼芽", "新叶", "舒展", "生长", "茂盛", "成熟", "收获"];
const weekDays = ["一", "二", "三", "四", "五", "六", "日"];
const artworkByStage = [
  "/static/replica-v7/tree.png",
  "/static/replica-v7/tree.png",
  "/static/replica-v7/tree.png",
] as const;
const plantScaleByDay = [0.48, 0.58, 0.62, 0.73, 0.84, 0.95, 1] as const;

const growthArtwork = computed(() => {
  if (props.garden.cycleDay <= 1) return artworkByStage[0];
  if (props.garden.cycleDay <= 4) return artworkByStage[1];
  return artworkByStage[2];
});
const plantDayClass = computed(
  () => "garden-day-" + props.garden.cycleDay,
);
const showStageGlow = computed(
  () => props.garden.cycleDay === 1 || props.garden.cycleDay === 6,
);
const plantStyle = computed(() => ({
  transform: "scale(" + (plantScaleByDay[props.garden.cycleDay] ?? 1) + ")",
  opacity: props.garden.cycleDay === 0 ? "0.78" : "1",
}));
const currentTrackIndex = computed(() =>
  props.garden.cycleDay === 0
    ? 0
    : Math.min(props.garden.cycleDay - 1, stages.length - 1),
);
const remainingCopy = computed(() =>
  props.garden.remainingDays === 1
    ? "再完成1个有效训练日即可收获"
    : "再完成" + props.garden.remainingDays + "个有效训练日即可收获",
);
const growthMessage = computed(() =>
  props.garden.checkedToday
    ? "明天继续运动即可，不需要为了成长额外加量。"
    : "完成今天第一项有效运动，小树就会长大。",
);

function selectSection(section: GardenSection) {
  emit("update:section", section);
}
</script>

<style scoped lang="scss">
.cycle-detail-grid>view{align-items:center;gap:12rpx}.cycle-detail-grid>view>text:first-of-type{font-size:25rpx;color:#607078}
.garden-panel { display:grid; padding:0 28rpx 42rpx; gap:28rpx; }
.garden-section-tabs { display:grid; grid-template-columns:1fr 1fr; min-height:94rpx; border-bottom:2rpx solid #fff; }
.garden-section-tabs button { position:relative; min-height: 92rpx; color:var(--color-text-secondary); font-size:32rpx; background:transparent; }
.garden-section-tabs button.selected { color:var(--color-brand); font-weight:750; }
.garden-section-tabs button.selected::after { position:absolute; bottom:0; left:36%; right:36%; height:5rpx; border-radius:5rpx; background:var(--color-brand); content:''; }
.garden-section-content { display:grid; gap:26rpx; }
.garden-hero { display:flex; flex-direction:column; position:relative; }
.garden-heading { order:3; display:flex; align-items:center; justify-content:space-between; margin-top:10rpx; color:var(--color-text-tertiary); font-size:23rpx; }
.garden-kicker { color:var(--color-text-secondary); }
.harvest-count { display:flex; gap:8rpx; align-items:baseline; }.harvest-count text:first-child { color:var(--color-brand); font-size:28rpx; font-weight:700; }
.garden-progress-copy { order:0; display:flex; align-items:center; flex-direction:column; padding:22rpx 0 0; gap:12rpx; }.garden-progress-copy text:first-child { color:#063d35; font-size:40rpx; font-weight:800; }.garden-progress-copy text:last-child { color:var(--color-text-secondary); font-size:26rpx; }
.plant-stage { order:1; position:relative; display:flex; height:560rpx; align-items:center; justify-content:center; margin:8rpx -15rpx 12rpx; overflow:visible; background:radial-gradient(ellipse,#fff 12%,#e3faf2 54%,transparent 72%); }
.plant-wrap { position:relative; z-index:1; display:flex; width:540rpx; height:540rpx; justify-content:center; align-items:center; transform-origin:center 85%; transition:transform .6s ease,opacity .4s ease; }
.growth-plant-art { width:100%; height:100%; }.growth-orbit { position:absolute; inset:8% 0; border:2rpx solid #ffffffb3; border-radius:50%; transform:rotate(-18deg); }.growth-orbit::before { content:''; position:absolute; inset:10%; border:1rpx solid #ffffffa6; border-radius:50%; }
.growth-track { order:2; position:relative; display:grid; grid-template-columns:repeat(7,1fr); gap:4rpx; padding:12rpx 0; }.growth-track::before { content:''; position:absolute; top:42rpx; left:7%; right:7%; height:4rpx; background:#d5e5dd; }
.growth-node { position:relative; display:flex; flex-direction:column; align-items:center; gap:14rpx; }.growth-node>view { width:57rpx; height:57rpx; display:flex; justify-content:center; align-items:center; border-radius:50%; color:#586962; background:#e2ece7; border:3rpx solid #f3fbf7; font-size:25rpx; font-weight:700; }.growth-node.reached>view { color:#fff; background:linear-gradient(125deg,#35ce93,#00966f); }.growth-node.current>view { box-shadow:0 0 0 3rpx #fff,0 0 0 6rpx #39bb91; }.growth-node>text { color:#6b8177; font-size:23rpx; }.growth-node.reached>text { color:#07855d; font-weight:650; }
.today-growth { display:grid; grid-template-columns:96rpx 1fr; align-items:center; padding:26rpx; gap:22rpx; border-radius:32rpx; background:#e8f8f1; }.today-growth-icon { display:flex; width:92rpx; height:92rpx; align-items:center; justify-content:center; color:#23ab7e; font-size:52rpx; border-radius:50%; background:#cbf0e3; }.today-growth text { display:block; }.today-growth view:last-child text:first-child { font-size:30rpx; font-weight:750; }.today-growth view:last-child text:last-child { margin-top:10rpx; color:var(--color-text-secondary); font-size:24rpx; line-height:1.55; }
.cycle-detail-card { padding:35rpx 18rpx; border-radius:32rpx; background:#fff; box-shadow:var(--shadow-card); }.cycle-detail-grid { display:grid; grid-template-columns:repeat(3,1fr); text-align:center; gap:10rpx; }.cycle-detail-grid>view { display:flex; flex-direction:column; justify-content:center; gap:20rpx; border-right:1rpx solid var(--color-line); }.cycle-detail-grid>view:last-child { border:0; }.cycle-detail-grid text:first-child { color:var(--color-text-secondary); font-size:25rpx; }.cycle-detail-grid text:last-child { color:#123f34; font-size:29rpx; font-weight:700; }
.garden-rules { display:grid; padding:26rpx; gap:10rpx; border:1rpx solid #ddede5; border-radius:30rpx; background:#f5fcf8; }.garden-rules text { color:var(--color-text-secondary); font-size:24rpx; line-height:1.6; }.garden-rules text:first-child { color:var(--color-brand-pressed); font-size:28rpx; font-weight:700; }.garden-boundary { display:block; padding:0 24rpx; color:var(--color-text-tertiary); font-size:23rpx; line-height:1.6; }
.checkin-hero { display:grid; min-height:230rpx; padding:28rpx 22rpx; grid-template-columns:128rpx minmax(0,1fr) 96rpx; align-items:center; gap:18rpx; border-radius:36rpx; background:#fff; box-shadow:var(--shadow-card); }
.checkin-tree { width:128rpx; height:188rpx; }
.checkin-summary-copy > text { display:block; color:#00866e; font-size:31rpx; font-weight:750; line-height:1.5; }
.checkin-statistics { display:grid; grid-template-columns:1fr 1fr; margin-top:22rpx; }
.checkin-statistics > view { min-width:0; }
.checkin-statistics > view + view { padding-left:20rpx; border-left:2rpx solid #e4eeea; }
.checkin-statistics > view > text { display:block; font-size:24rpx; color:#5e726b; }
.checkin-statistics > view > text:last-child { margin-top:8rpx; font-size:40rpx; font-weight:750; color:#163d30; }
.checkin-statistics > view > text:last-child > text { font-size:23rpx; font-weight:400; color:#5e726b; }
.checkin-state { display:flex; width:96rpx; height:96rpx; flex-direction:column; align-items:center; justify-content:center; border-radius:50%; background:#edf7f2; color:#598571; }
.checkin-state--done { background:var(--gradient-brand); color:#fff; }
.checkin-state > text:first-child { font-size:42rpx; font-weight:750; line-height:1; }
.checkin-state > text:last-child { margin-top:5rpx; font-size:23rpx; line-height:1.3; }
.calendar-card { padding:30rpx 22rpx; border-radius:36rpx; background:#fff; box-shadow:var(--shadow-card); }.calendar-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:24rpx; }.calendar-heading>text { font-size:32rpx; font-weight:750; }.calendar-heading button { display:flex; width:75rpx; height:75rpx; align-items:center; justify-content:center; color:#009a7d; font-size:55rpx; background:transparent; }.calendar-heading button[disabled] { color:#b6c6be; }.calendar-week,.calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6rpx; text-align:center; }.calendar-week { margin-bottom:12rpx; color:var(--color-text-secondary); font-size:25rpx; }.calendar-grid>view { display:flex; min-height:85rpx; align-items:center; justify-content:center; flex-direction:column; border:1rpx solid transparent; border-radius:14rpx; color:#174034; font-size:26rpx; }.calendar-grid>view.today { border-color:#07a47f; }.calendar-grid>view.future { color:#6b7670; }.calendar-grid>view.done { color:#068464; font-weight:700; }.calendar-grid image { width:28rpx; height:28rpx; }
.recent-checkins { display:grid; gap:18rpx; }.garden-list-title { font-size:29rpx; font-weight:750; }.recent-checkin-list { padding:6rpx 25rpx; border-radius:30rpx; background:#fff; box-shadow:var(--shadow-card); }.recent-checkin-list>view { display:grid; grid-template-columns:120rpx 1fr auto; gap:12rpx; min-height:90rpx; align-items:center; border-bottom:1rpx solid var(--color-line); font-size:23rpx; }.recent-checkin-list>view:last-child { border:0; }.recent-checkin-list>view>text:last-child { color:var(--color-text-tertiary); }.garden-empty { padding:30rpx; border-radius:26rpx; background:#fff; color:var(--color-text-secondary); font-size:25rpx; line-height:1.6; }
@media(prefers-reduced-motion:reduce) { .plant-wrap { transition:none; } }
.garden-section-content{position:relative;gap:24rpx}.plant-stage{background:transparent;height:490rpx;margin-top:0}.plant-wrap{width:490rpx;height:490rpx}.garden-progress-copy text:first-child{font-size:36rpx}.garden-progress-copy text:last-child{font-size:25rpx}.today-growth{position:relative;background:#fff;box-shadow:var(--shadow-card);padding-right:150rpx;grid-template-columns:70rpx minmax(0,1fr);gap:16rpx;min-height:145rpx}.today-growth-icon{width:66rpx;height:66rpx;font-size:40rpx;background:#e5f7f1}.today-growth view:last-child text:first-child{font-size:28rpx}.today-growth view:last-child text:last-child{font-size:23rpx}.growth-companion{position:absolute;right:18rpx;top:16rpx;width:122rpx;height:135rpx;pointer-events:none}.garden-rules{background:#fff;border:0;box-shadow:var(--shadow-card)}.growth-node>view{overflow:hidden;background:#e7edeb}.growth-node>view>image{width:100%;height:100%}.growth-node:not(.reached)>view>image{filter:grayscale(1);opacity:.6}.garden-heading{margin-top:4rpx}.garden-section-tabs{background:#fff;border-color:#e5eeeb}.calendar-grid>view.today{border-color:#009d8d}
</style>
<style scoped lang="scss">
.today-growth-icon>image{width:100%;height:100%}.cycle-detail-grid>view>image{width:64rpx;height:68rpx;margin-bottom:10rpx}.growth-companion{width:148rpx;height:150rpx;right:8rpx;top:8rpx}.today-growth{padding-right:157rpx}.plant-wrap{width:520rpx;height:520rpx}.plant-stage{height:510rpx}.growth-orbit{inset:0;border-color:#fff}.growth-node>view{background:transparent}.growth-node>view>image{width:100%;height:100%}
</style>
