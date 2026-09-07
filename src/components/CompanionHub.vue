<template>
  <view class="knowledge-companion" :class="{ 'knowledge-companion--entry': entryOnly, 'knowledge-companion--detail': !entryOnly }" data-testid="knowledge-companions">
    <view v-if="entryOnly" class="knowledge-community" data-testid="region-knowledge-community">
      <view class="community-heading"><text>康复圈</text><text>互相鼓励，一起进步</text></view>
      <button :disabled="disabled" :aria-disabled="disabled ? 'true' : 'false'" data-testid="knowledge-team-entry" class="community-entry" @tap="open('team')">
        <image src="/static/replica-v7/team-people.png" mode="aspectFill" /><view><text>健康小队</text><text>{{ teamJoined ? teamCheckedCount + '/' + teamMembers.length + ' 已打卡' : '和亲友一起，温和地坚持运动' }}</text></view><text>{{ disabled ? '暂未开放' : '去看看' }}</text>
      </button>
      <button :disabled="disabled" :aria-disabled="disabled ? 'true' : 'false'" data-testid="knowledge-buddy-entry" class="community-entry" @tap="open('buddy')">
        <image src="/static/replica-v7/buddy-pair.png" mode="aspectFill" /><view><text>健康搭子</text><text>{{ buddyState.connected ? '陪伴第 ' + buddyDay + ' 天' : '找一位同行者，彼此鼓励' }}</text></view><text>{{ disabled ? '暂未开放' : '去看看' }}</text>
      </button>
      <text class="community-streak">连续同行 {{ streak }} 天 · {{ companionSummary }}</text>
    </view>
    <view v-else class="companion-entry-grid">
      <button :class="{ active: activeTab === 'buddy', unavailable: disabled }" :disabled="disabled" :aria-disabled="disabled ? 'true' : 'false'" data-testid="knowledge-buddy-entry" @tap="open('buddy')"><view class="companion-entry-icon companion-entry-icon--buddy">伴</view><text>健康搭子</text><text>{{ disabled ? '暂未开放' : buddyState.connected ? '陪伴第 ' + buddyDay + ' 天' : '找一位同行者' }}</text></button>
      <button :class="{ active: activeTab === 'team', unavailable: disabled }" :disabled="disabled" :aria-disabled="disabled ? 'true' : 'false'" data-testid="knowledge-team-entry" @tap="open('team')"><view class="companion-entry-icon">队</view><text>健康小队</text><text>{{ disabled ? '暂未开放' : teamJoined ? teamCheckedCount + '/' + teamMembers.length + ' 已打卡' : '组队打卡' }}</text></button>
    </view>

    <view v-if="!entryOnly && activeTab === 'team'" class="social-panel knowledge-social-panel" data-testid="team-panel">
      <template v-if="teamJoined">
        <view class="team-hero team-hero--embedded"><image class="team-people-art" src="/static/replica-v7/team-people.png" mode="aspectFit" /><view class="team-avatar-stack"><view>我</view><view>康</view><view>动</view><view>+2</view></view><text class="team-name">{{ teamState.name }}</text><text class="team-meta">{{ teamMembers.length }} 人 · 今日 {{ teamCheckedCount }} 人已打卡</text><view class="team-progress"><view :style="{ width: teamProgress + '%' }" /></view><text class="team-progress-copy">今日共同完成 {{ teamProgress }}%</text></view>
        <view class="team-members"><text class="form-title">队伍成员</text><view v-for="member in teamMembers" :key="member.id" class="team-member"><view><image :src="memberArtwork(member.id)" mode="aspectFit" /></view><view><text>{{ member.name }}</text><text>{{ member.status }}</text></view><button v-if="!member.self && member.status === '今日待打卡'" class="remind-button" :class="{ sent: teamState.reminderDates[member.id] === todayKey }" @tap="emit('remindTeam', member.id)">{{ teamState.reminderDates[member.id] === todayKey ? '已提醒' : '提醒TA' }}</button><text v-else>{{ member.streak }}天</text></view><view class="team-invite-code"><text>邀请亲友加入</text><text>{{ teamState.inviteCode }}</text><button data-testid="copy-team-code" @tap="copyInviteCode">{{ copied ? '已复制' : '复制' }}</button></view></view>
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
        <view class="buddy-card"><view class="buddy-card__head"><view class="buddy-link"><text>健康搭子</text><text>第 {{ buddyDay }} / {{ buddyState.cycleDays }} 天</text></view><view class="buddy-people"><image src="/static/replica-v7/buddy-pair.png" mode="aspectFit" /><text>♥</text></view><view class="buddy-names"><text>我</text><text>{{ buddyState.buddyName }}</text></view><text class="buddy-principle">互相提醒，彼此鼓励，让坚持更轻松</text></view><view class="buddy-status"><view :class="{ done: checkInDone }"><text class="buddy-status-icon">{{ checkInDone ? '✓' : '◷' }}</text><text>我</text><text>{{ checkInDone ? '今日已打卡' : '今日待打卡' }}</text></view><view><text class="buddy-status-icon">◷</text><text>{{ buddyState.buddyName }}</text><text>今日待打卡</text></view></view><button class="buddy-remind" :class="{ sent: buddyState.reminderSentDate === todayKey }" @tap="emit('remindBuddy')">{{ buddyState.reminderSentDate === todayKey ? '今天已温和提醒' : '提醒搭子完成今天的行动' }}</button></view>
      </template>
      <view v-else class="social-empty"><view class="social-empty__icon social-empty__icon--buddy">伴</view><text class="form-title">找一位健康搭子互相陪伴</text><text>漏打卡不会解除关系，也不会扣除积分。</text><button class="primary-button" data-testid="connect-buddy" @tap="emit('connectBuddy')">体验演示配对</button></view>
    </view>

    <view v-if="!entryOnly && activeTab !== 'none'" class="team-boundary"><text>温和陪伴原则</text><text>不按运动量、体重、心率或康复指标排名；提醒仅为本地原型，不会发送真实消息。</text></view>
  </view>
