<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <p class="text-sm text-slate-400 text-center py-4">{{ message }}</p>
</template>
