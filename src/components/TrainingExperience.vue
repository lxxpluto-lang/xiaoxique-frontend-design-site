<template>
  <view class="experience" :data-exercise="game.id">
    <view v-if="game.interaction === 'camera-score'" class="camera-training" :class="{ 'baduanjin-training': isBaduanjin }">
      <view v-if="isBaduanjin" class="segment-card">
        <view class="segment-heading">
          <view><text>八段锦跟练</text><text>第 {{ currentSegment + 1 }} 式 · {{ segmentNames[currentSegment] }}</text></view>
          <text>{{ currentSegment + 1 }}/8</text>
        </view>
        <view class="segment-dots">
          <view v-for="(_, index) in segmentNames" :key="index" :class="{ done: index < currentSegment, active: index === currentSegment }" />
        </view>
      </view>

      <view v-if="isBaduanjin" class="camera-guide" :class="`camera-guide--${cameraStatus}`">
        <view class="guide-icon">{{ cameraStatus === 'ready' ? '✓' : '身' }}</view>
        <view><text>{{ cameraGuideTitle }}</text><text>{{ cameraGuideCopy }}</text></view>
      </view>

      <view class="dual-camera-stage">
      <view class="training-pane">
        <text class="pane-heading">动作示范</text>
        <MagpieMotion
          :label="activity.title + '示范动作'"
          :video-src="activity.video"
          :poster="activity.poster"
          :riv-src="activity.rive.enabled ? activity.rive.src : ''"
          :artboard="activity.rive.artboard"
          :state-machine="activity.rive.stateMachine"
          :fit="activity.rive.fit"
        />
        <text class="pane-label">跟随呼吸慢慢做</text>
      </view>
      <view class="training-pane">
        <text class="pane-heading">我的画面</text>
        <CameraPreview @status="emit('camera-status', $event)" />
        <text class="pane-label">{{ cameraStatus === 'ready' ? '姿态识别中' : '等待全身入镜' }}</text>
      </view>
      </view>
      <view class="follow-stats">
        <view><text>{{ cameraStatus === 'ready' ? score : '--' }}</text><text>动作匹配</text></view>
        <view><text>{{ completedSegments }}/8</text><text>完成式数</text></view>
        <view><text>{{ cameraStatus === 'ready' ? '稳定' : '待识别' }}</text><text>动作节奏</text></view>
      </view>
      <text class="prototype-label">画面仅在本机用于姿态演示，不保存、不上传；骨架与评分为原型模拟，不用于医疗判断</text>
    </view>

    <view v-else-if="game.interaction === 'rep-game'" class="game-stage resistance-stage">
      <image class="game-mascot" src="/static/rive-source/v4/master/magpie-neutral-master-v4.png" mode="aspectFit" />
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
import { computed } from 'vue'
import CameraPreview from '@/components/CameraPreview.vue'
import MagpieMotion from '@/components/MagpieMotion.vue'
import type { Activity } from '@/lib/rive-motion'
import type { ExerciseGame } from '@/lib/prototype-data'

const props = defineProps<{
  game: ExerciseGame
  activity: Activity
  score: number
  paused: boolean
  repCount: number
  rhythmHits: number
  rhythmCombo: number
  rhythmRound: number
  elapsed: number
  targetSeconds: number
  cameraStatus: 'idle' | 'requesting' | 'ready' | 'denied'
}>()

const segmentNames = ['双手托天理三焦', '左右开弓似射雕', '调理脾胃须单举', '五劳七伤往后瞧', '摇头摆尾去心火', '两手攀足固肾腰', '攒拳怒目增气力', '背后七颠百病消']
const isBaduanjin = computed(() => props.game.id === 'baduanjin')
const currentSegment = computed(() => Math.min(7, Math.floor(props.elapsed / Math.max(1, props.targetSeconds) * 8)))
const completedSegments = computed(() => Math.min(8, Math.floor(props.elapsed / Math.max(1, props.targetSeconds) * 8)))
const cameraGuideTitle = computed(() => ({ idle: '请先固定手机并确保全身入镜', requesting: '正在申请摄像头权限', ready: '已识别全身，可以开始跟练', denied: '未开启摄像头，可继续观看动作示范' }[props.cameraStatus]))
const cameraGuideCopy = computed(() => ({ idle: '手机放在腰部同高位置，后退 2–3 步，周围留出伸展空间。', requesting: '授权后只在本机显示画面，不保存训练影像。', ready: '保持自然呼吸；出现胸痛、明显气促或头晕请立即停止。', denied: '本次不生成动作匹配分，不影响观看示范和保存运动记录。' }[props.cameraStatus]))

const emit = defineEmits<{
  (event: 'camera-status', value: 'idle' | 'requesting' | 'ready' | 'denied'): void
  (event: 'rep'): void
  (event: 'beat'): void
}>()
</script>

