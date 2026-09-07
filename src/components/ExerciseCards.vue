<template>
  <view class="exercise-cards" data-testid="exercise-primary-cards">
    <button
      v-for="game in games"
      :key="game.id"
      class="exercise-card"
      :data-exercise="game.id"
      @tap="emit('select', game.id)"
    >
      <image class="exercise-card__poster" :src="game.poster" mode="aspectFill" />
      <view class="exercise-card__body">
        <view class="exercise-card__tags">
          <text v-if="mode === 'cardiac' && prescriptionExerciseId === game.id" class="plan-tag">今日计划</text>
          <text v-else-if="mode === 'cardiac'" class="self-tag">自主训练</text>
          <text v-else class="self-tag">3分钟轻运动</text>
          <text class="time-tag">{{ game.duration }}</text>
        </view>
        <text class="exercise-card__title">{{ game.title }}</text>
        <text class="exercise-card__copy">{{ game.subtitle }}</text>
        <view class="exercise-card__footer">
          <text>{{ game.feature }}</text>
          <view class="start-pill">开始训练</view>
        </view>
      </view>
    </button>
  </view>
</template>

<script setup lang="ts">
import type { ExerciseGame, ExerciseGameId, UserMode } from '@/lib/prototype-data'

defineProps<{
  games: ExerciseGame[]
  mode: UserMode
  prescriptionExerciseId?: ExerciseGameId
}>()

const emit = defineEmits<{ (event: 'select', id: ExerciseGameId): void }>()
</script>

<style scoped lang="scss">
.exercise-cards { display: grid; gap: 22rpx; }
.exercise-card {
  display: grid;
  grid-template-columns: 230rpx minmax(0, 1fr);
  min-height: 218rpx;
  overflow: hidden;
  border: 1rpx solid #ebeef2;
  border-radius: 24rpx;
  text-align: left;
  background: #fff;
  box-shadow: none;
}
.exercise-card::after { border: 0; }
.exercise-card__poster { width: 230rpx; height: 100%; min-height: 218rpx; background: #eaf8f4; }
.exercise-card__body { display: flex; min-width: 0; padding: 24rpx 24rpx 22rpx; flex-direction: column; }
.exercise-card__tags { display: flex; align-items: center; gap: 10rpx; margin-bottom: 12rpx; }
.exercise-card__tags text { padding: 6rpx 12rpx; border-radius: 999rpx; font-size: 23rpx; font-weight: 500; }
.plan-tag { color: #fff; background: #16a085; }
.self-tag { color: #0c7464; background: #eaf8f4; }
.time-tag { color: #646a73; background: #f4f7f8; }
.exercise-card__title { display: block; color: #1f2329; font-size: 28rpx; font-weight: 600; }
.exercise-card__copy { display: block; margin-top: 8rpx; overflow: hidden; color: #646a73; font-size: 23rpx; text-overflow: ellipsis; white-space: nowrap; }
.exercise-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 10rpx; margin-top: auto; padding-top: 16rpx; color: #646a73; font-size: 23rpx; }
.start-pill { display: flex; min-height: 64rpx; padding: 10rpx 18rpx; align-items: center; border-radius: 20rpx; color: #fff; font-size: 24rpx; font-weight: 600; background: #16a085; }
@media (max-width: 370px) {
  .exercise-card { grid-template-columns: 190rpx minmax(0, 1fr); }
  .exercise-card__poster { width: 190rpx; }
  .exercise-card__body { padding-right: 18rpx; padding-left: 18rpx; }
}
</style>
