<template>
  <view class="knowledge-companion" :class="{ 'knowledge-companion--entry': entryOnly }" data-testid="knowledge-companions">
    <view v-if="entryOnly" class="companion-hero">
      <view>
        <text>连续同行</text>
        <view><text>{{ streak }}</text><text>天</text></view>
        <text>{{ companionSummary }}</text>
      </view>
      <view class="companion-hero__art"><view class="companion-heart">♥</view><image src="/static/rive-source/v4/master/magpie-neutral-master-v4.png" mode="aspectFit" /></view>
    </view>
    <view class="companion-entry-grid">
      <button :class="{ active: activeTab === 'buddy' }" data-testid="knowledge-buddy-entry" @tap="open('buddy')"><view class="companion-entry-icon companion-entry-icon--buddy">伴</view><text>健康搭子</text><text>{{ buddyState.connected ? '陪伴第 ' + buddyDay + ' 天' : '找一位同行者' }}</text></button>
      <button :class="{ active: activeTab === 'team' }" data-testid="knowledge-team-entry" @tap="open('team')"><view class="companion-entry-icon">队</view><text>健康小队</text><text>{{ teamJoined ? teamCheckedCount + '/' + teamMembers.length + ' 已打卡' : '组队打卡' }}</text></button>
    </view>

    <view v-if="!entryOnly && activeTab === 'team'" class="social-panel knowledge-social-panel" data-testid="team-panel">
      <template v-if="teamJoined">
        <view class="team-hero team-hero--embedded"><view class="team-avatar-stack"><view>我</view><view>康</view><view>动</view><view>+2</view></view><text class="team-name">{{ teamState.name }}</text><text class="team-meta">{{ teamMembers.length }} 人 · 今日 {{ teamCheckedCount }} 人已打卡</text><view class="team-progress"><view :style="{ width: teamProgress + '%' }" /></view><text class="team-progress-copy">今日共同完成 {{ teamProgress }}%</text></view>
        <view class="team-members"><text class="form-title">队伍成员</text><view v-for="member in teamMembers" :key="member.id" class="team-member"><view>{{ member.name.slice(0, 1) }}</view><view><text>{{ member.name }}</text><text>{{ member.status }}</text></view><button v-if="!member.self && member.status === '今日待打卡'" class="remind-button" :class="{ sent: teamState.reminderDates[member.id] === todayKey }" @tap="emit('remindTeam', member.id)">{{ teamState.reminderDates[member.id] === todayKey ? '已提醒' : '提醒TA' }}</button><text v-else>{{ member.streak }}天</text></view><view class="team-invite-code"><text>邀请亲友加入</text><text>{{ teamState.inviteCode }}</text></view></view>
      </template>
      <template v-else>
        <view class="social-empty"><view class="social-empty__icon">队</view><text class="form-title">和亲友组成轻运动小队</text><text>只分享“今日已打卡/待打卡”和连续天数，不共享健康档案。</text><button class="primary-button" data-testid="create-team" @tap="emit('createTeam')">创建我的小队</button></view>
        <view class="team-code-form"><input v-model="inviteCode" maxlength="12" placeholder="输入邀请码 XQ-7DAY" /><button data-testid="join-team-code" @tap="emit('joinTeam', inviteCode)">加入</button></view>
        <button class="text-button companion-demo-button" data-testid="join-team" @tap="emit('joinDemoTeam')">体验演示队伍</button>
      </template>
    </view>

    <view v-else-if="!entryOnly && activeTab === 'buddy'" class="social-panel knowledge-social-panel" data-testid="buddy-panel">
      <view class="buddy-cycle"><text>陪伴周期</text><view><button :class="{ active: buddyState.cycleDays === 7 }" @tap="emit('setBuddyCycle', 7)">7天</button><button :class="{ active: buddyState.cycleDays === 30 }" @tap="emit('setBuddyCycle', 30)">30天</button></view></view>
      <template v-if="buddyState.connected">
        <view class="buddy-card"><view class="buddy-card__head"><view class="buddy-avatar">我</view><view class="buddy-link"><text>健康搭子</text><text>第 {{ buddyDay }} / {{ buddyState.cycleDays }} 天</text></view><view class="buddy-avatar buddy-avatar--friend">康</view></view><view class="buddy-status"><view :class="{ done: checkInDone }"><text>我</text><text>{{ checkInDone ? '今日已打卡' : '今日待打卡' }}</text></view><view><text>{{ buddyState.buddyName }}</text><text>今日待打卡</text></view></view><button class="buddy-remind" :class="{ sent: buddyState.reminderSentDate === todayKey }" @tap="emit('remindBuddy')">{{ buddyState.reminderSentDate === todayKey ? '今天已温和提醒' : '提醒搭子完成今天的行动' }}</button></view>
      </template>
      <view v-else class="social-empty"><view class="social-empty__icon social-empty__icon--buddy">伴</view><text class="form-title">找一位健康搭子互相陪伴</text><text>漏打卡不会解除关系，也不会扣除积分。</text><button class="primary-button" data-testid="connect-buddy" @tap="emit('connectBuddy')">体验演示配对</button></view>
    </view>

    <view v-if="!entryOnly && activeTab !== 'none'" class="team-boundary"><text>温和陪伴原则</text><text>不按运动量、体重、心率或康复指标排名；提醒仅为本地原型，不会发送真实消息。</text></view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BuddyState, TeamState } from '@/lib/prototype-data'

