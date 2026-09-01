<template>
  <view class="experience" :data-exercise="game.id">
    <view v-if="game.id === 'baduanjin'" class="camera-training">
      <view class="training-pane">
        <MagpieMotion
          :label="activity.title + '示范动作'"
          :video-src="activity.video"
          :poster="activity.poster"
          :riv-src="activity.rive.enabled ? activity.rive.src : ''"
          :artboard="activity.rive.artboard"
          :state-machine="activity.rive.stateMachine"
          :fit="activity.rive.fit"
        />
        <text class="pane-label">小喜示范</text>
      </view>
      <view class="training-pane">
        <CameraPreview @status="emit('camera-status', $event)" />
        <text class="pane-label">我的动作</text>
      </view>
      <view class="experience-result">
        <text>动作模拟评分</text><text class="score">{{ score }}</text><text>分</text>
      </view>
      <text class="prototype-label">摄像头骨架与评分均为原型模拟，不用于医疗判断</text>
    </view>

    <view v-else-if="game.id === 'resistance'" class="game-stage resistance-stage">
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
      <view class="rhythm-copy"><text class="game-kicker">音乐律动</text><text class="game-title">听到节拍就点击</text></view>
      <view class="rhythm-stats"><view><text class="score">{{ rhythmHits }}</text><text>命中</text></view><view><text class="score">{{ rhythmCombo }}</text><text>连击</text></view><view><text class="score">{{ rhythmRound }}</text><text>/ 3 组</text></view></view>
      <button class="beat-button" :disabled="paused || rhythmHits >= 24" @tap="emit('beat')"><text>♪</text><text>{{ rhythmHits >= 24 ? '节拍完成' : '点击节拍' }}</text></button>
      <text class="prototype-label">3 组 × 8 拍，准确率由原型互动规则生成</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import CameraPreview from '@/components/CameraPreview.vue'
import MagpieMotion from '@/components/MagpieMotion.vue'
import type { Activity } from '@/lib/rive-motion'
import type { ExerciseGame } from '@/lib/prototype-data'

defineProps<{
  game: ExerciseGame
  activity: Activity
  score: number
  paused: boolean
  repCount: number
  rhythmHits: number
  rhythmCombo: number
  rhythmRound: number
}>()

const emit = defineEmits<{
  (event: 'camera-status', value: 'idle' | 'requesting' | 'ready' | 'denied'): void
  (event: 'rep'): void
  (event: 'beat'): void
}>()
</script>

<style scoped lang="scss">
.experience { width: 100%; }
.camera-training { display: grid; grid-template-columns: 1fr 1fr; gap: 14rpx; }
.training-pane { position: relative; height: 390rpx; overflow: hidden; border-radius: 24rpx; background: #eaf8f4; }
.pane-label { position: absolute; right: 14rpx; bottom: 14rpx; padding: 7rpx 13rpx; border-radius: 999rpx; color: #fff; font-size: 22rpx; background: rgba(23, 50, 77, 0.7); }
.experience-result { grid-column: 1 / -1; display: flex; align-items: baseline; justify-content: center; gap: 8rpx; padding: 20rpx; border-radius: 24rpx; color: #646a73; background: #fff; }
.score { color: #0c7464; font-size: 42rpx; font-weight: 700; }
.prototype-label { display: block; grid-column: 1 / -1; color: #7b8b99; font-size: 22rpx; line-height: 1.5; text-align: center; }
.game-stage { display: flex; min-height: 620rpx; padding: 36rpx 28rpx; align-items: center; flex-direction: column; border: 1rpx solid #ebeef2; border-radius: 24rpx; background: #fff; }
.game-mascot { width: 300rpx; height: 260rpx; }
.game-kicker { color: #0c7464; font-size: 22rpx; font-weight: 600; }
.game-title { margin-top: 8rpx; color: #1f2329; font-size: 32rpx; font-weight: 600; }
.rep-progress { width: 100%; height: 18rpx; margin-top: 34rpx; overflow: hidden; border-radius: 999rpx; background: #ebeef2; }
.rep-progress view { height: 100%; border-radius: inherit; background: #16a085; transition: width 0.2s ease; }
.rep-count { display: flex; align-items: baseline; gap: 8rpx; margin: 26rpx 0; color: #646a73; }
.rep-count text:first-child { color: #1f2329; font-size: 72rpx; font-weight: 700; }
.game-action, .beat-button { display: flex; width: 100%; min-height: 88rpx; align-items: center; justify-content: center; border-radius: 20rpx; color: #fff; font-size: 26rpx; font-weight: 600; background: #16a085; }
.game-action[disabled], .beat-button[disabled] { opacity: 0.55; }
.resistance-stage .prototype-label { margin-top: 24rpx; }
.rhythm-stage { position: relative; overflow: hidden; }
.rhythm-motion { width: 100%; height: 260rpx; margin: -36rpx -28rpx 24rpx; }
.rhythm-copy { display: flex; align-items: center; flex-direction: column; }
.rhythm-stats { display: grid; width: 100%; margin: 28rpx 0; grid-template-columns: repeat(3, 1fr); gap: 12rpx; }
.rhythm-stats view { display: flex; padding: 18rpx 8rpx; align-items: center; flex-direction: column; border-radius: 20rpx; color: #646a73; font-size: 22rpx; background: #fff; }
.beat-button { gap: 16rpx; min-height: 112rpx; }
.beat-button text:first-child { font-size: 50rpx; }
.rhythm-stage .prototype-label { margin-top: 22rpx; }
</style>
