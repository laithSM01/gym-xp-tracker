<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    tone?: 'amber' | 'violet' | 'emerald' | 'pink' | 'brand'
    size?: 'sm' | 'lg'
  }>(),
  { tone: 'brand', size: 'sm' },
)

const TONE_CLASSES: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-500',
  violet: 'bg-violet-100 text-violet-500',
  emerald: 'bg-emerald-100 text-emerald-500',
  pink: 'bg-pink-100 text-pink-500',
  brand: 'bg-brand-100 text-brand-600',
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" :class="TONE_CLASSES[tone]">
      <slot name="icon" />
    </div>
    <div class="min-w-0">
      <p
        class="font-bold text-slate-800 leading-tight truncate"
        :class="size === 'lg' ? 'text-2xl font-black' : 'text-sm'"
      >
        {{ value }}
      </p>
      <p class="text-xs text-slate-400">{{ label }}</p>
    </div>
  </div>
</template>
