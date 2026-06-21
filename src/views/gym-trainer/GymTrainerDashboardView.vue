<script setup lang="ts">
import { ref, inject } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tierConfig, tierMax, xpProgress } from '@/utils/xp'
import type { GymTrainerService, GymTrainerClient } from '@/services/gym-trainer.service'
import type { Id } from '../../../convex/_generated/dataModel'

const gymTrainerService = inject<GymTrainerService>('gymTrainerService')!
const dashboard = gymTrainerService.getMyDashboard()

const authStore = useAuthStore()
const userName = authStore.convexUser?.name ?? authStore.convexUser?.email ?? 'Trainer'

const claimingId = ref<string | null>(null)
const claimError = ref('')
const unassigningId = ref<string | null>(null)

async function claimClient(clientId: Id<'clients'>) {
  claimingId.value = clientId
  claimError.value = ''
  try {
    await gymTrainerService.claimClient(clientId)
  } catch (e) {
    claimError.value = e instanceof Error ? e.message : 'Failed to claim client'
  } finally {
    claimingId.value = null
  }
}

async function unassignClient(clientId: Id<'clients'>) {
  unassigningId.value = clientId
  try {
    await gymTrainerService.unassignClient(clientId)
  } catch {
    // silently ignore — dashboard will stay in sync via subscription
  } finally {
    unassigningId.value = null
  }
}

function trainerLabel(client: GymTrainerClient): string {
  if (!client.trainerId) return 'Unassigned'
  return 'With another trainer'
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Loading -->
    <div v-if="dashboard === undefined" class="flex items-center justify-center py-24">
      <div class="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>

    <template v-else-if="dashboard">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h1 class="text-2xl font-bold text-gray-900">Welcome back, {{ userName }}</h1>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">Gym Trainer</span>
          </div>
          <p class="text-gray-500">{{ dashboard.gym.name }} · {{ dashboard.gym.city }}</p>
        </div>
      </div>

      <!-- My Clients -->
      <section class="mb-10">
        <h2 class="text-base font-semibold text-gray-900 mb-4">
          My Clients
          <span class="ml-2 text-xs font-normal text-gray-400">({{ dashboard.myClients.length }})</span>
        </h2>

        <div v-if="dashboard.myClients.length === 0" class="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
          <p class="text-sm">No clients assigned to you yet — claim one from the pool below.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="client in dashboard.myClients"
            :key="String(client.clientId)"
            class="relative bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
          >
            <!-- Unassign button -->
            <button
              :disabled="unassigningId === client.clientId"
              class="absolute top-3 right-3 text-xs text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
              title="Release client"
              @click="unassignClient(client.clientId)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <RouterLink
              :to="`/gym-trainer/client/${client.clientId}`"
              class="block"
            >
              <!-- Name + tier -->
              <div class="flex items-start justify-between gap-2 mb-1 pr-5">
                <span class="font-semibold text-gray-900 truncate">{{ client.name }}</span>
                <span
                  class="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ring-1"
                  :class="tierConfig[client.currentTier].badge"
                >
                  {{ tierConfig[client.currentTier].label }}
                </span>
              </div>

              <p class="text-xs text-gray-400 mb-2">{{ client.city }}</p>
              <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ client.goal }}</p>

              <!-- XP bar -->
              <div>
                <div class="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{{ client.currentXP.toLocaleString() }} XP</span>
                  <span v-if="client.currentTier !== 'elite'">{{ tierMax[client.currentTier].toLocaleString() }}</span>
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
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Available in Gym -->
      <section v-if="dashboard.availableClients.length > 0">
        <h2 class="text-base font-semibold text-gray-900 mb-1">
          Available in Gym
          <span class="ml-2 text-xs font-normal text-gray-400">({{ dashboard.availableClients.length }})</span>
        </h2>
        <p class="text-xs text-gray-400 mb-4">Clients enrolled in {{ dashboard.gym.name }} not currently assigned to you.</p>

        <p v-if="claimError" class="text-sm text-red-500 mb-3">{{ claimError }}</p>

        <div class="flex flex-col divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div
            v-for="client in dashboard.availableClients"
            :key="String(client.clientId)"
            class="flex items-center gap-4 px-5 py-4"
          >
            <!-- Avatar -->
            <div class="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
              {{ client.name.charAt(0).toUpperCase() }}
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-gray-900 truncate">{{ client.name }}</span>
                <span
                  class="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ring-1"
                  :class="tierConfig[client.currentTier].badge"
                >
                  {{ tierConfig[client.currentTier].label }}
                </span>
              </div>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ client.city }} · {{ client.goal }}
                <span class="ml-2 text-gray-300">· {{ trainerLabel(client) }}</span>
              </p>
            </div>

            <!-- XP -->
            <span class="shrink-0 text-xs font-bold text-gray-500 hidden sm:block">
              {{ client.currentXP.toLocaleString() }} XP
            </span>

            <!-- Claim -->
            <button
              :disabled="claimingId === client.clientId"
              class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="claimClient(client.clientId)"
            >
              {{ claimingId === client.clientId ? 'Claiming…' : 'Claim' }}
            </button>
          </div>
        </div>
      </section>
    </template>

    <!-- No gym affiliation -->
    <div v-else class="flex flex-col items-center justify-center py-24 text-center text-gray-400 gap-4">
      <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">🏢</div>
      <div>
        <p class="text-base font-semibold text-gray-700">Not affiliated with a gym</p>
        <p class="text-sm mt-1">Accept a gym invitation to get started.</p>
      </div>
    </div>
  </div>
</template>
