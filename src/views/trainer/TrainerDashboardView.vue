<script setup lang="ts">
import { computed, watch, inject } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { UserButton } from '@clerk/vue'
import { tierConfig, xpProgress } from '@/utils/xp'
import type { TrainerService } from '@/services/trainers.service'
import type { Tier } from '@/types/client'
import { GOAL_OPTIONS } from '@/composables/useNewClient'
import BaseCard from '@/components/ui/BaseCard.vue'
import Badge from '@/components/ui/Badge.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import StatTile from '@/components/ui/StatTile.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ClientCard from '@/components/trainer/ClientCard.vue'

const trainersService = inject<TrainerService>('trainersService')!
const router = useRouter()
const dashboard = trainersService.getTrainerDashboard()

// Training board — active programs grouped by client goal
const programsBoard = trainersService.getProgramsBoard()
const activeProgramsCount = computed(() => programsBoard.value?.length ?? 0)

// Client Progress Overview — derived entirely from already-loaded dashboard data
const TIER_ORDER: Tier[] = ['beginner', 'novice', 'intermediate', 'advanced', 'elite']

const tierDistribution = computed(() => {
  const clients = dashboard.value?.clients ?? []
  const total = clients.length
  return TIER_ORDER.map((tier) => {
    const count = clients.filter((c) => c.currentTier === tier).length
    return {
      tier,
      label: tierConfig[tier].label,
      barClass: tierConfig[tier].bar,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })
})

const avgTierProgress = computed(() => {
  const clients = dashboard.value?.clients ?? []
  if (clients.length === 0) return 0
  const sum = clients.reduce((acc, c) => acc + xpProgress(c.currentXP, c.currentTier), 0)
  return Math.round(sum / clients.length)
})

const topPerformer = computed(() => dashboard.value?.clients[0] ?? null)

const COLUMN_CHIP_CLASSES = [
  'bg-brand-100 text-brand-600',
  'bg-violet-100 text-violet-500',
  'bg-emerald-100 text-emerald-500',
  'bg-pink-100 text-pink-500',
  'bg-amber-100 text-amber-500',
]

function programDurationWeeks(startDate: number, endDate: number): number {
  return Math.max(1, Math.round((endDate - startDate) / (7 * 24 * 60 * 60 * 1000)))
}

const trainingColumns = computed(() => {
  const entries = programsBoard.value ?? []
  const knownGoals = GOAL_OPTIONS as readonly string[]
  const goalsPresent = [...new Set(entries.map((e) => e.goal))]
  const orderedGoals = [
    ...knownGoals.filter((g) => goalsPresent.includes(g)),
    ...goalsPresent.filter((g) => !knownGoals.includes(g)),
  ]
  return orderedGoals.map((goal, i) => ({
    goal,
    chipClass: COLUMN_CHIP_CLASSES[i % COLUMN_CHIP_CLASSES.length],
    entries: entries.filter((e) => e.goal === goal),
  }))
})

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
  if (status === 'active') return 'bg-green-100 text-green-700 ring-1 ring-green-200'
  if (status === 'past_due') return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200'
  if (status === 'canceled') return 'bg-red-100 text-red-700 ring-1 ring-red-200'
  return 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
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
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Loading -->
    <div v-if="dashboard === undefined" class="flex items-center justify-center py-24">
      <div class="w-8 h-8 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
    </div>

    <template v-else-if="dashboard">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Welcome, {{ dashboard.trainerName }} 👋</h1>
          <p class="mt-1 text-slate-400">
            You have
            <span class="font-semibold text-slate-600">{{ enrolledCount }}</span>
            active client{{ enrolledCount !== 1 ? 's' : '' }}
          </p>
        </div>
        <UserButton />
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <BaseCard>
          <StatTile label="Total Clients" :value="dashboard.clients.length" tone="brand" size="lg">
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </template>
          </StatTile>
        </BaseCard>
        <BaseCard>
          <StatTile label="Active Programs" :value="activeProgramsCount" tone="violet" size="lg">
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </template>
          </StatTile>
        </BaseCard>
      </div>

      <!-- Client Progress Overview -->
      <BaseCard class="mb-6">
        <h2 class="text-base font-semibold text-slate-800 mb-4">Client Progress Overview</h2>

        <EmptyState v-if="dashboard.clients.length === 0" message="No clients yet — progress breakdown will appear here." />

        <template v-else>
          <div class="flex flex-col gap-3 mb-5">
            <div v-for="t in tierDistribution" :key="t.tier" class="flex items-center gap-3">
              <span class="w-24 shrink-0 text-xs font-medium text-slate-500">{{ t.label }}</span>
              <ProgressBar class="flex-1" :percent="t.percent" :bar-class="t.barClass" />
              <span class="w-8 shrink-0 text-xs text-slate-400 text-right">{{ t.count }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <p class="text-xs text-slate-400">Active Clients</p>
              <p class="text-lg font-bold text-slate-800">{{ enrolledCount }}/{{ dashboard.clients.length }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Avg. Tier Progress</p>
              <p class="text-lg font-bold text-slate-800">{{ avgTierProgress }}%</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Top Performer</p>
              <p class="text-lg font-bold text-slate-800 truncate">{{ topPerformer?.name ?? '—' }}</p>
            </div>
          </div>
        </template>
      </BaseCard>

      <!-- Quick Actions -->
      <BaseCard class="mb-6">
        <h2 class="text-base font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div class="flex flex-col divide-y divide-slate-100">
          <RouterLink to="/trainer/new-client" class="flex items-center gap-3 py-3 first:pt-0 hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors">
            <div class="h-10 w-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-800">Add Client</p>
              <p class="text-xs text-slate-400">Add a new client to your list</p>
            </div>
          </RouterLink>
        </div>
      </BaseCard>

      <!-- Subscription -->
      <BaseCard class="mb-6">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <h2 class="text-base font-semibold text-slate-800">Subscription</h2>
            <div v-if="dashboard.subscription" class="flex items-center gap-3">
              <Badge :badge-class="subStatusClass">{{ planLabel }}</Badge>
              <span class="text-xs text-slate-400">
                Renews {{ new Date(dashboard.subscription.currentPeriodEnd).toLocaleDateString() }}
              </span>
            </div>
            <span v-else class="text-sm text-slate-400">No active subscription</span>
          </div>

          <div v-if="dashboard.subscription && dashboard.limits" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-600">Clients</span>
                <span class="text-slate-400">{{ dashboard.trainerProfile.clientsAdded }} / {{ dashboard.limits.clients }}</span>
              </div>
              <ProgressBar :percent="usagePct(dashboard.trainerProfile.clientsAdded, dashboard.limits.clients)" />
            </div>

          </div>

          <p v-else-if="!dashboard.subscription" class="text-sm text-slate-400">
            Upgrade to a plan to unlock more client capacity.
          </p>
        </div>
      </BaseCard>

      <!-- Clients section -->
      <div id="clients-section" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-slate-800">Clients</h2>
          <RouterLink to="/trainer/clients" class="text-xs font-semibold text-brand-600 hover:text-brand-600/80 transition-colors">
            View all
          </RouterLink>
        </div>

        <EmptyState
          v-if="dashboard.clients.length === 0"
          message="No clients yet — clients will appear here once they're assigned to you."
        />

        <div v-else class="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          <div v-for="client in dashboard.clients" :key="client._id" class="shrink-0 w-64">
            <ClientCard :client="client" />
          </div>
        </div>
      </div>

      <!-- Training board -->
      <div id="training-section" class="mb-8">
        <h2 class="text-base font-semibold text-slate-800 mb-4">Training</h2>

        <EmptyState
          v-if="trainingColumns.length === 0"
          message="No active programs yet. Approve a program from a client's page to see it here, grouped by goal."
        />

        <div v-else class="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          <div v-for="column in trainingColumns" :key="column.goal" class="shrink-0 w-72">
            <div class="flex items-center gap-2 mb-3">
              <div class="h-6 w-6 rounded-lg flex items-center justify-center shrink-0" :class="column.chipClass">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span class="text-sm font-semibold text-slate-800 truncate">{{ column.goal }}</span>
              <Badge tone="brand">{{ column.entries.length }}</Badge>
            </div>

            <div class="flex flex-col gap-3">
              <BaseCard v-for="entry in column.entries" :key="entry.program._id" padding="p-4">
                <p class="text-sm font-semibold text-slate-800 truncate mb-2">{{ entry.program.title }}</p>
                <Badge tone="neutral" class="mb-3">{{ entry.clientName }}</Badge>
                <div class="flex items-center justify-between text-xs text-slate-400">
                  <span>Duration: {{ programDurationWeeks(entry.program.startDate, entry.program.endDate) }} weeks</span>
                  <span>{{ entry.program.sessionsPerWeek }} sessions/week</span>
                </div>
              </BaseCard>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
