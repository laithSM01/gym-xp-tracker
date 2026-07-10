<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percent: number
    tone?: 'brand' | 'success' | 'neutral'
    size?: 'sm' | 'md'
    barClass?: string
  }>(),
  { tone: 'brand', size: 'md' },
)

const TONE_CLASSES: Record<string, string> = {
  brand: 'bg-brand-500',
  success: 'bg-green-500',
  neutral: 'bg-slate-400',
}

const clampedPercent = computed(() => Math.min(100, Math.max(0, props.percent)))
const fillClass = computed(() => props.barClass ?? TONE_CLASSES[props.tone])
</script>

<template>
  <div class="rounded-full bg-slate-100 overflow-hidden" :class="size === 'sm' ? 'h-2' : 'h-3'">
    <div
      class="h-full rounded-full transition-all duration-500"
      :class="fillClass"
      :style="{ width: clampedPercent + '%' }"
    />
  </div>
</template>
