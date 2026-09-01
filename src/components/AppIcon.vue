<template>
  <view
    class="themed-icon"
    :class="{ 'themed-icon--active': active }"
    :style="iconStyle"
    role="img"
    :aria-label="label || undefined"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  size?: number
  color?: string
  active?: boolean
  label?: string
}>(), {
  size: 36,
  color: '#16A085',
  active: true,
  label: '',
})

const iconStyle = computed(() => {
  const size = `${props.size}rpx`
  const mask = `url(${props.src})`
  return {
    width: size,
    height: size,
    color: props.color,
    backgroundColor: 'currentColor',
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  }
})
</script>

<style scoped>
.themed-icon {
  display: block;
  flex-shrink: 0;
  opacity: 0.72;
}

.themed-icon--active { opacity: 1; }
</style>
