<script setup lang="ts">
defineProps<{ label?: string; error?: string }>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-xs font-medium text-slate-500">{{ label }}</label>
    <slot />
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
