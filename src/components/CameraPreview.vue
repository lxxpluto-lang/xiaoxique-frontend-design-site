<template>
  <!-- @vue-ignore -->
  <view class="camera-preview" :data-state="state" :camera-active="active" :change:camera-active="cameraRuntime.toggle">
    <!-- #ifdef MP-WEIXIN -->
    <camera
      v-if="active"
      class="native-camera"
      device-position="front"
      flash="off"
      @error="onNativeError"
      @initdone="onNativeReady"
    />
    <!-- #endif -->

    <!-- #ifndef MP-WEIXIN -->
    <view class="h5-camera-mount" />
    <!-- #endif -->

    <view v-if="!active" class="camera-placeholder" aria-hidden="true">
      <view class="placeholder-person"><view /><view /></view>
      <text>后退至全身可见</text>
    </view>

    <view class="camera-shade" />
    <view v-if="active" class="body-guide" aria-hidden="true"><text>全身入镜区域</text></view>
    <view v-if="active" class="skeleton" aria-hidden="true">
      <view class="joint joint-head" />
      <view class="bone bone-body" />
      <view class="bone bone-arm-left" />
      <view class="bone bone-arm-right" />
      <view class="bone bone-leg-left" />
      <view class="bone bone-leg-right" />
      <view class="joint joint-hip" />
    </view>

    <view v-if="active || state === 'denied'" class="camera-status">
      <text class="status-dot" :class="`status-dot--${state}`" />
      <text>{{ statusText }}</text>
    </view>

    <button
      v-if="!active"
      class="camera-button"
      data-action="ACT-CAMERA-ENABLE"
      data-ac="AC-CAMERA-001"
      @tap="enableCamera"
    >
      开启摄像头
    </button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const active = ref(false)
const state = ref<'idle' | 'requesting' | 'ready' | 'denied'>('idle')

const statusText = computed(() => ({
  idle: '摄像头尚未开启',
  requesting: '正在申请摄像头权限',
  ready: '摄像头已开启 · 评分为演示结果',
  denied: '无法使用摄像头，已切换演示画面',
}[state.value]))

const emit = defineEmits<{
  (event: 'status', value: 'idle' | 'requesting' | 'ready' | 'denied'): void
}>()

function enableCamera() {
  state.value = 'requesting'
  active.value = true
  emit('status', state.value)
  // 微信由 camera 组件回调；H5 由 renderjs 回调。
}

function markReady() {
  state.value = 'ready'
  emit('status', state.value)
}

function markDenied() {
  state.value = 'denied'
  active.value = false
  emit('status', state.value)
}

function onNativeReady() {
  markReady()
}

function onNativeError() {
  markDenied()
}

defineExpose({ markReady, markDenied })
</script>

<script module="cameraRuntime" lang="renderjs">
const cameraStore = new Map()

export default {
  beforeDestroy() {
    this.stopCamera()
  },
  methods: {
    stopCamera() {
      const activeStream = cameraStore.get('stream')
      if (activeStream) {
        for (const track of activeStream.getTracks()) track.stop()
      }
      cameraStore.delete('stream')
    },
    async toggle(value = false) {
      if (!value) {
        this.stopCamera()
        return
      }
      try {
        const mount = this.$el.querySelector('.h5-camera-mount')
        if (!mount || !navigator.mediaDevices?.getUserMedia) throw new Error('camera unavailable')
        this.stopCamera()
        mount.innerHTML = ''
        const video = document.createElement('video')
        video.setAttribute('autoplay', '')
        video.setAttribute('muted', '')
        video.setAttribute('playsinline', '')
        video.style.width = '100%'
        video.style.height = '100%'
        video.style.objectFit = 'cover'
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        cameraStore.set('stream', stream)
        video.srcObject = stream
        mount.appendChild(video)
        // @ts-ignore $ownerInstance is injected by uni-app renderjs
        const owner = this.$ownerInstance
        if (owner) owner.callMethod('markReady')
      } catch (error) {
        // @ts-ignore $ownerInstance is injected by uni-app renderjs
        const owner = this.$ownerInstance
        if (owner) owner.callMethod('markDenied')
      }
    },
  },
}
</script>

