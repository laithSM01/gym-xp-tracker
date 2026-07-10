<script setup lang="ts">
defineProps<{ modelValue: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 shrink-0"
    :class="modelValue ? 'bg-brand-500' : 'bg-slate-300'"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
      :class="modelValue ? 'translate-x-4' : 'translate-x-1'"
    />
  </button>
</template>
