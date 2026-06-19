<script setup lang="ts">
import { computed, watch, inject } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { tierConfig, tierMax, xpProgress } from '@/utils/xp'
import type { TrainerService } from '@/services/trainers.service'
import { useIncomingRequests } from '@/composables/useIncomingRequests'

const trainersService = inject<TrainerService>('trainersService')!
const router = useRouter()
const dashboard = trainersService.getTrainerDashboard()

watch(
  dashboard,
  (val) => {
    if (val === null) router.replace('/trainer/setup')
  },
  { immediate: true },
)

const enrolledCount = computed(
  () => dashboard.value?.clients.filter((c) => c.isEnrolled).length ?? 0,
)

const subStatusClass = computed(() => {
  const status = dashboard.value?.subscription?.status
  if (status === 'active') return 'bg-green-100 text-green-700 ring-green-200'
  if (status === 'past_due') return 'bg-yellow-100 text-yellow-700 ring-yellow-200'
  if (status === 'canceled') return 'bg-red-100 text-red-700 ring-red-200'
  return 'bg-gray-100 text-gray-500 ring-gray-200'
})

const planLabel = computed(() => {
  const plan = dashboard.value?.subscription?.plan
  if (!plan) return null
  const labels: Record<string, string> = {
    personal_trainer: 'Personal Trainer',
    gym_small: 'Gym Small',
    gym_medium: 'Gym Medium',
    gym_large: 'Gym Large',
  }
  return labels[plan] ?? plan
})

function usagePct(used: number, limit: number) {
  if (limit <= 0) return 100
  return Math.min(100, Math.round((used / limit) * 100))
}

const {
  pendingRequests,
  freeClients,
  respondingTo,
  respondError,
  pingingClient,
  pingError,
  approve,
  reject,
  ping,
} = useIncomingRequests()
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Loading -->
    <div v-if="dashboard === undefined" class="flex items-center justify-center py-24">
      <div class="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>

    <template v-else-if="dashboard">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Welcome back, {{ dashboard.trainerName }}</h1>
          <p class="mt-1 text-gray-500">
            You have
            <span class="font-semibold text-gray-700">{{ enrolledCount }}</span>
            active client{{ enrolledCount !== 1 ? 's' : '' }}
          </p>
        </div>
        <RouterLink
          to="/trainer/new-client"
          class="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </RouterLink>
      </div>

      <!-- Overview bar -->
      <section class="mb-6 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <h2 class="text-base font-semibold text-gray-900">Subscription</h2>
          <div v-if="dashboard.subscription" class="flex items-center gap-3">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1"
              :class="subStatusClass"
            >
              {{ planLabel }}
            </span>
            <span class="text-xs text-gray-400">
              Renews {{ new Date(dashboard.subscription.currentPeriodEnd).toLocaleDateString() }}
            </span>
          </div>
          <span v-else class="text-sm text-gray-400">No active subscription</span>
        </div>

        <div v-if="dashboard.subscription && dashboard.limits" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Clients meter -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-gray-700">Clients</span>
              <span class="text-gray-500">{{ dashboard.trainerProfile.clientsAdded }} / {{ dashboard.limits.clients }}</span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                class="h-full rounded-full bg-purple-500 transition-all"
                :style="{ width: usagePct(dashboard.trainerProfile.clientsAdded, dashboard.limits.clients) + '%' }"
              />
            </div>
          </div>

          <!-- Products meter -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-gray-700">Products</span>
              <span class="text-gray-500">{{ dashboard.trainerProfile.productsListed }} / {{ dashboard.limits.products }}</span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                class="h-full rounded-full bg-purple-500 transition-all"
                :style="{ width: usagePct(dashboard.trainerProfile.productsListed, dashboard.limits.products) + '%' }"
              />
            </div>
          </div>
        </div>

        <p v-else-if="!dashboard.subscription" class="text-sm text-gray-400">
          Upgrade to a plan to unlock client capacity and product listings.
        </p>
      </section>

      <!-- Clients section -->
      <div v-if="dashboard.clients.length === 0" class="text-center py-24 text-gray-400">
        <p class="text-lg font-medium">No clients yet</p>
        <p class="text-sm mt-1">Clients will appear here once they're assigned to you.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <RouterLink
          v-for="client in dashboard.clients"
          :key="client._id"
          :to="`/trainer/client/${client._id}`"
          class="block text-left bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150"
        >
          <!-- Name + tier badge -->
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-semibold text-gray-900 truncate">{{ client.name }}</span>
            <span
              class="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ring-1"
              :class="tierConfig[client.currentTier].badge"
            >
              {{ tierConfig[client.currentTier].label }}
            </span>
          </div>

          <!-- City -->
          <p class="text-xs text-gray-400 mb-2">{{ client.city }}</p>

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
        </RouterLink>
      </div>

      <!-- Client Requests panel -->
      <section class="mt-8 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
        <h2 class="text-base font-semibold text-gray-900">Client Join Requests</h2>

        <p v-if="respondError" class="text-sm text-red-600">{{ respondError }}</p>

        <div v-if="pendingRequests === undefined" class="py-6 flex justify-center">
          <div class="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        </div>

        <p v-else-if="pendingRequests?.length === 0" class="text-sm text-gray-400 text-center py-4">
          No pending requests from clients.
        </p>

        <ul v-else class="flex flex-col divide-y divide-gray-100">
          <li
            v-for="r in pendingRequests"
            :key="r._id"
            class="flex items-center gap-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ r.clientName }}</p>
              <p class="text-xs text-gray-500">{{ r.clientCity }} · {{ r.clientGoal }}</p>
              <p v-if="r.message" class="text-xs text-gray-400 mt-0.5 truncate">{{ r.message }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                :disabled="respondingTo === r._id"
                class="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-40"
                @click="approve(r._id)"
              >
                {{ respondingTo === r._id ? '...' : 'Approve' }}
              </button>
              <button
                :disabled="respondingTo === r._id"
                class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
                @click="reject(r._id)"
              >
                Decline
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Discover Free Clients panel -->
      <section class="mt-4 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
        <h2 class="text-base font-semibold text-gray-900">Discover Free Clients</h2>
        <p class="text-xs text-gray-400 -mt-2">Unassigned clients with no gym or trainer yet</p>

        <p v-if="pingError" class="text-sm text-red-600">{{ pingError }}</p>

        <div v-if="freeClients === undefined" class="py-6 flex justify-center">
          <div class="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        </div>

        <p v-else-if="freeClients === null" class="text-sm text-gray-400 text-center py-4">
          An active subscription is required to discover free clients.
        </p>

        <p v-else-if="freeClients.length === 0" class="text-sm text-gray-400 text-center py-4">
          No free clients found.
        </p>

        <ul v-else class="flex flex-col divide-y divide-gray-100">
          <li
            v-for="client in freeClients"
            :key="client._id"
            class="flex items-center gap-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ client.name }}</p>
              <p class="text-xs text-gray-500">{{ client.city }} · Age {{ client.age }}</p>
              <p class="text-xs text-gray-400 truncate">{{ client.goal }}</p>
            </div>
            <button
              :disabled="pingingClient === client.userId"
              class="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-40"
              @click="ping(client.userId)"
            >
              {{ pingingClient === client.userId ? 'Sending...' : 'Invite' }}
            </button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
