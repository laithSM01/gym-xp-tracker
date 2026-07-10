<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'amber'
    /** Raw class override — used for pre-computed classes like per-tier badge colors. */
    badgeClass?: string
  }>(),
  { tone: 'neutral' },
)

const TONE_CLASSES: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600 ring-1 ring-brand-100',
  success: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  warning: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200',
  danger: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  neutral: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  amber: 'bg-amber-50 text-amber-600',
}

const resolvedClass = computed(() => props.badgeClass ?? TONE_CLASSES[props.tone])
</script>

<template>
  <span
    class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
    :class="resolvedClass"
  >
    <slot />
  </span>
</template>
