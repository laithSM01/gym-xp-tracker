<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useNutritionistDashboard } from '@/composables/useNutritionistDashboard'
import { tierConfig, tierMax, xpProgress } from '@/utils/xp'

const { data } = useNutritionistDashboard()
const { clients, nutritionistName } = data
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Welcome back, {{ nutritionistName }}</h1>
        <p class="mt-1 text-gray-500">
          Clients with nutritionist access granted
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="clients === null" class="flex items-center justify-center py-24">
      <div class="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="clients.length === 0" class="text-center py-24 text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
      <p class="text-lg font-medium">No clients yet</p>
      <p class="text-sm mt-1">Clients will appear here once a trainer grants nutritionist access.</p>
    </div>

    <!-- Client grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <RouterLink
        v-for="client in clients"
        :key="client._id"
        :to="`/nutritionist/client/${client._id}`"
        class="block text-left bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150"
      >
        <!-- Name + tier badge -->
        <div class="flex items-start justify-between gap-2 mb-3">
          <span class="font-semibold text-gray-900 truncate">{{ client.userName }}</span>
          <span
            class="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ring-1"
            :class="tierConfig[client.currentTier].badge"
          >
            {{ tierConfig[client.currentTier].label }}
          </span>
        </div>

        <!-- Goal -->
        <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ client.goal }}</p>

        <!-- XP bar -->
        <div>
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>{{ client.currentXP.toLocaleString() }} XP</span>
            <span v-if="client.currentTier !== 'elite'">
              {{ tierMax[client.currentTier].toLocaleString() }}
            </span>
            <span v-else class="text-green-500 font-semibold">MAX</span>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="tierConfig[client.currentTier].bar"
              :style="{ width: xpProgress(client.currentXP, client.currentTier) + '%' }"
            />
          </div>
        </div>

        <!-- Nutrition plan CTA -->
        <div class="mt-4 flex items-center gap-1.5 text-xs font-medium text-teal-600">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          View nutrition plan
        </div>
      </RouterLink>
    </div>
  </div>
</template>
