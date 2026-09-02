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
            <view class="sun-glow" />
            <view class="garden-hill garden-hill-left" />
            <view class="garden-hill garden-hill-right" />
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
          <view class="today-growth-icon">{{
            garden.checkedToday ? "✓" : "芽"
          }}</view>
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
              <text>本轮开始</text>
              <text>{{ garden.cycleStartLabel }}</text>
            </view>
            <view>
              <text>有效运动</text>
              <text>{{ garden.cycleDay }}天</text>
            </view>
            <view>
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
          <view>
            <text>{{
              checkIn.checkedToday
                ? "今天已自动打卡"
                : "完成有效运动后自动打卡"
            }}</text>
            <text
              >连续 {{ checkIn.streak }} 天 · 累计
              {{ checkIn.totalDays }} 天</text
            >
          </view>
          <text>{{ checkIn.checkedToday ? "✓" : checkIn.streak }}</text>
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

const stages = ["播种", "冒芽", "幼苗", "舒展", "茁壮", "成熟", "收获"];
const weekDays = ["一", "二", "三", "四", "五", "六", "日"];
const artworkByStage = [
  "/static/icons/garden-seed-stage.svg",
  "/static/icons/garden-seedling-stage.svg",
  "/static/icons/garden-cabbage-stage.svg",
] as const;
const plantScaleByDay = [0.75, 1, 0.82, 0.94, 1.06, 0.92, 1.06] as const;

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
.cycle-detail-card { padding:19rpx; border:1rpx solid #dcebe4; border-radius:20rpx; background:#f8fcfa; }.cycle-detail-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:14rpx; }.cycle-detail-heading view text { display:block; }.cycle-detail-heading view text:first-child { color:#64748b; font-size:17rpx; }.cycle-detail-heading view text:last-child { margin-top:4rpx; color:#19473d; font-size:25rpx; font-weight:750; }.cycle-detail-heading>text { flex:none; padding:5rpx 10rpx; border-radius:999rpx; color:#0f766e; background:#e5f6ee; font-size:17rpx; font-weight:700; }.cycle-detail-grid { display:grid; margin-top:16rpx; padding-top:14rpx; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8rpx; border-top:1rpx solid #e3ede8; }.cycle-detail-grid view { min-width:0; }.cycle-detail-grid text { display:block; }.cycle-detail-grid text:first-child { color:#84908c; font-size:15rpx; }.cycle-detail-grid text:last-child { margin-top:4rpx; overflow:hidden; color:#385c52; font-size:17rpx; font-weight:650; text-overflow:ellipsis; white-space:nowrap; }
.today-growth { display:grid; padding:17rpx 18rpx; grid-template-columns:58rpx 1fr; align-items:center; gap:14rpx; border-radius:18rpx; background:#fff7e8; }.today-growth.done { background:#eaf8f1; }.today-growth-icon { display:flex; width:52rpx; height:52rpx; align-items:center; justify-content:center; border-radius:16rpx; color:#8a641c; background:#ffe7a7; font-size:21rpx; font-weight:800; }.today-growth.done .today-growth-icon { color:#fff; background:#2e9b7b; }.today-growth view:last-child text { display:block; }.today-growth view:last-child text:first-child { color:#1e293b; font-size:23rpx; font-weight:750; }.today-growth view:last-child text:last-child { margin-top:4rpx; color:#64748b; font-size:18rpx; line-height:1.45; }
.garden-rules { display:grid; padding:17rpx 18rpx; gap:7rpx; border-radius:18rpx; background:#f8fafc; }.garden-rules text { color:#64748b; font-size:17rpx; line-height:1.45; }.garden-rules text:first-child { margin-bottom:2rpx; color:#334155; font-size:20rpx; font-weight:750; }.garden-rules text:not(:first-child)::before { margin-right:8rpx; content:"•"; color:#64a967; }
.garden-boundary { display:block; color:#7b8783; font-size:17rpx; line-height:1.45; text-align:center; }
.checkin-content { display:grid; gap:14rpx; }.checkin-summary { display:grid; padding:19rpx 21rpx; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:16rpx; border-radius:22rpx; background:#fff; box-shadow:0 4rpx 16rpx rgba(15,23,42,.04); }.checkin-summary>view text { display:block; }.checkin-summary>view:first-child text:first-child { color:#1e293b; font-size:23rpx; font-weight:750; }.checkin-summary>view:first-child text:last-child { margin-top:4rpx; color:#64748b; font-size:17rpx; }.checkin-summary>view:last-child { text-align:right; }.checkin-summary>view:last-child text { color:#0f766e; font-size:18rpx; font-weight:700; }.checkin-summary>view:last-child text+text { margin-top:4rpx; }
.calendar-card { margin-top:0; padding:18rpx 20rpx 20rpx; border-radius:22rpx; background:#fff; box-shadow:0 4rpx 16rpx rgba(15,23,42,.04); }.calendar-heading { display:grid; grid-template-columns:54rpx 1fr 54rpx; align-items:center; }.calendar-heading button { min-height:48rpx; color:#0f766e; font-size:30rpx; }.calendar-heading button[disabled] { color:#cbd5e1; }.calendar-heading text { color:#1e293b; font-size:23rpx; font-weight:750; text-align:center; }.calendar-week,.calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); }.calendar-week { margin-top:12rpx; }.calendar-week text { color:#94a3b8; font-size:16rpx; text-align:center; }.calendar-grid { margin-top:6rpx; row-gap:4rpx; }.calendar-grid>view { position:relative; display:flex; min-width:0; height:55rpx; align-items:center; justify-content:center; color:#475569; font-size:17rpx; }.calendar-grid>view.blank { visibility:hidden; }.calendar-grid>view.future { color:#cbd5e1; }.calendar-grid>view.today { border:2rpx solid #0ea5a4; border-radius:10rpx; background:#f0fdfa; }.calendar-grid>view.done,.calendar-grid>view.done.today { color:#1e293b; border-radius:10rpx; background:transparent; }.calendar-grid>view.done image { width:44rpx; height:44rpx; }.calendar-grid>view.done>text:first-child { position:absolute; z-index:1; top:1rpx; left:4rpx; color:#4b6350; font-size:13rpx; font-weight:700; }
.recent-checkins { padding:19rpx 21rpx; border-radius:22rpx; background:#fff; box-shadow:0 4rpx 16rpx rgba(15,23,42,.04); }.garden-list-title { display:block; color:#1e293b; font-size:22rpx; font-weight:750; }.recent-checkin-list { margin-top:10rpx; }.recent-checkin-list>view { display:grid; min-height:64rpx; padding:12rpx 0; grid-template-columns:110rpx minmax(0,1fr) auto; align-items:center; gap:12rpx; border-top:1rpx solid #edf2f0; }.recent-checkin-list>view:first-child { border-top:0; }.recent-checkin-list text { min-width:0; color:#64748b; font-size:17rpx; }.recent-checkin-list text:nth-child(2) { overflow:hidden; color:#334155; font-size:19rpx; font-weight:650; text-overflow:ellipsis; white-space:nowrap; }.recent-checkin-list text:last-child { color:#0f766e; font-weight:650; white-space:nowrap; }.garden-empty { display:block; margin-top:12rpx; color:#84908c; font-size:17rpx; line-height:1.5; }
@media (max-width:370px) { .garden-panel { padding-right:24rpx; padding-left:24rpx; }.garden-summary { min-height:190rpx; padding:20rpx; grid-template-columns:118rpx minmax(0,1fr); }.garden-miniature { width:118rpx; height:128rpx; }.harvest-count { position:absolute; top:16rpx; right:16rpx; min-width:76rpx; padding:8rpx; }.garden-summary-copy { padding-right:64rpx; }.garden-remaining { max-width:240rpx; }.cycle-detail-grid { grid-template-columns:1fr; }.cycle-detail-grid text:last-child { white-space:normal; }.checkin-summary { align-items:flex-start; grid-template-columns:1fr; }.checkin-summary>view:last-child { display:flex; justify-content:space-between; text-align:left; }.calendar-card { padding-right:14rpx; padding-left:14rpx; }.recent-checkin-list>view { grid-template-columns:94rpx minmax(0,1fr) auto; gap:8rpx; } }

/* 复刻参考仓库的“大菜园 / 大月历”双页结构 */
.garden-panel { display:grid; width:100%; gap:20rpx; padding:24rpx 32rpx 48rpx; box-sizing:border-box; }
.garden-section-tabs { display:grid; width:100%; height:84rpx; padding:6rpx; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8rpx; border-radius:20rpx; background:#e8efec; box-sizing:border-box; }
.garden-section-tabs button { width:100%; height:72rpx; min-height:72rpx; padding:0; border-radius:15rpx; color:#64748b; background:transparent; font-size:25rpx; font-weight:700; box-sizing:border-box; }
.garden-section-tabs button.selected { color:#fff; background:#0ea5a4; box-shadow:0 5rpx 14rpx rgba(14,165,164,.2); }
.garden-page-shell { width:100%; min-width:0; }
.garden-section-content { display:flex; width:100%; height:1780rpx; min-width:0; padding:0; overflow:hidden; flex-direction:column; gap:20rpx; box-sizing:border-box; }

.garden-hero { position:relative; flex:none; min-height:760rpx; overflow:hidden; padding:30rpx; border-radius:32rpx; color:#19473d; background:linear-gradient(155deg,#effbf2 0%,#fff9e9 100%); box-shadow:0 8rpx 28rpx rgba(41,101,75,.09); box-sizing:border-box; }
.garden-heading { position:relative; z-index:2; display:flex; align-items:flex-start; justify-content:space-between; gap:20rpx; }
.garden-heading view:first-child text { display:block; }
.garden-kicker { color:#19473d; font-size:31rpx; font-weight:800; }
.harvest-count { min-width:108rpx; padding:13rpx; border-radius:20rpx; background:rgba(255,255,255,.78); text-align:center; }
.harvest-count text { display:block; }.harvest-count text:first-child { color:#0f766e; font-size:35rpx; font-weight:800; }.harvest-count text:last-child { margin-top:2rpx; color:#64748b; font-size:16rpx; }
.plant-stage { position:relative; display:flex; height:365rpx; margin-top:4rpx; align-items:flex-end; justify-content:center; isolation:isolate; }
.plant-stage .sun-glow { position:absolute; z-index:0; top:20rpx; right:32rpx; width:86rpx; height:86rpx; border-radius:50%; background:#ffe28a; box-shadow:0 0 52rpx rgba(255,207,77,.46); }
.garden-hill { position:absolute; z-index:0; bottom:24rpx; width:390rpx; height:118rpx; border-radius:55% 55% 0 0; background:rgba(143,193,140,.13); }
.garden-hill-left { left:-110rpx; transform:rotate(7deg); }.garden-hill-right { right:-120rpx; background:rgba(97,166,121,.1); transform:rotate(-8deg); }
.plant-stage .plant-wrap { position:relative; z-index:2; display:flex; width:430rpx; height:323rpx; align-items:center; justify-content:center; transform-origin:50% 88%; transition:transform .26s ease,opacity .26s ease,filter .26s ease; }
.growth-plant-art { display:block; width:430rpx; height:323rpx; }
.plant-wrap.garden-day-0 { filter:saturate(.78); }.plant-wrap.garden-day-1 { filter:drop-shadow(0 9rpx 16rpx rgba(105,145,77,.13)); }.plant-wrap.garden-day-4 { filter:brightness(1.04) saturate(1.04); }.plant-wrap.garden-day-6 { filter:drop-shadow(0 9rpx 22rpx rgba(238,184,67,.22)); }
.plant-wrap.garden-day-6.stage-glow { animation:garden-warm-glow 2.8s ease-in-out infinite; }
.garden-progress-copy { position:relative; z-index:2; display:flex; margin-top:8rpx; align-items:center; flex-direction:column; gap:7rpx; text-align:center; }.garden-progress-copy text:first-child { color:#19473d; font-size:31rpx; font-weight:800; }.garden-progress-copy text:last-child { color:#64748b; font-size:20rpx; line-height:1.45; }
.garden-hero .growth-track { margin-top:24rpx; }.garden-hero .growth-track::before { top:21rpx; }.garden-hero .growth-node>view { width:42rpx; height:42rpx; font-size:15rpx; }.garden-hero .growth-node.current>view { transform:scale(1.12); border-color:#d9efdc; box-shadow:0 0 0 5rpx rgba(100,169,103,.2); }.garden-hero .growth-node>text { margin-top:9rpx; font-size:14rpx; }
.today-growth { flex:none; min-height:120rpx; padding:24rpx; grid-template-columns:72rpx minmax(0,1fr); gap:18rpx; border-radius:24rpx; box-sizing:border-box; }.today-growth-icon { width:64rpx; height:64rpx; border-radius:20rpx; font-size:25rpx; }.today-growth view:last-child text:first-child { font-size:27rpx; }.today-growth view:last-child text:last-child { margin-top:6rpx; font-size:21rpx; line-height:1.55; }
.cycle-detail-card { flex:none; padding:20rpx 22rpx; border-radius:24rpx; }.cycle-detail-card .cycle-detail-grid { margin-top:0; padding-top:0; border-top:0; }.cycle-detail-grid text:first-child { font-size:17rpx; }.cycle-detail-grid text:last-child { font-size:19rpx; }
.garden-rules { flex:none; padding:20rpx 22rpx; border-radius:22rpx; }.garden-rules text { font-size:19rpx; }.garden-rules text:first-child { font-size:23rpx; }
.garden-boundary { margin-top:auto; padding:18rpx 22rpx; border-radius:20rpx; background:#eef1f0; font-size:19rpx; }

.checkin-hero { display:flex; flex:none; min-height:148rpx; padding:30rpx; align-items:center; justify-content:space-between; gap:20rpx; border-radius:26rpx; color:#fff; background:linear-gradient(135deg,#11866f,#4cab97); box-shadow:0 8rpx 24rpx rgba(14,165,164,.2); box-sizing:border-box; }
.checkin-hero view text { display:block; }.checkin-hero view text:first-child { font-size:30rpx; font-weight:700; }.checkin-hero view text:last-child { margin-top:8rpx; color:rgba(255,255,255,.82); font-size:21rpx; }
.checkin-hero>text { display:flex; width:72rpx; height:72rpx; flex:none; align-items:center; justify-content:center; border:4rpx solid rgba(255,255,255,.58); border-radius:50%; font-size:31rpx; font-weight:800; box-sizing:border-box; }
.garden-checkin-page .calendar-card { flex:none; padding:22rpx 16rpx 24rpx; border:0; border-radius:26rpx; box-shadow:0 4rpx 16rpx rgba(15,23,42,.05); }
.garden-checkin-page .calendar-heading { grid-template-columns:76rpx minmax(0,1fr) 76rpx; }.garden-checkin-page .calendar-heading text { font-size:32rpx; font-weight:700; }.garden-checkin-page .calendar-heading button { width:76rpx; height:68rpx; color:#0ea5a4; font-size:48rpx; }
.garden-checkin-page .calendar-week { margin:10rpx 0; }.garden-checkin-page .calendar-week text { padding:9rpx 0; color:#94a3b8; font-size:21rpx; }
.garden-checkin-page .calendar-grid { row-gap:0; }.garden-checkin-page .calendar-grid>view { width:100%; height:82rpx; flex-direction:column; border-radius:0; color:#1e293b; font-size:24rpx; }
.garden-checkin-page .calendar-grid>view.today { border:2rpx solid #0ea5a4; border-radius:12rpx; background:#f0fdfa; color:#0ea5a4; }
.garden-checkin-page .calendar-grid>view.done,.garden-checkin-page .calendar-grid>view.done.today { color:#1e293b; border-radius:12rpx; background:transparent; }
.garden-checkin-page .calendar-grid>view.done.today { border:2rpx solid #0ea5a4; background:#f0fdfa; }
.garden-checkin-page .calendar-grid>view.done image { width:58rpx; height:58rpx; margin-top:10rpx; }.garden-checkin-page .calendar-grid>view.done>text:first-child { top:3rpx; left:7rpx; font-size:17rpx; }
.recent-checkins { flex:none; padding:20rpx 22rpx; border-radius:24rpx; }.garden-list-title { font-size:24rpx; }.recent-checkin-list { margin-top:8rpx; }.recent-checkin-list>view { min-height:62rpx; padding:10rpx 0; grid-template-columns:108rpx minmax(0,1fr) auto; }.recent-checkin-list text { font-size:17rpx; }.recent-checkin-list text:nth-child(2) { font-size:19rpx; }
.garden-checkin-page .garden-rules { margin-top:auto; }

@media (max-width:370px) {
  .garden-panel { padding-right:24rpx; padding-left:24rpx; }
  .garden-section-content { height:1780rpx; }
  .garden-hero { min-height:720rpx; padding:24rpx 20rpx; }
  .garden-kicker { font-size:27rpx; }
  .harvest-count { min-width:94rpx; padding:11rpx 8rpx; }
  .plant-stage { height:340rpx; }
  .plant-stage .plant-wrap,.growth-plant-art { width:390rpx; height:293rpx; }
  .garden-progress-copy { gap:5rpx; }
  .garden-progress-copy text:first-child { font-size:28rpx; }
  .garden-progress-copy text:last-child { font-size:18rpx; }
  .garden-hero .growth-node>view { width:36rpx; height:36rpx; }
  .garden-hero .growth-node>text { font-size:12rpx; }
  .cycle-detail-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
  .cycle-detail-grid text:last-child { white-space:nowrap; }
  .checkin-hero { padding:24rpx; }
  .garden-checkin-page .calendar-grid>view { height:78rpx; }
  .recent-checkin-list>view { grid-template-columns:90rpx minmax(0,1fr) auto; gap:8rpx; }
}
@keyframes garden-warm-glow { 0%,100% { filter:drop-shadow(0 9rpx 20rpx rgba(238,184,67,.16)); } 50% { filter:drop-shadow(0 9rpx 30rpx rgba(238,184,67,.32)); } }
@media (prefers-reduced-motion: reduce) { .plant-wrap { transition:none; animation:none !important; } }
</style>