interface TeamMember {
  id: string
  name: string
  status: string
  streak: number
  self: boolean
}

const props = defineProps<{
  entryOnly?: boolean
  activeTab: 'none' | 'team' | 'buddy'
  streak: number
  teamJoined: boolean
  teamState: TeamState
  teamMembers: TeamMember[]
  teamCheckedCount: number
  teamProgress: number
  buddyState: BuddyState
  buddyDay: number
  checkInDone: boolean
  todayKey: string
}>()

const emit = defineEmits<{
  (event: 'update:activeTab', value: 'none' | 'team' | 'buddy'): void
  (event: 'openCheckin'): void
  (event: 'createTeam'): void
  (event: 'joinTeam', value: string): void
  (event: 'joinDemoTeam'): void
  (event: 'remindTeam', memberId: string): void
  (event: 'setBuddyCycle', days: 7 | 30): void
  (event: 'connectBuddy'): void
  (event: 'remindBuddy'): void
  (event: 'openSocial', value: 'team' | 'buddy'): void
}>()

const inviteCode = ref('XQ-7DAY')
const companionSummary = computed(() => props.buddyState.connected ? `和${props.buddyState.buddyName}一起完成今天的健康行动` : props.teamJoined ? `${props.teamMembers.length} 人小队正在互相陪伴` : '找一个人或一群人，温和地坚持运动')
function open(tab: 'team' | 'buddy') { emit('update:activeTab', tab); emit('openSocial', tab) }
</script>

