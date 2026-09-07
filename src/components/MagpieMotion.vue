<template>
  <view class="motion-shell" :class="{ 'motion-shell--transparent': transparent }" :aria-label="label">
    <!-- #ifdef MP-WEIXIN -->
    <rive-view
      v-if="effectiveRivSrc"
      class="rive-stage"
      :src="effectiveRivSrc"
      :artboard="artboard"
      :state-machine="stateMachine"
      :fit="fit"
      :autoplay="!paused"
      :max-dpr="2"
      :play-token="playToken"
      :celebrate-token="celebrateToken"
      :reduced-motion="reducedMotion || paused"
      @load="onRiveLoad"
      @error="onRiveError"
    />
    <video
      v-else
      :key="videoSrc"
      class="motion-video"
      :id="videoId"
      :src="videoSrc"
      :poster="poster"
      :autoplay="!paused"
      :loop="true"
      :muted="true"
      :controls="false"
      :show-center-play-btn="false"
      :show-play-btn="false"
      :show-fullscreen-btn="false"
      object-fit="cover"
      @error="onVideoError"
    />
    <!-- #endif -->

    <!-- #ifndef MP-WEIXIN -->
    <canvas
      v-if="effectiveRivSrc"
      class="rive-canvas"
      :data-options="renderOptions"
      :change:data-options="riveRenderer.loadRive"
    />
    <video
      v-else
      :key="videoSrc"
      class="motion-video"
      :id="videoId"
      :src="videoSrc"
      :poster="poster"
      :autoplay="!paused"
      :loop="true"
      :muted="true"
      :controls="false"
      :show-center-play-btn="false"
      :show-play-btn="false"
      :show-fullscreen-btn="false"
      playsinline
      object-fit="cover"
      @error="onVideoError"
    />
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { computed, ref, getCurrentInstance, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

declare const riveRenderer: {
  loadRive: (options: {
    src: string
    artboard: string
    stateMachine: string
    fit: 'contain' | 'cover'
    playToken: number
    celebrateToken: number
    reducedMotion: boolean
  }) => void
}

const props = withDefaults(defineProps<{
  label: string
  videoSrc: string
  poster: string
  rivSrc?: string
  artboard?: string
  stateMachine?: string
  fit?: 'contain' | 'cover'
  playToken?: number
  celebrateToken?: number
  reducedMotion?: boolean
  transparent?: boolean
  paused?: boolean
}>(), {
  rivSrc: '',
  artboard: '',
  stateMachine: 'Motion Machine',
  fit: 'contain',
  playToken: 0,
  celebrateToken: 0,
  reducedMotion: false,
  transparent: false,
  paused: false,
})

const emit = defineEmits<{
  (event: 'runtime', value: 'rive' | 'video'): void
  (event: 'error', message: string): void
}>()

const instance = getCurrentInstance()
const videoId = 'magpie-motion-' + instance?.uid
const failedRive = ref(false)
const effectiveRivSrc = computed(() => failedRive.value ? '' : props.rivSrc)
let disposed = false
async function syncPlayback() {
  await nextTick()
  if (disposed) return
  // #ifdef H5
  // Uni's H5 VideoContext does not return the native play promise.
  // Own it here so navigating away while media loads cannot reject globally.
  const video = (instance?.proxy?.$el as HTMLElement | undefined)?.querySelector('video')
  if (!video) return
  if (props.paused) video.pause()
  else {
    try { await video.play() }
    catch (error) {
      if (!disposed && video.isConnected && (error as DOMException)?.name !== 'AbortError')
        emit('error', '视频暂时无法播放，请稍后重试')
    }
  }
  return
  // #endif
  // #ifndef H5
  const videoContext = uni.createVideoContext(videoId, instance?.proxy as any)
  if (props.paused) videoContext.pause()
  else videoContext.play()
  // #endif
}
onBeforeUnmount(() => { disposed = true })
onMounted(() => { if (!effectiveRivSrc.value) void syncPlayback() })
watch(() => props.rivSrc, () => { failedRive.value = false })
watch([() => props.paused, effectiveRivSrc], () => { if (!effectiveRivSrc.value) void syncPlayback() })

const renderOptions = computed(() => ({
  src: effectiveRivSrc.value,
  paused: props.paused,
  artboard: props.artboard,
  stateMachine: props.stateMachine,
  fit: props.fit,
  playToken: props.playToken,
  celebrateToken: props.celebrateToken,
  reducedMotion: props.reducedMotion,
}))

function onRiveLoad() {
  emit('runtime', 'rive')
}

function handleRiveReady() {
  emit('runtime', 'rive')
}

function handleRiveRenderError(message?: string) {
  failedRive.value = true
  emit('error', message || 'Rive 加载失败，已保留 MP4 备用素材')
}

defineExpose({ handleRiveReady, handleRiveRenderError })

function onRiveError(event: { detail?: { error?: string } }) {
  failedRive.value = true
  emit('error', event?.detail?.error || 'Rive 加载失败，已保留 MP4 备用素材')
}

function onVideoError() {
  emit('error', '视频素材加载失败')
}
</script>

<!-- #ifdef APP-PLUS || H5 -->
<script module="riveRenderer" lang="renderjs">
// @ts-nocheck
import { Alignment, Fit, Layout, Rive } from '@rive-app/canvas-single'

const runtimeStore = new Map()

function cleanupRuntime() {
  const instance = runtimeStore.get('rive')
  if (instance) instance.cleanup()
  runtimeStore.clear()
}

export default {
  beforeDestroy() {
    cleanupRuntime()
  },
  methods: {
    cleanup() {
      cleanupRuntime()
    },
    // @ts-ignore renderjs executes as JavaScript in the view layer
    syncInputs(instance, options) {
      if (!instance || !options || !options.stateMachine) return
      const inputs = instance.stateMachineInputs(options.stateMachine) || []
      // @ts-ignore renderjs executes as JavaScript in the view layer
      const input = (name) => inputs.find((item) => item.name === name)

      const play = input('play')
      if (play) play.value = !options.paused
      if (options.paused) instance.pause()
      else instance.play()

      const reducedMotion = input('reducedMotion')
      if (reducedMotion) reducedMotion.value = Boolean(options.reducedMotion)

      const lastPlayToken = runtimeStore.get('playToken')
      if (lastPlayToken !== undefined && lastPlayToken !== options.playToken) {
        const replay = input('replay')
        if (replay && replay.fire) replay.fire()
      }
      runtimeStore.set('playToken', options.playToken)

      const lastCelebrateToken = runtimeStore.get('celebrateToken')
      if (lastCelebrateToken !== undefined && lastCelebrateToken !== options.celebrateToken) {
        const celebrate = input('celebrate')
        if (celebrate && celebrate.fire) celebrate.fire()
      }
      runtimeStore.set('celebrateToken', options.celebrateToken)
    },
    loadRive(options = { src: '', artboard: '', stateMachine: '', fit: 'contain', paused: false }) {
      if (!options || !options.src) {
        cleanupRuntime()
        return
      }
      if (options.src === runtimeStore.get('src') && runtimeStore.get('rive')) {
        this.syncInputs(runtimeStore.get('rive'), options)
        return
      }

      cleanupRuntime()
      const canvas = this.$el.querySelector('.rive-canvas')
      if (!canvas) return

      const instance = new Rive({
        src: options.src,
        canvas,
        autoplay: !options.paused,
        artboard: options.artboard || undefined,
        stateMachines: options.stateMachine || undefined,
        layout: new Layout({
          fit: options.fit === 'cover' ? Fit.Cover : Fit.Contain,
          alignment: Alignment.Center,
        }),
        onLoad: () => {
          const active = runtimeStore.get('rive')
          if (active) {
            active.resizeDrawingSurfaceToCanvas()
            this.syncInputs(active, options)
          }
          // @ts-ignore $ownerInstance is injected by uni-app renderjs
          const owner = this.$ownerInstance
          if (owner) owner.callMethod('handleRiveReady')
        },
        onLoadError: (error) => {
          const message = String(error || 'Rive 加载失败')
          // @ts-ignore $ownerInstance is injected by uni-app renderjs
          const owner = this.$ownerInstance
          if (owner) owner.callMethod('handleRiveRenderError', message)
        },
      })
      runtimeStore.set('src', options.src)
      runtimeStore.set('rive', instance)
    },
  },
}
</script>
<!-- #endif -->

<style scoped>
.motion-shell,
.motion-video,
.rive-stage,
.rive-canvas {
  width: 100%;
  height: 100%;
}

.motion-shell {
  overflow: hidden;
  background: #000;
}

.motion-shell--transparent {
  background: transparent;
}

.motion-video,
.rive-canvas {
  display: block;
}
</style>
