<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useClientDashboard, tierConfig, tierMin, tierMax, xpProgress, formatDate } from '@/composables/useClientDashboard'
import type { ClientService } from '@/services/clients.service'
import type { StarterProgramsService } from '@/services/starterPrograms.service'
import { useJoinRequests } from '@/composables/useJoinRequests'

type TabKey = 'workout' | 'measurements' | 'nutrition' | 'challenges' | 'requests'

const NAV_ITEMS: { key: TabKey; label: string; path: string }[] = [
  { key: 'workout', label: "Today's Workout", path: 'M13 10V3L4 14h7v7l9-11h-7z' },
  {
    key: 'measurements',
    label: 'Measurements',
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2m10 0V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v14a2 2 0 002 2h2a2 2 0 002-2z',
  },
  {
    key: 'nutrition',
    label: 'Nutrition',
    path: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  },
  {
    key: 'challenges',
    label: 'Challenges',
    path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.977 9.101c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
  {
    key: 'requests',
    label: 'Requests',
    path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
]

const clientsService = inject<ClientService>('clientsService')!
const starterProgramsService = inject<StarterProgramsService>('starterProgramsService')!
const router = useRouter()
const clientProfile = clientsService.getMyProfile()
const starterProgram = starterProgramsService.getStarterProgram()

// Redirect to setup if client has not created their profile yet
watch(clientProfile, (val) => {
  if (val === null) router.replace('/client/setup')
}, { immediate: true })

const { data, loading: isLoading, actions } = useClientDashboard()
const { profile, challenges, nutritionPlan, programs, recentMeasurements, completingChallengeId } = data

const {
  outbound,
  inbound,
  myRequests,
  respondingTo,
  respondError,
  approveInbound,
  rejectInbound,
} = useJoinRequests()

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Joined',
  rejected: 'Declined',
}

const activeTab = ref<TabKey>('workout')
const pendingInboundCount = computed(() => inbound.value.filter((r) => r.status === 'pending').length)
const hasNoGymOrTrainer = computed(() => !!starterProgram.value)

// Normalize the active program's weekly schedule (or the starter program) into a common shape
type NormalizedExercise = { name: string; sets: number; reps: string }
type NormalizedDay = { label: string; type: string; exercises: NormalizedExercise[] }

const activeProgram = computed(() => programs.value?.[0] ?? null)

const schedule = computed<NormalizedDay[]>(() => {
  if (activeProgram.value) {
    return activeProgram.value.weeklySchedule.map((d) => ({
      label: `Day ${d.day}`,
      type: d.type,
      exercises: d.exercises.map((ex) => ({ name: ex.name, sets: ex.sets, reps: String(ex.reps) })),
    }))
  }
  if (starterProgram.value) {
    return starterProgram.value.weeklySchedule.map((d) => ({
      label: d.day,
      type: d.type,
      exercises: d.exercises.map((ex) => ({ name: ex.name, sets: ex.sets, reps: ex.reps })),
    }))
  }
  return []
})

const selectedDayIndex = ref(0)
watch(schedule, () => { selectedDayIndex.value = 0 })

const selectedDay = computed(() => schedule.value[selectedDayIndex.value] ?? null)

const dayStats = computed(() => {
  const day = selectedDay.value
  if (!day) return { exerciseCount: 0, totalSets: 0 }
  return {
    exerciseCount: day.exercises.length,
    totalSets: day.exercises.reduce((sum, ex) => sum + ex.sets, 0),
  }
})

// Completed exercises — local only, resets on reload
const completedExercises = ref<Set<string>>(new Set())

function exerciseKey(exerciseName: string): string {
  return `${selectedDayIndex.value}-${exerciseName}`
}

function toggleExercise(exerciseName: string) {
  const key = exerciseKey(exerciseName)
  const next = new Set(completedExercises.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  completedExercises.value = next
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <div class="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>

    <!-- Not enrolled -->
    <div v-else-if="!profile" class="text-center py-24 text-gray-400">
      <p class="text-lg font-medium">No profile found</p>
      <p class="text-sm mt-1">Your trainer hasn't enrolled you yet.</p>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-6">
      <!-- Sidebar nav -->
      <aside class="lg:w-56 shrink-0">
        <nav class="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex lg:flex-col gap-1 overflow-x-auto">
          <button
            v-for="item in NAV_ITEMS"
            :key="item.key"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            :class="activeTab === item.key ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'"
            @click="activeTab = item.key"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.path" />
            </svg>
            <span class="hidden lg:inline">{{ item.label }}</span>
            <span
              v-if="item.key === 'requests' && pendingInboundCount > 0"
              class="ml-auto shrink-0 text-[10px] font-bold text-white bg-red-500 rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ pendingInboundCount }}
            </span>
          </button>
        </nav>
      </aside>

      <!-- Main content -->
      <div class="flex-1 min-w-0 flex flex-col gap-6">
        <!-- Welcome header + XP card -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div class="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Welcome back, {{ profile.userName }}</h1>
              <p class="text-sm text-gray-500 mt-1">{{ profile.goal }} · Age {{ profile.age }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="shrink-0 text-sm font-semibold px-3 py-1 rounded-full ring-1"
                :class="tierConfig[profile.currentTier].badge"
              >
                {{ tierConfig[profile.currentTier].label }}
              </span>
              <button
                v-if="hasNoGymOrTrainer"
                class="shrink-0 text-sm font-semibold px-3 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                @click="router.push('/')"
              >
                Find a gym or trainer
              </button>
            </div>
          </div>

          <!-- XP bar -->
          <div>
            <div class="flex justify-between items-baseline mb-2">
              <span class="text-3xl font-black text-gray-900">
                {{ profile.currentXP.toLocaleString() }}
                <span class="text-lg font-semibold text-gray-400">XP</span>
              </span>
              <span v-if="tierConfig[profile.currentTier].next" class="text-xs text-gray-400">
                Next: {{ tierConfig[profile.currentTier].next }}
              </span>
              <span v-else class="text-xs font-semibold text-green-500">MAX TIER</span>
            </div>
            <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="tierConfig[profile.currentTier].bar"
                :style="{ width: xpProgress(profile.currentXP, profile.currentTier) + '%' }"
              />
            </div>
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>{{ tierMin[profile.currentTier].toLocaleString() }}</span>
              <span v-if="profile.currentTier !== 'elite'">
                {{ tierMax[profile.currentTier].toLocaleString() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Today's Workout -->
        <template v-if="activeTab === 'workout'">
          <div v-if="schedule.length === 0" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-gray-400">
            No program assigned yet.
          </div>
          <template v-else>
            <!-- Day tabs -->
            <div class="flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="(day, i) in schedule"
                :key="i"
                class="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                :class="selectedDayIndex === i ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
                @click="selectedDayIndex = i"
              >
                {{ day.label }}
              </button>
            </div>

            <div v-if="selectedDay" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Hero + stats -->
              <div class="lg:col-span-2 flex flex-col gap-4">
                <div class="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
                  <p class="text-xs font-semibold uppercase tracking-wide text-purple-200">{{ selectedDay.label }}</p>
                  <p class="text-2xl font-bold mt-1">{{ selectedDay.type }}</p>
                </div>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
                    <p class="text-2xl font-black text-gray-900">{{ dayStats.exerciseCount }}</p>
                    <p class="text-xs text-gray-400 mt-1">Exercises</p>
                  </div>
                  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
                    <p class="text-2xl font-black text-gray-900 truncate">{{ selectedDay.type }}</p>
                    <p class="text-xs text-gray-400 mt-1">Workout Type</p>
                  </div>
                  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
                    <p class="text-2xl font-black text-gray-900">{{ dayStats.totalSets }}</p>
                    <p class="text-xs text-gray-400 mt-1">Total Sets</p>
                  </div>
                </div>
              </div>

              <!-- Exercise list -->
              <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h2 class="text-base font-semibold text-gray-900 mb-4">Exercises</h2>
                <ul class="flex flex-col divide-y divide-gray-50">
                  <li
                    v-for="ex in selectedDay.exercises"
                    :key="ex.name"
                    class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <button
                      class="w-5 h-5 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center"
                      :class="completedExercises.has(exerciseKey(ex.name)) ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-purple-400'"
                      title="Mark as done"
                      @click="toggleExercise(ex.name)"
                    >
                      <svg v-if="completedExercises.has(exerciseKey(ex.name))" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <span
                      class="flex-1 text-sm font-medium"
                      :class="completedExercises.has(exerciseKey(ex.name)) ? 'text-gray-400 line-through' : 'text-gray-800'"
                    >
                      {{ ex.name }}
                    </span>
                    <span class="text-xs text-gray-400 shrink-0">{{ ex.sets }} × {{ ex.reps }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </template>

        <!-- Measurements -->
        <template v-else-if="activeTab === 'measurements'">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Recent Measurements</h2>
            <div v-if="recentMeasurements.length === 0" class="text-sm text-gray-400">
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
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="m in recentMeasurements" :key="m._id" class="text-gray-700">
                    <td class="py-2.5 text-gray-500 text-xs">{{ formatDate(m.timestamp) }}</td>
                    <td class="py-2.5 text-right font-medium">{{ m.weight }} kg</td>
                    <td class="py-2.5 text-right">{{ m.bodyFat }}%</td>
                    <td class="py-2.5 text-right">{{ m.muscleMass }} kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- Nutrition -->
        <template v-else-if="activeTab === 'nutrition'">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Nutrition Plan</h2>
            <div v-if="nutritionPlan === null" class="text-sm text-gray-400">
              No nutrition plan assigned yet.
            </div>
            <template v-else-if="nutritionPlan">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-xs text-gray-400 border-b border-gray-100">
                      <th class="text-left pb-2 font-medium">Meal</th>
                      <th class="text-right pb-2 font-medium">Calories</th>
                      <th class="text-right pb-2 font-medium">Protein</th>
                      <th class="text-right pb-2 font-medium">Carbs</th>
                      <th class="text-right pb-2 font-medium">Fat</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr v-for="meal in nutritionPlan.meals" :key="meal.name" class="text-gray-700">
                      <td class="py-2.5 font-medium">{{ meal.name }}</td>
                      <td class="py-2.5 text-right">{{ meal.calories }} kcal</td>
                      <td class="py-2.5 text-right">{{ meal.protein }}g</td>
                      <td class="py-2.5 text-right">{{ meal.carbs }}g</td>
                      <td class="py-2.5 text-right">{{ meal.fat }}g</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                <p v-if="nutritionPlan.notes" class="text-sm text-gray-500 flex-1">{{ nutritionPlan.notes }}</p>
                <span v-else class="flex-1" />
                <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Total: {{ nutritionPlan.totalCalories.toLocaleString() }} kcal
                </span>
              </div>
            </template>
          </div>
        </template>

        <!-- Challenges -->
        <template v-else-if="activeTab === 'challenges'">
          <div class="flex flex-col gap-6">
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 class="text-base font-semibold text-gray-900 mb-4">
                Active Challenges
                <span class="ml-2 text-xs font-normal text-gray-400">
                  ({{ challenges?.active.length ?? 0 }})
                </span>
              </h2>
              <div v-if="!challenges?.active.length" class="text-sm text-gray-400">
                No active challenges.
              </div>
              <ul v-else class="flex flex-col gap-3">
                <li
                  v-for="c in challenges.active"
                  :key="c._id"
                  class="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <button
                    :disabled="completingChallengeId === c._id"
                    class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 transition-colors hover:border-green-400 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    :class="completingChallengeId === c._id ? 'border-green-300 bg-green-50' : 'border-gray-300'"
                    title="Mark as complete"
                    @click="actions.completeChallenge(c._id)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800">{{ c.title }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ c.description }}</p>
                  </div>
                  <span class="shrink-0 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    +{{ c.xpReward }} XP
                  </span>
                </li>
              </ul>
            </div>

            <div v-if="challenges?.completed.length" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 class="text-base font-semibold text-gray-900 mb-4">
                Completed
                <span class="ml-2 text-xs font-normal text-gray-400">
                  ({{ challenges.completed.length }})
                </span>
              </h2>
              <ul class="flex flex-col divide-y divide-gray-50">
                <li
                  v-for="c in challenges.completed"
                  :key="c._id"
                  class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <svg class="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm text-gray-400 line-through flex-1">{{ c.title }}</span>
                  <span v-if="c.completedAt" class="text-xs text-gray-300">{{ formatDate(c.completedAt) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </template>

        <!-- Requests -->
        <template v-else-if="activeTab === 'requests'">
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-base font-semibold text-gray-900">Gym &amp; Trainer Requests</h2>
            </div>

            <p v-if="respondError" class="text-sm text-red-600 mb-3">{{ respondError }}</p>

            <!-- Inbound pings from gyms/trainers -->
            <div v-if="inbound.length > 0" class="mb-5">
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Invites from Gyms &amp; Trainers
              </h3>
              <ul class="flex flex-col divide-y divide-gray-100">
                <li
                  v-for="r in inbound"
                  :key="r._id"
                  class="flex items-center gap-4 py-3"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ r.initiatedBy === 'gym' ? 'Gym invite' : 'Trainer invite' }}
                    </p>
                    <p v-if="r.message" class="text-xs text-gray-400 truncate">{{ r.message }}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      v-if="r.status === 'pending'"
                      :disabled="respondingTo === r._id"
                      class="text-xs px-3 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-40"
                      @click="approveInbound(r._id)"
                    >
                      {{ respondingTo === r._id ? '...' : 'Accept' }}
                    </button>
                    <button
                      v-if="r.status === 'pending'"
                      :disabled="respondingTo === r._id"
                      class="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
                      @click="rejectInbound(r._id)"
                    >
                      Decline
                    </button>
                    <span
                      v-else
                      class="text-xs font-semibold px-2 py-0.5 rounded-full ring-1"
                      :class="{
                        'bg-green-100 text-green-700 ring-green-200': r.status === 'approved',
                        'bg-gray-100 text-gray-500 ring-gray-200': r.status === 'rejected',
                      }"
                    >
                      {{ STATUS_LABELS[r.status] }}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Outbound requests sent by client -->
            <div>
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Requests You Sent
              </h3>
              <div v-if="myRequests === undefined" class="py-4 flex justify-center">
                <div class="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              </div>
              <p v-else-if="outbound.length === 0" class="text-sm text-gray-400 py-4 text-center">
                No requests sent yet.
              </p>
              <ul v-else class="flex flex-col divide-y divide-gray-100">
                <li
                  v-for="r in outbound"
                  :key="r._id"
                  class="flex items-center gap-4 py-3"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ r.gymId ? 'Gym request' : 'Trainer request' }}
                    </p>
                    <p class="text-xs text-gray-400">{{ new Date(r.createdAt).toLocaleDateString() }}</p>
                  </div>
                  <span
                    class="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ring-1"
                    :class="{
                      'bg-yellow-100 text-yellow-700 ring-yellow-200': r.status === 'pending',
                      'bg-green-100 text-green-700 ring-green-200': r.status === 'approved',
                      'bg-gray-100 text-gray-500 ring-gray-200': r.status === 'rejected',
                    }"
                  >
                    {{ STATUS_LABELS[r.status] }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
