<template>
  <view class="form-card">
    <text class="form-title">{{ title }}</text>
    <view class="vital-grid">
      <label>
        <text>收缩压</text>
        <view><input :value="vitals.sbp" type="number" @input="setValue('sbp', $event)" /><text class="small-text">mmHg</text></view>
      </label>
      <label>
        <text>舒张压</text>
        <view><input :value="vitals.dbp" type="number" @input="setValue('dbp', $event)" /><text class="small-text">mmHg</text></view>
      </label>
      <label>
        <text>心率</text>
        <view><input :value="vitals.hr" type="number" @input="setValue('hr', $event)" /><text class="small-text">次/分</text></view>
      </label>
      <label>
        <text>血氧</text>
        <view><input :value="vitals.spo2" type="number" @input="setValue('spo2', $event)" /><text class="small-text">%</text></view>
      </label>
    </view>
    <text class="field-label">主观用力感（Borg 0–10）</text>
    <slider :value="vitals.borg" min="0" max="10" step="1" activeColor="#16A085" backgroundColor="#ddf6ee" show-value @change="setBorg" />
    <text class="source-note">当前数值为原型默认值，可手动修改；设备接入为预留能力。</text>
  </view>
</template>

<script setup lang="ts">
type VitalKey = 'sbp' | 'dbp' | 'hr' | 'spo2'
interface Vitals {
  sbp: string
  dbp: string
  hr: string
  spo2: string
  borg: number
}

const props = defineProps<{ title: string; vitals: Vitals }>()

function setValue(key: VitalKey, event: any) {
  props.vitals[key] = event.detail.value
}

function setBorg(event: any) {
  props.vitals.borg = event.detail.value
}
</script>

<style scoped>
.form-card {
  margin-bottom: 18rpx;
  padding: 24rpx;
  border: 1rpx solid #ebeef2;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: none;
}
.form-title,
.field-label,
.source-note { display: block; }
.form-title {
  margin-bottom: 19rpx;
  color: #1f2329;
  font-size: 28rpx;
  font-weight: 600;
}
.vital-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}
.vital-grid label {
  display: block;
  padding: 17rpx;
  border-radius: 18rpx;
  background: #f8f8fa;
}
.vital-grid label > text {
  display: block;
  color: #646a73;
  font-size: 22rpx;
}
.vital-grid label > view {
  display: flex;
  align-items: flex-end;
  margin-top: 5rpx;
}
.vital-grid input {
  width: 100rpx;
  height: 54rpx;
  color: #1f2329;
  font-size: 30rpx;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.vital-grid .small-text { color: #646a73; font-size: 22rpx; }
.field-label {
  margin: 20rpx 0 12rpx;
  color: #4f4b57;
  font-size: 24rpx;
  font-weight: 700;
}
.source-note {
  margin-top: 12rpx;
  color: #8f959e;
  font-size: 24rpx;
  line-height: 1.5;
}
</style>