<style scoped lang="scss">
.knowledge-companion { margin: 0; padding: 10rpx 24rpx 8rpx; background: #f8fafc; }
.companion-hero { position: relative; display: flex; min-height: 200rpx; padding: 26rpx 28rpx 50rpx; overflow: hidden; align-items: center; justify-content: space-between; border-radius: 28rpx 28rpx 18rpx 18rpx; color: #24443e; background: linear-gradient(145deg,#dcf5ef,#edf9f6); box-shadow: none; }
.companion-hero text { display: block; }
.companion-hero > view:first-child { position: relative; z-index: 2; max-width: 64%; }.companion-hero > view:first-child > text:first-child { color: #66817b; font-size: 19rpx; font-weight: 650; }.companion-hero > view:first-child > view { display: flex; margin-top: 2rpx; align-items: baseline; gap: 5rpx; }.companion-hero > view:first-child > view text:first-child { color: #1e6f60; font-size: 56rpx; font-weight: 780; line-height: 1; }.companion-hero > view:first-child > view text:last-child { color: #65837b; font-size: 22rpx; }.companion-hero > view:first-child > text:last-child { margin-top: 10rpx; color: #617a74; font-size: 18rpx; line-height: 1.45; }
.companion-hero__art { position: absolute; right: 4rpx; bottom: 18rpx; width: 190rpx; height: 180rpx; }.companion-hero__art image { position: absolute; right: -8rpx; bottom: -5rpx; width: 174rpx; height: 164rpx; }.companion-heart { position: absolute; top: 4rpx; left: 0; display: flex; width: 52rpx; height: 52rpx; align-items: center; justify-content: center; border-radius: 50%; color: #6db9a8; background: rgba(255,255,255,.72); font-size: 25rpx; }
.companion-entry-grid { position: relative; z-index: 3; display: grid; margin-top: -32rpx; padding: 14rpx 8rpx; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; border: 0; border-radius: 24rpx; background: #fff; box-shadow: 0 12rpx 30rpx rgba(30,75,65,.09); }
.companion-entry-grid > button { display: grid; min-width: 0; min-height: 116rpx; padding: 16rpx 18rpx; grid-template-columns: 62rpx 1fr; grid-template-rows: auto auto; align-content: center; align-items: center; column-gap: 14rpx; border-left: 1rpx solid #edf1f0; background: #fff; text-align: left; }
.companion-entry-grid > button::after { border: 0; }
.companion-entry-grid > button:first-child { border-left: 0; }
.companion-entry-grid > button.active { border-color: transparent; background: #fbfefd; }
.companion-entry-icon { display: flex; align-items: center; justify-content: center; width: 62rpx; height: 62rpx; border-radius: 19rpx; color: #36806e; background: #e6f6ed; font-size: 22rpx; font-weight: 700; }
.companion-entry-icon--buddy { color: #d16f43; background: #fff0e9; }
.companion-entry-icon--checkin { color: #9b7310; background: #fff5d5; }
.companion-entry-grid .companion-entry-icon { grid-row: 1 / 3; }.companion-entry-grid button > text:nth-child(2) { color: #1f2329; font-size: 25rpx; font-weight: 700; }.companion-entry-grid button > text:last-child { overflow: hidden; color: #7a8783; font-size: 19rpx; text-overflow: ellipsis; white-space: nowrap; }
.knowledge-social-panel { margin-top: 18rpx; }
.team-hero { padding: 24rpx; border: 1rpx solid #b9e9dc; border-radius: 24rpx; background: linear-gradient(145deg, #e9f9f4, #fff); }
.team-avatar-stack { display: flex; margin-bottom: 16rpx; padding-left: 12rpx; }
.team-avatar-stack view { display: flex; align-items: center; justify-content: center; width: 62rpx; height: 62rpx; margin-left: -12rpx; border: 4rpx solid #fff; border-radius: 50%; color: #0c7464; font-size: 20rpx; font-weight: 700; background: #d7f2ea; }
.team-avatar-stack view:nth-child(2) { background: #e8efff; }
.team-avatar-stack view:nth-child(3) { background: #fff0db; }
.team-avatar-stack view:nth-child(4) { color: #646a73; background: #f1f3f5; }
.team-name, .team-meta, .team-progress-copy { display: block; }
.team-name { color: #1f2329; font-size: 27rpx; font-weight: 700; }
.team-meta { margin-top: 7rpx; color: #646a73; font-size: 21rpx; }
.team-progress { height: 12rpx; margin-top: 19rpx; overflow: hidden; border-radius: 999rpx; background: #dceae6; }
.team-progress view { height: 100%; border-radius: inherit; background: #16a085; }
.team-progress-copy { margin-top: 8rpx; color: #0c7464; font-size: 20rpx; }
.team-members { margin-top: 14rpx; padding: 20rpx; border: 1rpx solid #ebeef2; border-radius: 22rpx; background: #fff; }
.form-title { color: #1f2329; font-size: 25rpx; font-weight: 700; }
.team-member { display: grid; padding: 14rpx 0; grid-template-columns: 58rpx 1fr auto; align-items: center; gap: 12rpx; border-top: 1rpx solid #ebeef2; }
.team-member > view:first-child { display: flex; align-items: center; justify-content: center; width: 54rpx; height: 54rpx; border-radius: 50%; color: #0c7464; font-size: 20rpx; background: #eaf8f4; }
.team-member > view:nth-child(2) text { display: block; color: #1f2329; font-size: 22rpx; }
.team-member > view:nth-child(2) text:last-child { margin-top: 3rpx; color: #646a73; font-size: 20rpx; }
.team-member > text { color: #0c7464; font-size: 20rpx; font-weight: 600; }
.remind-button { min-width: 90rpx; padding: 10rpx 13rpx; border-radius: 999rpx; color: #fff; background: #16a085; font-size: 19rpx; text-align: center; }
.remind-button.sent { color: #0c7464; background: #eaf8f4; }
.team-invite-code { display: flex; align-items: center; justify-content: space-between; margin-top: 7rpx; padding: 15rpx 16rpx; border-radius: 17rpx; color: #646a73; font-size: 21rpx; background: #f6f8f8; }
.team-invite-code text:last-child { color: #0c7464; font-weight: 700; letter-spacing: 1rpx; }
.social-empty { padding: 25rpx 20rpx; border: 1rpx dashed #b9d8d0; border-radius: 22rpx; background: #f8fcfb; text-align: center; }
.social-empty__icon { display: flex; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; margin: 0 auto 15rpx; border-radius: 22rpx; color: #0c7464; background: #eaf8f4; font-size: 26rpx; font-weight: 700; }
.social-empty__icon--buddy { color: #6c6292; background: #f0ecfb; }
.social-empty .form-title { display: block; margin-bottom: 7rpx; }
.social-empty > text:not(.form-title) { display: block; color: #646a73; font-size: 21rpx; line-height: 1.55; }
.primary-button { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 78rpx; margin-top: 18rpx; border-radius: 18rpx; color: #fff; background: #16a085; font-size: 23rpx; font-weight: 700; text-align: center; }
.team-code-form { display: grid; margin-top: 12rpx; padding: 7rpx; grid-template-columns: 1fr 104rpx; gap: 7rpx; border: 1rpx solid #ebeef2; border-radius: 17rpx; background: #fff; }
.team-code-form input { min-height: 62rpx; padding: 0 13rpx; color: #1f2329; font-size: 21rpx; }
.team-code-form button { display: flex; align-items: center; justify-content: center; border-radius: 13rpx; color: #fff; background: #16a085; font-size: 21rpx; }
.text-button { color: #0c7464; font-size: 21rpx; }
.companion-demo-button { display: block; width: 100%; margin-top: 10rpx; text-align: center; }
.buddy-cycle { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14rpx; color: #646a73; font-size: 21rpx; }
.buddy-cycle > view { display: flex; gap: 7rpx; }
.buddy-cycle button { padding: 9rpx 17rpx; border-radius: 999rpx; color: #646a73; background: #f3f5f5; font-size: 20rpx; }
.buddy-cycle button.active { color: #0c7464; font-weight: 700; background: #eaf8f4; }
.buddy-card { padding: 22rpx; border: 1rpx solid #d9d2ed; border-radius: 22rpx; background: linear-gradient(145deg, #f8f6fd, #fff); }
.buddy-card__head { display: grid; grid-template-columns: 68rpx 1fr 68rpx; align-items: center; gap: 12rpx; }
.buddy-avatar { display: flex; align-items: center; justify-content: center; width: 68rpx; height: 68rpx; border: 4rpx solid #fff; border-radius: 50%; color: #0c7464; background: #eaf8f4; font-size: 22rpx; font-weight: 700; }
.buddy-avatar--friend { color: #6c6292; background: #ece8f7; }
.buddy-link { text-align: center; }
.buddy-link text { display: block; color: #1f2329; font-size: 22rpx; font-weight: 700; }
.buddy-link text:last-child { margin-top: 4rpx; color: #646a73; font-size: 18rpx; font-weight: 400; }
.buddy-status { display: grid; margin-top: 18rpx; grid-template-columns: 1fr 1fr; gap: 9rpx; }
.buddy-status view { padding: 14rpx; border-radius: 16rpx; color: #646a73; background: #f4f5f6; text-align: center; }
.buddy-status view.done { color: #0c7464; background: #eaf8f4; }
.buddy-status text { display: block; font-size: 19rpx; }
.buddy-status text:first-child { margin-bottom: 4rpx; color: #1f2329; font-weight: 700; }
.buddy-remind { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 66rpx; margin-top: 13rpx; border-radius: 16rpx; color: #fff; background: #16a085; font-size: 21rpx; font-weight: 600; text-align: center; }
.buddy-remind.sent { color: #0c7464; background: #eaf8f4; }
.team-boundary { margin-top: 15rpx; padding: 17rpx 19rpx; border-radius: 18rpx; color: #646a73; font-size: 20rpx; line-height: 1.5; background: #f4f7f8; }
.team-boundary text { display: block; }
.team-boundary text:first-child { margin-bottom: 5rpx; color: #1f2329; font-weight: 700; }

/* corMem 卡片与字体规范 */
.knowledge-companion { padding: 24rpx 24rpx 8rpx; }
.companion-entry-grid { padding: 16rpx 8rpx; border: 0; border-radius: 24rpx; }
.knowledge-companion:not(.knowledge-companion--entry) .companion-entry-grid { margin-top: 0; }
.companion-entry-grid > button { min-height: 144rpx; }.companion-entry-grid button > text:nth-child(2) { font-size: 24rpx; }.companion-entry-grid button > text:last-child { font-size: 20rpx; }
.knowledge-social-panel { margin-top: 24rpx; }.team-hero,.team-members,.social-empty,.buddy-card { border-radius: 24rpx; }.team-name { font-size: 30rpx; }.team-meta,.team-progress-copy,.buddy-cycle { font-size: 24rpx; }.form-title { font-size: 28rpx; }.team-member { min-height: 88rpx; }.team-member > view:nth-child(2) text { font-size: 26rpx; }.team-member > view:nth-child(2) text:last-child { font-size: 22rpx; }
.primary-button { min-height: 88rpx; border-radius: 16rpx; background: #0ea5a4; font-size: 28rpx; }.buddy-remind { min-height: 72rpx; border-radius: 16rpx; background: #0ea5a4; font-size: 26rpx; }.team-boundary { padding: 20rpx 24rpx; border-radius: 16rpx; font-size: 22rpx; background: #f1f5f9; }
</style>