</template>

<script setup lang="ts">
function memberArtwork(id:string){const index=({self:0,kang:1,dong:2,lin:3} as Record<string,number>)[id]??4;return '/static/replica-v7/team-person-'+index+'.png'}
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
  disabled?: boolean
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
const copied = ref(false)
function copyInviteCode() {
  uni.setClipboardData({data:props.teamState.inviteCode, success:()=>{copied.value=true}, fail:()=>{uni.showToast({title:'可长按邀请码手动复制',icon:'none'})}})
}
const companionSummary = computed(() => props.buddyState.connected ? `和${props.buddyState.buddyName}一起完成今天的健康行动` : props.teamJoined ? `${props.teamMembers.length} 人小队正在互相陪伴` : '找一个人或一群人，温和地坚持运动')
function open(tab: 'team' | 'buddy') { if (props.disabled) return; emit('update:activeTab', tab); emit('openSocial', tab) }
</script>

<style scoped lang="scss">
.knowledge-community { padding: 26rpx 24rpx 20rpx; border-radius: 34rpx; background: #fff; box-shadow: var(--shadow-card); }
.community-heading { display: flex; align-items: baseline; gap: 14rpx; margin-bottom: 12rpx; }
.community-heading > text:first-child { color: #184839; font-size: 31rpx; font-weight: 750; }
.community-heading > text:last-child { color: #61786d; font-size: 23rpx; }
.community-entry { display: grid; width: 100%; grid-template-columns: 84rpx minmax(0,1fr) auto; gap: 16rpx; padding: 17rpx 0; align-items: center; border-bottom: 1rpx solid #edf4ef; background: #fff; text-align: left; line-height: 1.5; }
.community-entry > image { width: 84rpx; height: 84rpx; border-radius: 50%; background: #e5f7ed; }
.community-entry > view > text { display: block; }
.community-entry > view > text:first-child { color: #153e31; font-size: 28rpx; font-weight: 700; }
.community-entry > view > text:last-child { margin-top: 7rpx; color: #567763; font-size: 23rpx; line-height: 1.5; }
.community-entry > text { padding: 10rpx 12rpx; border-radius: 999rpx; background: #e7f7ef; color: #2b9175; font-size: 23rpx; }
.community-entry[disabled] { background: #fff; opacity: 1; }
.community-entry[disabled] > text { color: #7a9789; background: #edf5f0; }
.community-streak { display: block; margin-top: 15rpx; color: #5e7a6a; font-size: 23rpx; line-height: 1.5; }
.companion-hero {
  position: relative;
  display: flex;
  min-height: 200rpx;
  padding: 26rpx 28rpx 50rpx;
  overflow: hidden;
  align-items: center;
  justify-content: space-between;
  color: #24443e;
  box-shadow: none;
  background: linear-gradient(120deg,#d6f4e8,#f3fcf8);
  border-radius: 34rpx;
}
.companion-hero text {
  display: block;
}
.companion-hero > view:first-child {
  position: relative;
  z-index: 2;
  max-width: 64%;
}
.companion-hero > view:first-child > text:first-child {
  color: #66817b;
  font-size: 23rpx;
  font-weight: 650;
}
.companion-hero > view:first-child > view {
  display: flex;
  margin-top: 2rpx;
  align-items: baseline;
  gap: 5rpx;
}
.companion-hero > view:first-child > view text:first-child {
  color: #1e6f60;
  font-size: 56rpx;
  font-weight: 780;
  line-height: 1;
}
.companion-hero > view:first-child > view text:last-child {
  color: #65837b;
  font-size: 23rpx;
}
.companion-hero > view:first-child > text:last-child {
  margin-top: 10rpx;
  color: #617a74;
  font-size: 23rpx;
  line-height: 1.45;
}
.companion-hero__art {
  position: absolute;
  right: 4rpx;
  bottom: 18rpx;
  width: 190rpx;
  height: 180rpx;
}
.companion-hero__art image {
  position: absolute;
  right: -8rpx;
  bottom: -5rpx;
  width: 174rpx;
  height: 164rpx;
}
.companion-heart {
  position: absolute;
  top: 4rpx;
  left: 0;
  display: flex;
  width: 52rpx;
  height: 52rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #6db9a8;
  background: rgba(255,255,255,.72);
  font-size: 25rpx;
}
.companion-entry-grid > button::after {
  border: 0;
}
.companion-entry-grid > button:first-child {
  border-left: 0;
}
.companion-entry-grid > button.active {
  border-color: transparent;
  background: #fbfefd;
}
.companion-entry-grid > button.unavailable {
  background: #fff;
  opacity: 1;
  pointer-events: none;
  cursor: not-allowed;
}
.companion-entry-grid > button.unavailable > text:last-child {
  color: var(--color-text-tertiary);
}
.companion-entry-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62rpx;
  height: 62rpx;
  border-radius: 19rpx;
  color: #36806e;
  background: #e6f6ed;
  font-size: 23rpx;
  font-weight: 700;
}
.companion-entry-icon--buddy {
  color: #11876d;
  background: #e3f7ee;
}
.companion-entry-icon--checkin {
  color: #9b7310;
  background: #fff5d5;
}
.companion-entry-grid .companion-entry-icon {
  grid-row: 1 / 3;
}
.team-hero {
  border-radius: var(--radius-card);

  position: relative;
  overflow: hidden;
  min-height: 330rpx;
  padding: 35rpx;
  border: 2rpx solid #fff;
  background: linear-gradient(120deg,#def5e8,#f4fcf8);
}
.team-avatar-stack {
  margin-bottom: 16rpx;
  padding-left: 12rpx;

  display: none;
}
.team-avatar-stack view {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62rpx;
  height: 62rpx;
  margin-left: -12rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  color: #0c7464;
  font-size: 23rpx;
  font-weight: 700;
  background: #d7f2ea;
}
.team-avatar-stack view:nth-child(2) {
  background: #e8efff;
}
.team-avatar-stack view:nth-child(3) {
  background: #fff0db;
}
.team-avatar-stack view:nth-child(4) {
  color: #646a73;
  background: #f1f3f5;
}
.team-name, .team-meta, .team-progress-copy {
  display: block;
}
.team-meta {
  color: #646a73;
  font-size: 23rpx;

  margin-top: 20rpx;
  max-width: 58%;
  line-height: 1.6;
}
.team-progress {
  overflow: hidden;
  border-radius: 999rpx;

  position: relative;
  margin-top: 110rpx;
  height: 16rpx;
  background: #cbe4d8;
}
.team-progress view {
  height: 100%;
  border-radius: inherit;
  background: #16a085;
}
.team-progress-copy {
  margin-top: 8rpx;
  color: #0c7464;

  position: relative;
  font-size: 25rpx;
  font-weight: 650;
}
.team-members {
  margin-top: 14rpx;
  padding: 20rpx;
  border: 1rpx solid #ebeef2;
  border-radius: 22rpx;
  background: #fff;
}
.team-member > view:first-child {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  color: #0c7464;
  font-size: 23rpx;
  background: #eaf8f4;
}
.team-member > text {
  color: #0c7464;
  font-size: 23rpx;
  font-weight: 600;
}
.remind-button {
  min-width: 92rpx;
  padding: 10rpx 13rpx;
  border-radius: 999rpx;
  color: #fff;
  background: var(--color-brand-pressed);
  font-size: 23rpx;
  text-align: center;
}
.remind-button.sent {
  color: #0c7464;
  background: #eaf8f4;
}
.team-invite-code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 7rpx;
  padding: 15rpx 16rpx;
  border-radius: 17rpx;
  color: #646a73;
  font-size: 23rpx;
  background: #f6f8f8;
}
.team-invite-code text:last-child {
  color: #0c7464;
  font-weight: 700;
  letter-spacing: 1rpx;
}
.social-empty {
  padding: 25rpx 20rpx;
  border: 1rpx dashed #b9d8d0;
  border-radius: 22rpx;
  background: #f8fcfb;
  text-align: center;
}
.social-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin: 0 auto 15rpx;
  border-radius: 22rpx;
  color: #0c7464;
  background: #eaf8f4;
  font-size: 26rpx;
  font-weight: 700;
}
.social-empty__icon--buddy {
  color: #6c6292;
  background: #f0ecfb;
}
.social-empty .form-title {
  display: block;
  margin-bottom: 7rpx;
}
.social-empty > text:not(.form-title) {
  display: block;
  color: #646a73;
  font-size: 23rpx;
  line-height: 1.55;
}
.team-code-form {
  display: grid;
  margin-top: 12rpx;
  padding: 7rpx;
  grid-template-columns: 1fr 104rpx;
  gap: 7rpx;
  border: 1rpx solid #ebeef2;
  border-radius: 17rpx;
  background: #fff;
}
.team-code-form input {
  min-height: 92rpx;
  padding: 0 13rpx;
  color: #1f2329;
  font-size: 23rpx;
}
.team-code-form button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13rpx;
  color: #fff;
  background: var(--color-brand-pressed);
  font-size: 23rpx;
}
.text-button {
  color: #0c7464;
  font-size: 23rpx;
}
.companion-demo-button {
  display: block;
  width: 100%;
  margin-top: 10rpx;
  text-align: center;
}
.buddy-cycle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
  color: #646a73;
  font-size: 23rpx;
}
.buddy-cycle > view {
  display: flex;
  gap: 7rpx;
}
.buddy-cycle button {
  padding: 9rpx 17rpx;
  border-radius: 999rpx;
  color: #646a73;
  background: #f3f5f5;
  font-size: 23rpx;
}
.buddy-cycle button.active {
  color: #0c7464;
  font-weight: 700;
  background: #eaf8f4;
}
.buddy-card {
  border-radius: 22rpx;

  padding: 0;
  border: 0;
  background: transparent;
}
.buddy-card__head {
  grid-template-columns: 68rpx 1fr 68rpx;
  align-items: center;
  gap: 12rpx;

  display: flex;
  flex-direction: column;
  padding: 34rpx 22rpx;
  border-radius: 35rpx;
  background: linear-gradient(130deg,#fff,#ebf9f1);
  box-shadow: var(--shadow-card);
}
.buddy-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  color: #0c7464;
  background: #eaf8f4;
  font-size: 23rpx;
  font-weight: 700;
}
.buddy-avatar--friend {
  color: #6c6292;
  background: #ece8f7;
}
.buddy-link {
  text-align: center;
}
.buddy-link text {
  display: block;
  font-weight: 700;

  font-size: 40rpx;
  color: #0b4837;
}
.buddy-link text:last-child {
  font-weight: 400;

  font-size: 30rpx;
  margin-top: 18rpx;
  color: #658573;
}
.buddy-status {
  display: grid;
  grid-template-columns: 1fr 1fr;

  margin-top: 24rpx;
  gap: 22rpx;
}
.buddy-status view {
  color: #646a73;
  text-align: center;

  padding: 28rpx;
  border-radius: 32rpx;
  background: #fff;
  min-height: 205rpx;
  border: 1rpx solid #daede0;
}
.buddy-status view.done {
  color: #0c7464;
  background: #eaf8f4;
}
.buddy-status text {
  display: block;

  font-size: 28rpx;
  line-height: 1.6;
}
.buddy-status text:first-child {
  margin-bottom: 4rpx;
  color: #1f2329;
  font-weight: 700;
}
.buddy-remind.sent {
  color: #0c7464;
  background: #eaf8f4;
}
.team-boundary text {
  display: block;
}
.team-boundary text:first-child {
  margin-bottom: 5rpx;
  color: #1f2329;
  font-weight: 700;
}

/* corMem 卡片与字体规范 */
.knowledge-companion {
  background: var(--color-page);
  margin: 0;
  padding: 24rpx 24rpx 8rpx;
}
.knowledge-companion.knowledge-companion--entry { padding: 0; background: transparent; }
.companion-entry-grid {
  box-shadow: 0 12rpx 30rpx rgba(30,75,65,.09);
  background: #fff;
  gap: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: -32rpx;
  display: grid;
  z-index: 3;
  position: relative;
  padding: 16rpx 8rpx;
  border: 0;
  border-radius: var(--radius-card);
}
.knowledge-companion:not(.knowledge-companion--entry) .companion-entry-grid {
  margin-top: 0;
}
.companion-entry-grid > button {
  text-align: left;
  background: #fff;
  border-left: 1rpx solid #edf1f0;
  column-gap: 14rpx;
  align-items: center;
  align-content: center;
  grid-template-rows: auto auto;
  grid-template-columns: 62rpx 1fr;
  padding: 16rpx 18rpx;
  min-width: 0;
  display: grid;
  min-height: 144rpx;
}
.companion-entry-grid button > text:nth-child(2) {
  font-weight: 700;
  color: #1f2329;
  font-size: 24rpx;
}
.companion-entry-grid button > text:last-child {
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #68736f;
  overflow: hidden;
  font-size: 23rpx;
}
.knowledge-social-panel {
  margin-top: 24rpx;
}
.team-hero,.team-members,.social-empty,.buddy-card {
  border-radius: var(--radius-card);
}
.team-name {
  font-weight: 700;
  color: #1f2329;
  font-size: 30rpx;
}
.team-meta,.team-progress-copy,.buddy-cycle {
  font-size: 24rpx;
}
.form-title {
  font-weight: 700;
  color: #1f2329;
  font-size: 28rpx;
}
.team-member {
  border-top: 1rpx solid #ebeef2;
  align-items: center;
  padding: 14rpx 0;
  display: grid;

  min-height: 118rpx;
  grid-template-columns: 72rpx 1fr auto;
  gap: 18rpx;
}
.team-member > view:nth-child(2) text {
  color: #1f2329;
  display: block;
  font-size: 26rpx;
}
.team-member > view:nth-child(2) text:last-child {
  color: #646a73;
  margin-top: 3rpx;
  font-size: 23rpx;
}
.primary-button {
  text-align: center;
  font-weight: 700;
  color: #fff;
  margin-top: 18rpx;
  width: 100%;
  justify-content: center;
  align-items: center;
  display: flex;
  min-height: 92rpx;
  border-radius: 16rpx;
  background: var(--color-brand);
  font-size: 28rpx;
}
.buddy-remind {
  text-align: center;
  font-weight: 600;
  color: #fff;
  margin-top: 13rpx;
  width: 100%;
  justify-content: center;
  align-items: center;
  display: flex;
  min-height: 92rpx;
  border-radius: 16rpx;
  background: var(--color-brand-pressed);
  font-size: 26rpx;
}
.team-boundary {
  line-height: 1.5;
  color: #646a73;
  margin-top: 15rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  font-size: 23rpx;
  background: #edf6f1;
}

.knowledge-companion--detail .companion-entry-grid{display:flex;margin:0 0 16rpx;padding:5rpx;background:#e6f5ed;border-radius:999rpx;box-shadow:none}
.knowledge-companion--detail .companion-entry-grid>button{display:flex;flex:1;min-height: 92rpx;align-items:center;justify-content:center;padding:10rpx;border:0;border-radius:999rpx;gap:0;background:transparent}
.knowledge-companion--detail .companion-entry-grid>button.active{background:#fff;color:#007c62;box-shadow:0 3rpx 12rpx #236d4c0d}
.knowledge-companion--detail .companion-entry-grid>button>text:nth-of-type(2),.knowledge-companion--detail .companion-entry-icon{display:none}
.team-people-art{position:absolute;right:-8rpx;top:25rpx;width:350rpx;height:240rpx}
.team-hero .team-name{position:relative;max-width:68%;font-size:34rpx;line-height:1.4}
.team-invite-code button{padding:12rpx 23rpx;border:1rpx solid #81c2a2;border-radius:999rpx;color:#087450;font-size:25rpx}
.buddy-people{position:relative;width:100%;height:285rpx;margin-top:15rpx}
.buddy-people image{width:100%;height:100%}
.buddy-people>text{position:absolute;left:calc(50% - 31rpx);top:55%;display:flex;width:62rpx;height:62rpx;align-items:center;justify-content:center;border:7rpx solid #fff;border-radius:50%;background:#d1f3df;color:#007650;font-size:36rpx}
.buddy-names{display:flex;justify-content:space-around;width:100%;font-size:32rpx;font-weight:750;color:#124f39}
.buddy-principle{display:block;margin-top:22rpx;padding:15rpx;border-radius:20rpx;background:#e2f5e9;color:#48755b;font-size:24rpx;line-height:1.6}
.buddy-status .buddy-status-icon{display:flex;width:66rpx;height:66rpx;align-items:center;justify-content:center;margin:0 auto 14rpx;border-radius:50%;background:#d8f1e3;color:#119c6d;font-size:40rpx}
.buddy-status .done .buddy-status-icon{background:var(--gradient-brand);color:#fff}
.knowledge-companion--detail .buddy-remind{margin-top:25rpx;min-height: 92rpx;border-radius:999rpx;font-size:28rpx}
.knowledge-companion--detail .buddy-cycle{justify-content:center;padding:0 0 22rpx}
.knowledge-companion--detail .buddy-cycle>text{display:none}
.knowledge-companion--detail .buddy-cycle button{min-width:165rpx;min-height: 92rpx;font-size:29rpx}
.knowledge-companion--detail .buddy-cycle button.active{color:#fff;background:var(--gradient-brand)}
.knowledge-companion--detail .remind-button{min-height: 92rpx;min-width:100rpx;font-size:24rpx}
.knowledge-companion--detail .team-boundary{margin-top:26rpx;border-radius:30rpx;padding:27rpx;font-size:25rpx;line-height:1.7;background:#e8f7ee}
</style>
<style scoped lang="scss">
.team-hero,.team-members,.buddy-card,.buddy-card__head,.knowledge-social-panel,.buddy-cycle{background:#fff}.team-hero{border:0;border-radius:30rpx;overflow:hidden}.team-people-art{right:0;top:12rpx;width:55%;height:245rpx}.team-hero .team-name{max-width:54%;font-size:31rpx}.team-member>view:first-child{width:76rpx;height:82rpx;border-radius:50%;background:#fff;overflow:hidden}.team-member>view:first-child>image{width:100%;height:100%}.buddy-people{height:310rpx}.buddy-people>text{display:none}.team-avatar-stack{visibility:hidden}.team-members,.buddy-card{border-radius:30rpx}.buddy-card__head{border-radius:30rpx}.buddy-status>view{background:#f4f7f7}.buddy-status>view.done{background:#edf7f4}.community-entry>image{object-fit:contain}.knowledge-companion--detail{background:transparent}
</style>
