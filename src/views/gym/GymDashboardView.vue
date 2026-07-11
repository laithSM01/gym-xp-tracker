<script setup lang="ts">
import { computed, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { GymService } from '@/services/gyms.service'
import { useIncomingRequests } from '@/composables/useIncomingRequests'

const gymsService = inject<GymService>('gymsService')!
const router = useRouter()
const dashboard = gymsService.getGymDashboard()

watch(
  dashboard,
  (val) => {
    if (val === null) router.replace('/gym/setup')
  },
  { immediate: true },
)

const { pendingRequests } = useIncomingRequests()

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

// -- Hero call-to-action: routes based on current state, most useful action first
const heroCta = computed(() => {
  if (!dashboard.value?.subscription) return { label: 'View Plans', to: '/gym/billing' }
  if ((pendingRequests.value?.length ?? 0) > 0) return { label: 'Review Requests', to: '/gym/requests' }
  return { label: 'Invite a Trainer', to: '/gym/trainers' }
})

// -- Plan usage radial chart (Trainers / Clients / Products vs plan limits)
const usageSeries = computed(() => {
  const gym = dashboard.value?.gym
  const limits = dashboard.value?.limits
  if (!gym || !limits) return []
  const entries: number[] = []
  if (limits.trainers > 0) entries.push(usagePct(gym.trainersUsed, limits.trainers))
  entries.push(usagePct(gym.clientsAdded, limits.clients))
  entries.push(usagePct(gym.productsListed, limits.products))
  return entries
})

const usageLabels = computed(() => {
  const limits = dashboard.value?.limits
  if (!limits) return []
  const labels: string[] = []
  if (limits.trainers > 0) labels.push('Trainers')
  labels.push('Clients')
  labels.push('Products')
  return labels
})

const usageChartOptions = computed(() => ({
  chart: { type: 'radialBar', background: 'transparent' },
  theme: { mode: 'dark' },
  colors: ['#f97316', '#22d3ee', '#a78bfa'],
  labels: usageLabels.value,
  legend: {
    show: true,
    position: 'bottom',
    fontSize: '12px',
    labels: { colors: '#8b93a7' },
    markers: { size: 5 },
  },
  plotOptions: {
    radialBar: {
      hollow: { size: '38%' },
      track: { background: '#1f2534' },
      dataLabels: {
        name: { color: '#8b93a7', fontSize: '12px' },
        value: { color: '#fff', fontSize: '18px', fontWeight: 700 },
      },
    },
  },
  stroke: { lineCap: 'round' },
}))

// -- Clients-per-trainer chart
const trainerChartCategories = computed(() => dashboard.value?.trainers.map((t) => t.name) ?? [])
const trainerChartSeries = computed(() => [
  { name: 'Clients', data: dashboard.value?.trainers.map((t) => t.clientCount) ?? [] },
])

const trainerChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
  theme: { mode: 'dark' },
  colors: ['#f97316'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
  dataLabels: { enabled: false },
  grid: { borderColor: '#1f2534', strokeDashArray: 4 },
  xaxis: {
    categories: trainerChartCategories.value,
    labels: { style: { colors: '#8b93a7' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: '#8b93a7' } } },
  fill: {
    type: 'gradient',
    gradient: { shade: 'dark', type: 'vertical', shadeIntensity: 0.4, gradientToColors: ['#fb923c'], opacityFrom: 0.9, opacityTo: 0.5 },
  },
}))

// -- Plan capacity gauge: whichever resource is closest to its limit
const capacity = computed(() => {
  const gym = dashboard.value?.gym
  const limits = dashboard.value?.limits
  if (!gym || !limits) return null
  const candidates = [
    { label: 'Trainers', used: gym.trainersUsed, limit: limits.trainers },
    { label: 'Clients', used: gym.clientsAdded, limit: limits.clients },
    { label: 'Products', used: gym.productsListed, limit: limits.products },
  ].filter((c) => c.limit > 0)
  if (candidates.length === 0) return null
  return candidates.reduce((a, b) => (usagePct(a.used, a.limit) >= usagePct(b.used, b.limit) ? a : b))
})

const capacityPct = computed(() => (capacity.value ? usagePct(capacity.value.used, capacity.value.limit) : 0))

const capacityChartOptions = computed(() => ({
  chart: { type: 'radialBar', background: 'transparent' },
  theme: { mode: 'dark' },
  colors: ['#f97316'],
  plotOptions: {
    radialBar: {
      hollow: { size: '55%' },
      track: { background: '#1f2534' },
      dataLabels: {
        name: { show: false },
        value: { color: '#fff', fontSize: '28px', fontWeight: 800, offsetY: 8 },
      },
    },
  },
  fill: {
    type: 'gradient',
    gradient: { shade: 'dark', type: 'horizontal', gradientToColors: ['#fbbf24'], stops: [0, 100] },
  },
  stroke: { lineCap: 'round' },
}))
</script>