<style scoped lang="scss">
.experience { width: 100%; }
.camera-training { display: grid; grid-template-columns: 1fr; gap: 16rpx; }
.segment-card { padding: 18rpx; border: 1rpx solid #d7e9e4; border-radius: 22rpx; background: #fff; }
.segment-heading { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.segment-heading view text { display: block; }.segment-heading view text:first-child { color: #0f766e; font-size: 19rpx; font-weight: 700; }.segment-heading view text:last-child { margin-top: 5rpx; color: #1e293b; font-size: 25rpx; font-weight: 720; }.segment-heading > text { color: #0f766e; font-size: 24rpx; font-weight: 760; }
.segment-dots { display: grid; margin-top: 15rpx; grid-template-columns: repeat(8, 1fr); gap: 7rpx; }.segment-dots view { height: 8rpx; border-radius: 999rpx; background: #dce6e3; }.segment-dots view.done { background: #74c7b3; }.segment-dots view.active { background: #0f8b72; box-shadow: 0 0 0 4rpx rgba(15,139,114,.12); }
.camera-guide { display: grid; padding: 16rpx; grid-template-columns: 48rpx 1fr; align-items: center; gap: 12rpx; border-radius: 18rpx; color: #49605a; background: #eef7f4; }.guide-icon { display: flex; width: 44rpx; height: 44rpx; align-items: center; justify-content: center; border-radius: 14rpx; color: #fff; background: #4fae97; font-size: 20rpx; font-weight: 750; }.camera-guide text { display: block; }.camera-guide text:first-child { color: #1f3b34; font-size: 20rpx; font-weight: 700; }.camera-guide text:last-child { margin-top: 3rpx; font-size: 17rpx; line-height: 1.45; }.camera-guide--denied { color: #6f6251; background: #fff7e8; }.camera-guide--denied .guide-icon { background: #c39242; }
.dual-camera-stage { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8rpx; }
.training-pane { position: relative; height: 500rpx; overflow: hidden; border: 2rpx solid #cde5df; border-radius: 22rpx; background: #dce9e5; }.training-pane:nth-child(2) { height: 500rpx; }
.pane-heading { position: absolute; z-index: 4; top: 0; left: 0; right: 0; padding: 12rpx 8rpx; color: #fff; background: rgba(16,75,64,.88); font-size: 19rpx; font-weight: 700; text-align: center; }
.pane-label { position: absolute; z-index: 4; right: 10rpx; bottom: 10rpx; left: 10rpx; padding: 8rpx 6rpx; border-radius: 10rpx; color: #fff; font-size: 17rpx; background: rgba(15,23,42,.7); text-align: center; }
.follow-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8rpx; }.follow-stats view { padding: 15rpx 6rpx; border: 1rpx solid #e0e8e5; border-radius: 17rpx; background: #fff; text-align: center; }.follow-stats text { display: block; }.follow-stats text:first-child { color: #0f766e; font-size: 28rpx; font-weight: 750; }.follow-stats text:last-child { margin-top: 3rpx; color: #71807b; font-size: 17rpx; }
.score { color: #0f766e; font-size: 48rpx; font-weight: 700; }
.prototype-label { display: block; color: #64748b; font-size: 22rpx; line-height: 1.5; text-align: center; }
.game-stage { display: flex; min-height: 620rpx; padding: 32rpx; align-items: center; flex-direction: column; border: 0; border-radius: 24rpx; background: #fff; box-shadow: 0 4rpx 16rpx rgba(15,23,42,.04); }
.game-mascot { width: 300rpx; height: 260rpx; }
.game-kicker { color: #0f766e; font-size: 24rpx; font-weight: 600; }
.game-title { margin-top: 8rpx; color: #1e293b; font-size: 32rpx; font-weight: 600; }
.rep-progress { width: 100%; height: 18rpx; margin-top: 34rpx; overflow: hidden; border-radius: 999rpx; background: #ebeef2; }
.rep-progress view { height: 100%; border-radius: inherit; background: #0ea5a4; transition: width 0.2s ease; }
.rep-count { display: flex; align-items: baseline; gap: 8rpx; margin: 26rpx 0; color: #64748b; }
.rep-count text:first-child { color: #1e293b; font-size: 72rpx; font-weight: 700; }
.game-action, .beat-button { display: flex; width: 100%; min-height: 88rpx; align-items: center; justify-content: center; border-radius: 16rpx; color: #fff; font-size: 32rpx; font-weight: 600; background: #0ea5a4; }
.game-action[disabled], .beat-button[disabled] { opacity: 0.55; }
.resistance-stage .prototype-label { margin-top: 24rpx; }
.rhythm-stage { position: relative; overflow: hidden; }
.rhythm-motion { width: calc(100% + 64rpx); height: 420rpx; margin: -32rpx -32rpx 24rpx; background: #000; }
.rhythm-copy { display: flex; align-items: center; flex-direction: column; }
.rhythm-stats { display: grid; width: 100%; margin: 28rpx 0; grid-template-columns: repeat(3, 1fr); gap: 12rpx; }
.rhythm-stats view { display: flex; padding: 18rpx 8rpx; align-items: center; flex-direction: column; border-radius: 16rpx; color: #64748b; font-size: 22rpx; background: #f8fafc; }
.beat-button { gap: 16rpx; min-height: 112rpx; }
.beat-button text:first-child { font-size: 50rpx; }
.rhythm-stage .prototype-label { margin-top: 22rpx; }
</style>
