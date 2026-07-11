<script setup lang="ts">
import { useRoute } from 'vue-router'
import BaseCard from '@/components/ui/BaseCard.vue'

const route = useRoute()
const title = (route.meta.title as string) ?? 'Coming soon'
const description = (route.meta.description as string) ?? 'This feature is on the roadmap.'
</script>

<template>
  <div class="max-w-2xl mx-auto py-16">
    <BaseCard class="text-center" padding="p-10">
      <div class="mx-auto h-14 w-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-slate-800 mb-2">{{ title }}</h1>
      <p class="text-sm text-slate-400">{{ description }}</p>
    </BaseCard>
  </div>
</template>