<template>
  <div v-if="dashboard" class="flex flex-col gap-6">
    <!-- Hero + Plan Usage row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Hero banner -->
      <div class="lg:col-span-2 relative overflow-hidden rounded-2xl bg-ink-800 border border-white/5 p-8 flex flex-col justify-center gap-4 min-h-[260px]">
        <div
          class="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
        />
        <div
          class="pointer-events-none absolute right-6 bottom-0 h-48 w-48 opacity-90"
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="h-full w-full">
            <defs>
              <linearGradient id="dumbbellGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#fb923c" />
                <stop offset="100%" stop-color="#f97316" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#dumbbellGrad)" opacity="0.12" />
            <g transform="translate(40 85) rotate(-20 60 15)">
              <rect x="0" y="0" width="18" height="30" rx="4" fill="url(#dumbbellGrad)" />
              <rect x="18" y="10" width="84" height="10" rx="5" fill="url(#dumbbellGrad)" />
              <rect x="102" y="0" width="18" height="30" rx="4" fill="url(#dumbbellGrad)" />
            </g>
          </svg>
        </div>

        <p class="relative text-xs font-medium text-ink-400">
          {{ new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </p>
        <div class="relative">
          <p class="text-sm font-semibold text-accent-500 mb-1">Welcome back, {{ dashboard.gym.name }}</p>
          <h1 class="text-2xl sm:text-3xl font-bold text-white max-w-md leading-snug">
            <template v-if="!dashboard.subscription">Ready to unlock your gym's full potential?</template>
            <template v-else-if="(pendingRequests?.length ?? 0) > 0">You have {{ pendingRequests?.length }} client{{ (pendingRequests?.length ?? 0) === 1 ? '' : 's' }} waiting for approval</template>
            <template v-else>Ready to grow your club today?</template>
          </h1>
        </div>
        <RouterLink
          :to="heroCta.to"
          class="relative w-fit px-5 py-2.5 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 transition-colors"
        >
          {{ heroCta.label }}
        </RouterLink>
      </div>

      <!-- Plan usage -->
      <div class="rounded-2xl bg-ink-800 border border-white/5 p-6 flex flex-col gap-2">
        <h2 class="text-base font-semibold text-white">Plan Usage</h2>
        <div v-if="usageSeries.length" class="flex-1 flex items-center justify-center">
          <apexchart type="radialBar" height="260" :options="usageChartOptions" :series="usageSeries" />
        </div>
        <p v-else class="text-sm text-ink-400 text-center py-10">
          Upgrade to a plan to unlock trainer slots, client capacity, and product listings.
        </p>
      </div>
    </div>

    <!-- Stat tiles -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="rounded-2xl bg-ink-800 border border-white/5 p-6 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-ink-400">Current Members</h3>
          <div class="h-9 w-9 rounded-xl bg-accent-500/15 text-accent-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
        <p class="text-3xl font-bold text-white">{{ dashboard.clients.length }}</p>
        <p v-if="dashboard.limits" class="text-xs text-ink-400">of {{ dashboard.limits.clients }} plan capacity</p>
      </div>

      <div class="rounded-2xl bg-ink-800 border border-white/5 p-6 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-ink-400">Trainers</h3>
          <div class="h-9 w-9 rounded-xl bg-cyan-400/15 text-cyan-400 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <p class="text-3xl font-bold text-white">{{ dashboard.trainers.length }}</p>
        <p v-if="dashboard.limits && dashboard.limits.trainers > 0" class="text-xs text-ink-400">of {{ dashboard.limits.trainers }} plan capacity</p>
      </div>

      <div class="rounded-2xl bg-ink-800 border border-white/5 p-6 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-ink-400">Pending Requests</h3>
          <div class="h-9 w-9 rounded-xl bg-violet-400/15 text-violet-400 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p class="text-3xl font-bold text-white">{{ pendingRequests?.length ?? 0 }}</p>
        <RouterLink to="/gym/requests" class="text-xs font-semibold text-accent-500 hover:text-accent-600 transition-colors">
          Review now
        </RouterLink>
      </div>
    </div>

    <!-- Clients-per-trainer + Capacity gauge row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 rounded-2xl bg-ink-800 border border-white/5 p-6 flex flex-col gap-4">
        <h2 class="text-base font-semibold text-white">Clients per Trainer</h2>
        <div v-if="dashboard.trainers.length" class="flex-1">
          <apexchart type="bar" height="280" :options="trainerChartOptions" :series="trainerChartSeries" />
        </div>
        <p v-else class="text-sm text-ink-400 text-center py-16">No trainers yet — invite one to see their client load here.</p>
      </div>

      <div class="rounded-2xl bg-ink-800 border border-white/5 p-6 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-white">Plan Capacity</h2>
          <span v-if="capacity" class="text-xs font-medium text-ink-400">{{ capacity.label }}</span>
        </div>
        <div v-if="capacity" class="flex-1 flex flex-col items-center justify-center">
          <apexchart type="radialBar" height="220" :options="capacityChartOptions" :series="[capacityPct]" />
          <div class="flex items-center gap-6 mt-2 text-center">
            <div>
              <p class="text-xs text-ink-400">Used</p>
              <p class="text-sm font-semibold text-white">{{ capacity.used }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-400">Limit</p>
              <p class="text-sm font-semibold text-white">{{ capacity.limit }}</p>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-ink-400 text-center py-16">Upgrade to a plan to track capacity.</p>
      </div>
    </div>

    <!-- Subscription footer -->
    <div class="rounded-2xl bg-ink-800 border border-white/5 p-6 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-base font-semibold text-white">Subscription</h2>
        <p class="text-xs text-ink-400 mt-0.5">{{ dashboard.gym.city }} &middot; {{ dashboard.gym.location }}</p>
      </div>
      <div v-if="dashboard.subscription" class="flex items-center gap-3">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent-500/15 text-accent-500">
          {{ planLabel }}
        </span>
        <span class="text-xs text-ink-400">
          Renews {{ new Date(dashboard.subscription.currentPeriodEnd).toLocaleDateString() }}
        </span>
      </div>
      <RouterLink v-else to="/gym/billing" class="text-sm font-semibold text-accent-500 hover:text-accent-600 transition-colors">
        No active subscription — view plans
      </RouterLink>
    </div>
  </div>

  <div v-else-if="dashboard === undefined" class="text-center py-16 text-ink-400 text-sm">
    Loading...
  </div>
</template>
