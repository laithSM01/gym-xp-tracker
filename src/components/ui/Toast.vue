<script setup lang="ts">
defineProps<{ show: boolean }>()
</script>

<template>
  <Transition name="ui-toast">
    <div
      v-if="show"
      class="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none"
    >
      <slot />
    </div>
  </Transition>
</template>

<style scoped>
.ui-toast-enter-active,
.ui-toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.ui-toast-enter-from,
.ui-toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
