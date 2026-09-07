<template>
  <view class="experience" :data-exercise="game.id">
    <view v-if="game.interaction === 'camera-score'" class="camera-training" :class="{ 'baduanjin-training': isBaduanjin }">
      <view v-if="isBaduanjin" class="segment-card">
        <view class="segment-heading">
          <text>{{ segmentTitle }}</text>
          <text>{{ segmentCounter }}</text>
        </view>
        <view class="segment-dots">
          <view v-for="(_, index) in segmentNames" :key="index" :class="{ done: !isPreparing && index < currentSegment, active: !isPreparing && index === currentSegment }" />
        </view>
      </view>

      <view class="dual-camera-stage">
      <view class="training-pane">
        <text class="pane-heading">动作示范</text>
        <video
          v-if="isBaduanjin"
          id="baduanjin-course-video"
          class="baduanjin-course-video"
          :src="activity.video"
          :poster="activity.poster"
          :autoplay="true"
          :loop="false"
          :muted="false"
          :controls="true"
          :enable-progress-gesture="true"
          :show-center-play-btn="true"
          :show-play-btn="true"
          :show-fullscreen-btn="true"
          playsinline
          object-fit="contain"
          @timeupdate="onCourseTimeUpdate"
          @ended="emit('course-ended')"
        />
        <MagpieMotion
          v-else
          :paused="paused"
          :label="activity.title + '示范动作'"
          :video-src="activity.video"
          :poster="activity.poster"
          :riv-src="activity.rive.enabled ? activity.rive.src : ''"
          :artboard="activity.rive.artboard"
          :state-machine="activity.rive.stateMachine"
          :fit="activity.rive.fit"
        />
      </view>
      <view class="training-pane">
        <text class="pane-heading">我的画面</text>
        <CameraPreview :paused="paused" @status="emit('camera-status', $event)" />
      </view>
      </view>
    </view>

    <view v-else-if="game.interaction === 'rep-game'" class="game-stage resistance-stage">
      <image class="game-mascot" src="/static/replica-v7/growth-bird.png" mode="aspectFit" />
      <text class="game-kicker">托举小喜鹊</text>
      <text class="game-title">跟随节奏，完成 12 次动作</text>
      <view class="rep-progress"><view :style="{ width: Math.min(100, repCount / 12 * 100) + '%' }" /></view>
      <view class="rep-count"><text>{{ repCount }}</text><text>/ 12 次</text></view>
      <button class="game-action" :disabled="paused || repCount >= 12" @tap="emit('rep')">{{ repCount >= 12 ? '目标完成' : '完成一次动作' }}</button>
      <text class="prototype-label">当前通过点击模拟动作完成，未接入人体姿态识别</text>
    </view>

    <view v-else class="game-stage rhythm-stage">
      <MagpieMotion
        class="rhythm-motion"
        :paused="paused"
          :label="activity.title"
        :video-src="activity.video"
        :poster="activity.poster"
        :riv-src="activity.rive.enabled ? activity.rive.src : ''"
        :artboard="activity.rive.artboard"
        :state-machine="activity.rive.stateMachine"
        :fit="activity.rive.fit"
      />
      <view class="rhythm-copy"><text class="game-kicker">{{ game.categoryId === 'aerobic' ? '稳定节律' : '呼吸与节拍' }}</text><text class="game-title">跟随提示轻轻点击</text></view>
      <view class="rhythm-stats"><view><text class="score">{{ rhythmHits }}</text><text>命中</text></view><view><text class="score">{{ rhythmCombo }}</text><text>连击</text></view><view><text class="score">{{ rhythmRound }}</text><text>/ 3 组</text></view></view>
      <button class="beat-button" :disabled="paused || rhythmHits >= 24" @tap="emit('beat')"><text>♪</text><text>{{ rhythmHits >= 24 ? '节拍完成' : '点击节拍' }}</text></button>
      <text class="prototype-label">3 组 × 8 拍，准确率由原型互动规则生成</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, watch } from 'vue'
import CameraPreview from '@/components/CameraPreview.vue'
import MagpieMotion from '@/components/MagpieMotion.vue'
import type { Activity } from '@/lib/rive-motion'
import type { ExerciseGame } from '@/lib/prototype-data'

const props = defineProps<{
  game: ExerciseGame
  activity: Activity
  paused: boolean
  repCount: number
  rhythmHits: number
  rhythmCombo: number
  rhythmRound: number
  elapsed: number
  targetSeconds: number
}>()

const segmentNames = ['双手托天理三焦', '左右开弓似射雕', '调理脾胃须单举', '五劳七伤往后瞧', '摇头摆尾去心火', '两手攀足固肾腰', '攒拳怒目增气力', '背后七颠百病消']
const segmentStartSeconds = [30, 130, 220, 295, 355, 460, 555, 630]
const isBaduanjin = computed(() => props.game.id === 'baduanjin')
const isPreparing = computed(() => props.elapsed < segmentStartSeconds[0])
const currentSegment = computed(() => {
  let active = 0
  segmentStartSeconds.forEach((start, index) => {
    if (props.elapsed >= start) active = index
  })
  return active
})
const segmentTitle = computed(() => isPreparing.value
  ? '预备式 · 调整呼吸'
  : `第 ${currentSegment.value + 1} 式 · ${segmentNames[currentSegment.value]}`)
