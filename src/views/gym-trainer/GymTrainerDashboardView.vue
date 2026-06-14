<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const userName = authStore.convexUser?.name ?? authStore.convexUser?.email ?? 'Trainer'
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center text-center gap-4">
      <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl">
        🏋️
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Welcome, {{ userName }}</h1>
        <p class="text-gray-500 mt-1">You are a gym trainer. Client and program management tools are coming soon.</p>
      </div>
      <div class="w-full mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-indigo-700">
        Full trainer tools — client roster, workout programs, XP awards — will be available in the next phase.
      </div>
    </div>
  </div>
</template>