<style scoped>
.camera-preview,
.native-camera,
.h5-camera-mount,
.camera-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.camera-preview {
  overflow: hidden;
  background: #243441;
}

.camera-shade {
  background: linear-gradient(180deg, rgba(20, 35, 43, 0.08), rgba(15, 32, 40, 0.58));
}

.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16rpx;
  color: rgba(255, 255, 255, 0.74);
  background: radial-gradient(circle at 50% 38%, #52766f 0, #2f514c 38%, #203b37 100%);
  font-size: 18rpx;
}

.placeholder-person {
  position: relative;
  width: 96rpx;
  height: 210rpx;
  border: 3rpx solid rgba(156, 229, 214, 0.72);
  border-radius: 52rpx 52rpx 28rpx 28rpx;
}

.placeholder-person view:first-child {
  position: absolute;
  top: -46rpx;
  left: 50%;
  width: 48rpx;
  height: 48rpx;
  border: 3rpx solid rgba(156, 229, 214, 0.72);
  border-radius: 50%;
  transform: translateX(-50%);
}

.placeholder-person view:last-child {
  position: absolute;
  left: -40rpx;
  right: -40rpx;
  top: 78rpx;
  height: 3rpx;
  background: rgba(156, 229, 214, 0.72);
}

.body-guide {
  position: absolute;
  inset: 76rpx 20rpx 46rpx;
  z-index: 1;
  border: 2rpx dashed rgba(124, 231, 211, 0.76);
  border-radius: 76rpx 76rpx 32rpx 32rpx;
  box-shadow: inset 0 0 30rpx rgba(70, 205, 181, 0.08);
}

.body-guide text {
  position: absolute;
  top: -28rpx;
  left: 50%;
  color: rgba(255, 255, 255, 0.9);
  font-size: 17rpx;
  white-space: nowrap;
  transform: translateX(-50%);
}

.camera-status {
  position: absolute;
  top: 18rpx;
  left: 18rpx;
  right: 18rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  color: #fff;
  background: rgba(18, 35, 43, 0.66);
  font-size: 22rpx;
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #b6c0c5;
}

.status-dot--ready { background: #6dd7a9; }
.status-dot--requesting { background: #f3c86c; }
.status-dot--denied { background: #ff8a7a; }

.camera-button {
  position: absolute;
  left: 50%;
  bottom: 34rpx;
  min-width: 210rpx;
  padding: 18rpx 28rpx;
  border: 0;
  border-radius: 999rpx;
  color: #fff;
  background: #6f5aa8;
  font-size: 24rpx;
  font-weight: 700;
  transform: translateX(-50%);
}

.camera-button::after { border: 0; }

.skeleton {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 50%;
  width: 210rpx;
  height: 410rpx;
  transform: translate(-50%, -46%);
  filter: drop-shadow(0 0 10rpx rgba(108, 235, 218, 0.62));
}

.joint,
.bone {
  position: absolute;
  background: #63e0cd;
}

.joint { width: 20rpx; height: 20rpx; border-radius: 50%; }
.joint-head { left: 94rpx; top: 8rpx; width: 30rpx; height: 30rpx; }
.joint-hip { left: 98rpx; top: 216rpx; }
.bone { left: 103rpx; width: 8rpx; border-radius: 999rpx; transform-origin: top center; }
.bone-body { top: 38rpx; height: 190rpx; }
.bone-arm-left { top: 84rpx; height: 154rpx; transform: rotate(54deg); }
.bone-arm-right { top: 84rpx; height: 154rpx; transform: rotate(-54deg); }
.bone-leg-left { top: 225rpx; height: 178rpx; transform: rotate(18deg); }
.bone-leg-right { top: 225rpx; height: 178rpx; transform: rotate(-18deg); }
</style>