const segmentCounter = computed(() => isPreparing.value ? '准备' : `${currentSegment.value + 1}/8`)

const componentInstance = getCurrentInstance()
let courseVideoContext: ReturnType<typeof uni.createVideoContext> | undefined

onMounted(() => {
  if (isBaduanjin.value)
    courseVideoContext = uni.createVideoContext('baduanjin-course-video', componentInstance?.proxy as any)
})

watch(() => props.paused, (paused) => {
  if (!isBaduanjin.value || !courseVideoContext) return
  if (paused) courseVideoContext.pause()
  else courseVideoContext.play()
})

function onCourseTimeUpdate(event: any) {
  const currentTime = Number(event?.detail?.currentTime ?? event?.target?.currentTime)
  if (Number.isFinite(currentTime)) emit('course-time', currentTime)
}

const emit = defineEmits<{
  (event: 'camera-status', value: 'idle' | 'requesting' | 'ready' | 'denied'): void
  (event: 'course-time', value: number): void
  (event: 'course-ended'): void
  (event: 'rep'): void
  (event: 'beat'): void
}>()
</script>

<style scoped lang="scss">
.experience {
  width: 100%;
}
.camera-training {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10rpx;
}
.segment-card {
  padding: 10rpx 4rpx 12rpx;
  background: transparent;
}
.segment-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}
.segment-heading > text:first-child {
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 25rpx;
  color: #e4fff0;
}
.segment-heading > text:last-child {
  font-size: 23rpx;
  font-weight: 760;
  color: #a5edd2;
}
.segment-dots {
  display: grid;
  margin-top: 9rpx;
  grid-template-columns: repeat(8, 1fr);
  gap: 7rpx;
}
.segment-dots view {
  height: 7rpx;
  border-radius: 999rpx;
  background: #256c5d;
}
.segment-dots view.done {
  background: #74c7b3;
}
.segment-dots view.active {
  background: #5be39e;
}
.dual-camera-stage {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8rpx;
}
.training-pane {
  position: relative;
  overflow: hidden;
  height: 650rpx;
  border: 2rpx solid #77b9a7;
  border-radius: 28rpx;
  background: #254f44;
}
.training-pane:nth-child(2) {
  height: 650rpx;
}
.pane-heading {
  position: absolute;
  z-index: 4;
  color: #fff;
  font-weight: 700;
  text-align: center;
  top: 18rpx;
  left: 15%;
  right: 15%;
  padding: 9rpx 2rpx;
  border: 1rpx solid #65c8a8;
  border-radius: 999rpx;
  background: #00766190;
  font-size: 23rpx;
}
.baduanjin-course-video {
  display: block;
  width: 100%;
  height: 100%;
  background: #000;
}
.score {
  color: #baf5d1;
  font-size: 48rpx;
  font-weight: 700;
}
.prototype-label {
  display: block;
  font-size: 23rpx;
  line-height: 1.5;
  text-align: center;
  color: #b0d9c8;
}
.game-stage {
  display: flex;
  padding: 32rpx;
  align-items: center;
  flex-direction: column;
  border-radius: var(--radius-card);
  box-shadow: 0 4rpx 16rpx rgba(15,23,42,.04);
  min-height: 650rpx;
  background: linear-gradient(160deg,#145f54,#00473d);
  border: 1rpx solid #58a995;
  color: #e6fff3;
}
.game-mascot {
  width: 300rpx;
  height: 260rpx;
}
.game-kicker {
  font-size: 24rpx;
  font-weight: 600;
  color: #9de9c9;
}
.game-title {
  margin-top: 8rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}
.rep-progress {
  width: 100%;
  height: 18rpx;
  margin-top: 34rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #ebeef2;
}
.rep-progress view {
  height: 100%;
  border-radius: inherit;
  background: var(--color-brand);
  transition: width 0.2s ease;
}
.rep-count {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin: 26rpx 0;
  color: var(--color-text-secondary);
}
.rep-count text:first-child {
  font-size: 72rpx;
  font-weight: 700;
  color: #fff;
}
.game-action, .beat-button {
  display: flex;
  width: 100%;
  min-height: 92rpx;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  background: linear-gradient(120deg,#36cb6b,#08a04b);
  border: 1rpx solid #8cebb1;
  border-radius: 28rpx;
}
.game-action[disabled], .beat-button[disabled] {
  opacity: 0.55;
}
.resistance-stage .prototype-label {
  margin-top: 24rpx;
}
.rhythm-stage {
  position: relative;
  overflow: hidden;
}
.rhythm-motion {
  width: calc(100% + 64rpx);
  height: 420rpx;
  margin: -32rpx -32rpx 24rpx;
  background: #000;
}
.rhythm-copy {
  display: flex;
  align-items: center;
  flex-direction: column;
}
.rhythm-stats {
  display: grid;
  width: 100%;
  margin: 28rpx 0;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}
.rhythm-stats view {
  display: flex;
  padding: 18rpx 8rpx;
  align-items: center;
  flex-direction: column;
  border-radius: 16rpx;
  font-size: 23rpx;
  background: #ffffff0f;
  color: #c7eddc;
}
.beat-button {
  gap: 16rpx;
  min-height: 112rpx;
}
.beat-button text:first-child {
  font-size: 50rpx;
}
.rhythm-stage .prototype-label {
  margin-top: 22rpx;
}
</style>
