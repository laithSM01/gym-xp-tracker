<script setup lang="ts">
withDefaults(defineProps<{ padding?: string }>(), { padding: 'p-6' })
</script>

<template>
  <div class="bg-white rounded-3xl shadow-sm" :class="padding">
    <slot />
  </div>
</template>
