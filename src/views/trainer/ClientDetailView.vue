<script setup lang="ts">
import { ref, inject, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

const route = useRoute()
const router = useRouter()
const convex = inject<ConvexClient>('convex')!

type Tier = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'

type Challenge = {
  _id: string
  title: string
  description: string
  xpReward: number
  status: 'pending' | 'completed'
  completedAt?: number
}

type XPLog = {
  _id: string
  amount: number
  reason: string
  createdAt: number
}

type Measurement = {
  _id: string
  weight: number
  bodyFat: number
  muscleMass: number
  notes?: string
  timestamp: number
}

type ClientDetail = {
  _id: string
  userName: string
  userEmail?: string
  age: number
  goal: string
  currentXP: number
  currentTier: Tier
  isEnrolled: boolean
  nutritionistAccess?: boolean
  challenges: Challenge[]
  xpLogs: XPLog[]
}

const clientId = route.params.clientId as string
const client = ref<ClientDetail | null>(null)
const measurements = ref<Measurement[] | null>(null)

const { unsubscribe: unsubClient } = convex.onUpdate(
  api.clients.getClientById,
  { clientId: clientId as Id<'clients'> },
  (data) => {
    client.value = data as ClientDetail | null
  },
)

const { unsubscribe: unsubMeasurements } = convex.onUpdate(
  api.measurements.getClientMeasurements,
  { clientId: clientId as Id<'clients'> },
  (data) => {
    measurements.value = data as Measurement[] | null
  },
)

onUnmounted(() => {
  unsubClient()
  unsubMeasurements()
})

// Award XP
const xpAmount = ref(50)
const xpReason = ref('')
const isAwarding = ref(false)
const awardError = ref('')
const awardSuccess = ref(false)

async function awardXP() {
  if (!xpAmount.value || xpAmount.value <= 0 || !xpReason.value.trim()) return
  isAwarding.value = true
  awardError.value = ''
  awardSuccess.value = false
  try {
    await convex.mutation(api.clients.awardXP, {
      clientId: clientId as Id<'clients'>,
      amount: xpAmount.value,
      reason: xpReason.value.trim(),
    })
    xpReason.value = ''
    xpAmount.value = 50
    awardSuccess.value = true
    setTimeout(() => { awardSuccess.value = false }, 3000)
  } catch (e: unknown) {
    awardError.value = e instanceof Error ? e.message : 'Failed to award XP'
  } finally {
    isAwarding.value = false
  }
}

// Log Measurement
const measWeight = ref('')
const measBodyFat = ref('')
const measMuscleMass = ref('')
const measNotes = ref('')
const isLogging = ref(false)
const logError = ref('')
const lastXPResult = ref<{ xpEarned: number; reasons: string[] } | null>(null)

async function logMeasurement() {
  if (!measWeight.value || !measBodyFat.value || !measMuscleMass.value) return
  isLogging.value = true
  logError.value = ''
  lastXPResult.value = null
  try {
    const result = await convex.mutation(api.measurements.logMeasurement, {
      clientId: clientId as Id<'clients'>,
      weight: parseFloat(measWeight.value),
      bodyFat: parseFloat(measBodyFat.value),
      muscleMass: parseFloat(measMuscleMass.value),
      notes: measNotes.value.trim() || undefined,
    })
    lastXPResult.value = result as { xpEarned: number; reasons: string[] }
    measWeight.value = ''
    measBodyFat.value = ''
    measMuscleMass.value = ''
    measNotes.value = ''
  } catch (e: unknown) {
    logError.value = e instanceof Error ? e.message : 'Failed to log measurement'
  } finally {
    isLogging.value = false
  }
}

// Nutritionist access toggle
const isTogglingAccess = ref(false)
async function toggleNutritionistAccess() {
  isTogglingAccess.value = true
  try {
    await convex.mutation(api.clients.toggleNutritionistAccess, {
      clientId: clientId as Id<'clients'>,
    })
  } finally {
    isTogglingAccess.value = false
  }
}

// Tier config
const tierConfig: Record<Tier, { label: string; badge: string; bar: string; next?: string }> = {
  beginner: {
    label: 'Beginner',
    badge: 'bg-gray-100 text-gray-700 ring-gray-200',
    bar: 'bg-gray-400',
    next: 'Novice at 500 XP',
  },
  novice: {
    label: 'Novice',
    badge: 'bg-blue-100 text-blue-700 ring-blue-200',
    bar: 'bg-blue-500',
    next: 'Intermediate at 1,000 XP',
  },
  intermediate: {
    label: 'Intermediate',
    badge: 'bg-amber-100 text-amber-700 ring-amber-200',
    bar: 'bg-amber-500',
    next: 'Advanced at 2,000 XP',
  },
  advanced: {
    label: 'Advanced',
    badge: 'bg-purple-100 text-purple-700 ring-purple-200',
    bar: 'bg-purple-500',
    next: 'Elite at 3,000 XP',
  },
  elite: {
    label: 'Elite',
    badge: 'bg-green-100 text-green-700 ring-green-200',
    bar: 'bg-green-500',
  },
}

const tierMin: Record<Tier, number> = {
  beginner: 0,
  novice: 500,
  intermediate: 1000,
  advanced: 2000,
  elite: 3000,
}

const tierMax: Record<Tier, number> = {
  beginner: 500,
  novice: 1000,
  intermediate: 2000,
  advanced: 3000,
  elite: 3000,
}

function xpProgress(xp: number, tier: Tier): number {
  if (tier === 'elite') return 100
  return Math.min(100, Math.round(((xp - tierMin[tier]) / (tierMax[tier] - tierMin[tier])) * 100))
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const activeChallenges = computed(() => client.value?.challenges.filter((c) => c.status === 'pending') ?? [])
const completedChallenges = computed(() => client.value?.challenges.filter((c) => c.status === 'completed') ?? [])
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Back -->
    <button
      class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      @click="router.back()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to dashboard
    </button>

    <!-- Loading -->
    <div v-if="!client" class="flex items-center justify-center py-24">
      <div class="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>

    <template v-else>
      <!-- Client header card -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div class="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ client.userName }}</h1>
            <p v-if="client.userEmail" class="text-sm text-gray-400 mt-0.5">{{ client.userEmail }}</p>
            <p class="text-sm text-gray-500 mt-1">Age {{ client.age }} · {{ client.goal }}</p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <!-- Nutritionist access toggle -->
            <button
              :disabled="isTogglingAccess"
              class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50"
              :class="client.nutritionistAccess
                ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'"
              @click="toggleNutritionistAccess"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {{ client.nutritionistAccess ? 'Nutritionist: ON' : 'Nutritionist: OFF' }}
            </button>
            <span
              class="text-sm font-semibold px-3 py-1 rounded-full ring-1"
              :class="tierConfig[client.currentTier].badge"
            >
              {{ tierConfig[client.currentTier].label }}
            </span>
          </div>
        </div>

        <!-- XP bar -->
        <div>
          <div class="flex justify-between items-baseline mb-2">
            <span class="text-3xl font-black text-gray-900">
              {{ client.currentXP.toLocaleString() }}
              <span class="text-lg font-semibold text-gray-400">XP</span>
            </span>
            <span v-if="tierConfig[client.currentTier].next" class="text-xs text-gray-400">
              Next: {{ tierConfig[client.currentTier].next }}
            </span>
            <span v-else class="text-xs font-semibold text-green-500">MAX TIER</span>
          </div>
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="tierConfig[client.currentTier].bar"
              :style="{ width: xpProgress(client.currentXP, client.currentTier) + '%' }"
            />
          </div>
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>{{ tierMin[client.currentTier].toLocaleString() }}</span>
            <span v-if="client.currentTier !== 'elite'">
              {{ tierMax[client.currentTier].toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Left: Award XP + XP History -->
        <div class="lg:col-span-1 flex flex-col gap-6">
          <!-- Award XP -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Award XP</h2>
            <div class="flex flex-col gap-3">
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Amount</label>
                <input
                  v-model.number="xpAmount"
                  type="number"
                  min="1"
                  max="1000"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="50"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Reason</label>
                <input
                  v-model="xpReason"
                  type="text"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. Completed weekly challenge"
                  @keydown.enter="awardXP"
                />
              </div>
              <button
                :disabled="isAwarding || !xpAmount || xpAmount <= 0 || !xpReason.trim()"
                class="w-full px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="awardXP"
              >
                {{ isAwarding ? 'Awarding…' : `+ Award ${xpAmount} XP` }}
              </button>
              <p v-if="awardSuccess" class="text-xs text-green-600 text-center font-medium">
                XP awarded successfully!
              </p>
              <p v-if="awardError" class="text-xs text-red-500 text-center">{{ awardError }}</p>
            </div>
          </div>

          <!-- XP History -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">XP History</h2>
            <div v-if="client.xpLogs.length === 0" class="text-sm text-gray-400">No XP awarded yet.</div>
            <ul v-else class="flex flex-col divide-y divide-gray-50">
              <li
                v-for="log in client.xpLogs"
                :key="log._id"
                class="flex items-start justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div class="min-w-0">
                  <p class="text-sm text-gray-700 leading-snug">{{ log.reason }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(log.createdAt) }}</p>
                </div>
                <span class="shrink-0 text-sm font-bold text-green-600">+{{ log.amount }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Right: Measurement History -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Measurement History</h2>
            <div v-if="!measurements || measurements.length === 0" class="text-sm text-gray-400">
              No measurements logged yet.
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs text-gray-400 border-b border-gray-100">
                    <th class="text-left pb-2 font-medium">Date</th>
                    <th class="text-right pb-2 font-medium">Weight</th>
                    <th class="text-right pb-2 font-medium">Body Fat</th>
                    <th class="text-right pb-2 font-medium">Muscle</th>
                    <th class="text-left pb-2 font-medium pl-4">Notes</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr
                    v-for="m in measurements"
                    :key="m._id"
                    class="text-gray-700"
                  >
                    <td class="py-2.5 text-gray-500 text-xs">{{ formatDate(m.timestamp) }}</td>
                    <td class="py-2.5 text-right font-medium">{{ m.weight }} kg</td>
                    <td class="py-2.5 text-right">{{ m.bodyFat }}%</td>
                    <td class="py-2.5 text-right">{{ m.muscleMass }} kg</td>
                    <td class="py-2.5 pl-4 text-xs text-gray-400">{{ m.notes ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Measurements section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Log measurement form -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Log Measurement</h2>
            <div class="flex flex-col gap-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-medium text-gray-500 mb-1 block">Weight (kg)</label>
                  <input
                    v-model="measWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="75.0"
                  />
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 mb-1 block">Body Fat (%)</label>
                  <input
                    v-model="measBodyFat"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="18.5"
                  />
                </div>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Muscle Mass (kg)</label>
                <input
                  v-model="measMuscleMass"
                  type="number"
                  step="0.1"
                  min="0"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="35.0"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Notes (optional)</label>
                <input
                  v-model="measNotes"
                  type="text"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Post-session notes…"
                />
              </div>
              <button
                :disabled="isLogging || !measWeight || !measBodyFat || !measMuscleMass"
                class="w-full px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="logMeasurement"
              >
                {{ isLogging ? 'Saving…' : 'Save Measurement' }}
              </button>

              <!-- XP result -->
              <div v-if="lastXPResult" class="rounded-xl bg-green-50 border border-green-100 p-3">
                <p class="text-sm font-bold text-green-700">+{{ lastXPResult.xpEarned }} XP earned!</p>
                <ul class="mt-1">
                  <li
                    v-for="(reason, i) in lastXPResult.reasons"
                    :key="i"
                    class="text-xs text-green-600"
                  >
                    {{ reason }}
                  </li>
                </ul>
              </div>
              <p v-if="logError" class="text-xs text-red-500 text-center">{{ logError }}</p>
            </div>
          </div>
        </div>

        <!-- Challenges -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <!-- Active challenges -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">
              Active Challenges
              <span class="ml-2 text-xs font-normal text-gray-400">({{ activeChallenges.length }})</span>
            </h2>
            <div v-if="activeChallenges.length === 0" class="text-sm text-gray-400">
              No active challenges.
            </div>
            <ul v-else class="flex flex-col gap-3">
              <li
                v-for="c in activeChallenges"
                :key="c._id"
                class="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div class="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800">{{ c.title }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ c.description }}</p>
                </div>
                <span
                  class="shrink-0 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap"
                >
                  +{{ c.xpReward }} XP
                </span>
              </li>
            </ul>
          </div>

          <!-- Completed challenges -->
          <div v-if="completedChallenges.length > 0" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">
              Completed
              <span class="ml-2 text-xs font-normal text-gray-400">({{ completedChallenges.length }})</span>
            </h2>
            <ul class="flex flex-col divide-y divide-gray-50">
              <li
                v-for="c in completedChallenges"
                :key="c._id"
                class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <svg class="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm text-gray-400 line-through flex-1">{{ c.title }}</span>
                <span v-if="c.completedAt" class="text-xs text-gray-300">{{ formatDate(c.completedAt) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
