<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClientDetail } from '@/composables/useClientDetail'
import { useClientAISuggestions } from '@/composables/useClientAISuggestions'
import { GOAL_OPTIONS } from '@/composables/useNewClient'
import { tierConfig, tierMin, tierMax, xpProgress, formatDate } from '@/utils/xp'
import type { Program } from '@/types/client'

const goalOptions = GOAL_OPTIONS

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

const { data, actions } = useClientDetail(clientId)
const {
  client,
  measurements,
  activeChallenges,
  completedChallenges,
  isAwarding,
  awardError,
  awardSuccess,
  isLogging,
  logError,
  lastXPResult,
  isTogglingAccess,
  isAddingChallenge,
  addChallengeError,
  addChallengeSuccess,
  isCreatingProgram,
  createProgramError,
  createProgramSuccess,
  activePrograms,
  trainerNotes,
  aiPayload,
} = data

// Edit Goal modal state
const isEditingGoal = ref(false)
const editGoalValue = ref('')

function openGoalModal() {
  editGoalValue.value = client.value!.goal
  isEditingGoal.value = true
}

async function handleSaveGoal() {
  if (!editGoalValue.value) return
  await actions.updateGoal(editGoalValue.value)
  isEditingGoal.value = false
}

// Award XP form state
const xpAmount = ref(50)
const xpReason = ref('')

async function handleAwardXP() {
  if (!xpAmount.value || xpAmount.value <= 0 || !xpReason.value.trim()) return
  const ok = await actions.awardXP(xpAmount.value, xpReason.value)
  if (ok) {
    xpReason.value = ''
    xpAmount.value = 50
  }
}

// Log Measurement form state
const measWeight = ref('')
const measBodyFat = ref('')
const measMuscleMass = ref('')
const measNotes = ref('')

async function handleLogMeasurement() {
  if (!measWeight.value || !measBodyFat.value || !measMuscleMass.value) return
  const ok = await actions.logMeasurement({
    weight: parseFloat(measWeight.value),
    bodyFat: parseFloat(measBodyFat.value),
    muscleMass: parseFloat(measMuscleMass.value),
    notes: measNotes.value.trim() || undefined,
  })
  if (ok) {
    measWeight.value = ''
    measBodyFat.value = ''
    measMuscleMass.value = ''
    measNotes.value = ''
  }
}

// Add Challenge form state
const challengeTitle = ref('')
const challengeDescription = ref('')
const challengeXpReward = ref(100)

async function handleAddChallenge() {
  if (!challengeTitle.value.trim() || !challengeDescription.value.trim() || challengeXpReward.value <= 0) return
  const ok = await actions.addChallenge(
    challengeTitle.value.trim(),
    challengeDescription.value.trim(),
    challengeXpReward.value,
  )
  if (ok) {
    challengeTitle.value = ''
    challengeDescription.value = ''
    challengeXpReward.value = 100
  }
}

// Collapsible program days — keyed as "<programId>-<dayIndex>"
const openProgramDayKeys = ref<string[]>([])

function toggleProgramDay(programId: string, dayIndex: number) {
  const key = `${programId}-${dayIndex}`
  const idx = openProgramDayKeys.value.indexOf(key)
  if (idx === -1) openProgramDayKeys.value.push(key)
  else openProgramDayKeys.value.splice(idx, 1)
}

function isProgramDayOpen(programId: string, dayIndex: number): boolean {
  return openProgramDayKeys.value.includes(`${programId}-${dayIndex}`)
}

// Program status toggle
async function handleToggleProgramStatus(program: Program) {
  const newStatus = program.status === 'active' ? 'completed' : 'active'
  await actions.updateProgramStatus(program._id, newStatus)
}

// AI Suggestions
const { suggestions, isLoading: isAILoading, error: aiError, fetchSuggestions } = useClientAISuggestions()
const openDayIndices = ref<number[]>([])
function toggleDay(i: number) {
  const idx = openDayIndices.value.indexOf(i)
  if (idx === -1) openDayIndices.value.push(i)
  else openDayIndices.value.splice(idx, 1)
}

function handleGetSuggestions() {
  if (!client.value || !aiPayload.value) return
  if (!client.value?.height || !client.value?.sportTypes || client.value.sportTypes.length === 0) {
    aiError.value = 'Client profile is incomplete. Please update height and sport type.'
    return
  }
  openDayIndices.value = []
  fetchSuggestions(aiPayload.value)
}

async function handleSaveProgram() {
  if (!suggestions.value) return
  await actions.createProgram(suggestions.value.title, suggestions.value.weeklySchedule)
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Back -->
    <button class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      @click="router.back()">
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
            <p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
              Age {{ client.age }} · {{ client.goal }}
              <button class="text-gray-300 hover:text-gray-500 transition-colors" title="Edit goal"
                @click="openGoalModal">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z" />
                </svg>
              </button>
              <span
                class="text-xs font-semibold px-2.5 py-0.5 rounded-full ring-1 ring-gray-200 bg-gray-50 text-gray-600">
                {{ client.sportTypes.join(', ') }}
              </span>
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <!-- Nutritionist access toggle -->
            <button :disabled="isTogglingAccess"
              class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50"
              :class="client.nutritionistAccess
                ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'"
              @click="actions.toggleNutritionistAccess()">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {{ client.nutritionistAccess ? 'Nutritionist: ON' : 'Nutritionist: OFF' }}
            </button>
            <span class="text-sm font-semibold px-3 py-1 rounded-full ring-1"
              :class="tierConfig[client.currentTier].badge">
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
            <div class="h-full rounded-full transition-all duration-700" :class="tierConfig[client.currentTier].bar"
              :style="{ width: xpProgress(client.currentXP, client.currentTier) + '%' }" />
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
                <input v-model.number="xpAmount" type="number" min="1" max="1000"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="50" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Reason</label>
                <input v-model="xpReason" type="text"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. Completed weekly challenge" @keydown.enter="handleAwardXP" />
              </div>
              <button :disabled="isAwarding || !xpAmount || xpAmount <= 0 || !xpReason.trim()"
                class="w-full px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="handleAwardXP">
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
              <li v-for="log in client.xpLogs" :key="log._id"
                class="flex items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
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
                  <tr v-for="m in measurements" :key="m._id" class="text-gray-700">
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
                  <input v-model="measWeight" type="number" step="0.1" min="0"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="75.0" />
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 mb-1 block">Body Fat (%)</label>
                  <input v-model="measBodyFat" type="number" step="0.1" min="0" max="100"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="18.5" />
                </div>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Muscle Mass (kg)</label>
                <input v-model="measMuscleMass" type="number" step="0.1" min="0"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="35.0" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Notes (optional)</label>
                <input v-model="measNotes" type="text"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Post-session notes…" />
              </div>
              <button :disabled="isLogging || !measWeight || !measBodyFat || !measMuscleMass"
                class="w-full px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="handleLogMeasurement">
                {{ isLogging ? 'Saving…' : 'Save Measurement' }}
              </button>

              <!-- XP result -->
              <div v-if="lastXPResult" class="rounded-xl bg-green-50 border border-green-100 p-3">
                <p class="text-sm font-bold text-green-700">+{{ lastXPResult.xpEarned }} XP earned!</p>
                <ul class="mt-1">
                  <li v-for="(reason, i) in lastXPResult.reasons" :key="i" class="text-xs text-green-600">
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

            <!-- Add challenge form -->
            <div class="flex flex-col gap-3 mb-4 pb-4 border-b border-gray-100">
              <div class="grid grid-cols-2 gap-3">
                <div class="col-span-2">
                  <label class="text-xs font-medium text-gray-500 mb-1 block">Title</label>
                  <input v-model="challengeTitle" type="text"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. 30-day plank streak" @keydown.enter="handleAddChallenge" />
                </div>
                <div class="col-span-2">
                  <label class="text-xs font-medium text-gray-500 mb-1 block">Description</label>
                  <input v-model="challengeDescription" type="text"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g. Hold a plank for 60s every day for 30 days" />
                </div>
                <div>
                  <label class="text-xs font-medium text-gray-500 mb-1 block">XP Reward</label>
                  <input v-model.number="challengeXpReward" type="number" min="1"
                    class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="100" />
                </div>
                <div class="flex items-end">
                  <button
                    :disabled="isAddingChallenge || !challengeTitle.trim() || !challengeDescription.trim() || challengeXpReward <= 0"
                    class="w-full px-4 py-2 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    @click="handleAddChallenge">
                    {{ isAddingChallenge ? 'Adding…' : '+ Add Challenge' }}
                  </button>
                </div>
              </div>
              <p v-if="addChallengeSuccess" class="text-xs text-green-600 font-medium">Challenge added!</p>
              <p v-if="addChallengeError" class="text-xs text-red-500">{{ addChallengeError }}</p>
            </div>

            <div v-if="activeChallenges.length === 0" class="text-sm text-gray-400">
              No active challenges.
            </div>
            <ul v-else class="flex flex-col gap-3">
              <li v-for="c in activeChallenges" :key="c._id"
                class="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div class="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800">{{ c.title }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ c.description }}</p>
                </div>
                <span
                  class="shrink-0 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
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
              <li v-for="c in completedChallenges" :key="c._id"
                class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
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
      </div>

      <!-- Programs -->
      <div class="mt-6">
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Programs</h2>
          <div v-if="activePrograms.length === 0" class="text-sm text-gray-400">
            No programs yet. Generate and approve one from the AI suggestions below.
          </div>
          <div v-else class="flex flex-col gap-5">
            <div v-for="program in activePrograms" :key="program._id"
              class="rounded-xl border border-gray-100 overflow-hidden transition-opacity"
              :class="{ 'opacity-50': program.status === 'completed' }">
              <!-- Program card header -->
              <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span class="text-sm font-semibold text-gray-800 flex-1 min-w-0 truncate">{{ program.title }}</span>
                <span class="text-xs text-gray-400 shrink-0">
                  {{ new Date(program.startDate).toLocaleDateString() }} –
                  {{ new Date(program.endDate).toLocaleDateString() }}
                </span>
                <span class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full" :class="program.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'">
                  {{ program.status === 'active' ? 'Active' : 'Completed' }}
                </span>
                <!-- Status toggle switch -->
                <button
                  class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none"
                  :class="program.status === 'active' ? 'bg-green-500' : 'bg-gray-300'"
                  @click="handleToggleProgramStatus(program)">
                  <span
                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200"
                    :class="program.status === 'active' ? 'translate-x-4' : 'translate-x-0.5'" />
                </button>
              </div>
              <!-- Collapsible days -->
              <div class="divide-y divide-gray-100">
                <div v-for="(day, di) in program.weeklySchedule" :key="di">
                  <button
                    class="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50/60 hover:bg-gray-100/80 text-left transition-colors"
                    @click="toggleProgramDay(program._id, di)">
                    <span class="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full shrink-0">
                      Day {{ day.day }}
                    </span>
                    <span class="text-xs font-medium text-gray-500 flex-1">{{ day.type }}</span>
                    <span class="text-xs text-gray-400 shrink-0">
                      {{ day.exercises.length }} exercise{{ day.exercises.length !== 1 ? 's' : '' }}
                    </span>
                    <svg class="w-4 h-4 text-gray-400 transition-transform shrink-0"
                      :class="{ 'rotate-180': isProgramDayOpen(program._id, di) }" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div v-if="isProgramDayOpen(program._id, di)" class="divide-y divide-gray-50">
                    <div v-for="(exercise, ei) in day.exercises" :key="ei" class="flex items-start gap-3 px-4 py-3">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800">{{ exercise.name }}</p>
                        <p v-if="exercise.notes" class="text-xs text-gray-400 mt-0.5">{{ exercise.notes }}</p>
                      </div>
                      <span
                        class="shrink-0 text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        {{ exercise.sets }} × {{ exercise.reps }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Workout Suggestions -->
      <div class="mt-6">
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div class="mb-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h2 class="text-base font-semibold text-gray-900">AI Workout Suggestions</h2>
                <p class="text-xs text-gray-400 mt-0.5">Generated based on client's XP, tier, measurements, and goals
                </p>
              </div>
            </div>
            <div class="mb-3">
              <label class="text-xs font-medium text-gray-500 mb-1 block">Trainer Notes (optional)</label>
              <textarea v-model="trainerNotes" rows="2"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                placeholder="e.g. Client has lower back pain, avoid deadlifts this week" />
            </div>
            <button :disabled="isAILoading"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleGetSuggestions">
              <svg v-if="isAILoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {{ isAILoading ? 'Generating…' : 'Get Suggestions' }}
            </button>
          </div>

          <p v-if="aiError" class="text-xs text-red-500">{{ aiError }}</p>

          <div v-if="suggestions" class="space-y-3">
            <h3 class="text-sm font-semibold text-violet-700">{{ suggestions.title }}</h3>
            <div v-for="(day, i) in suggestions.weeklySchedule" :key="i"
              class="rounded-xl border border-violet-100 overflow-hidden">
              <button
                class="w-full flex items-center justify-between px-4 py-3 bg-violet-50 text-left hover:bg-violet-100 transition-colors"
                @click="toggleDay(i)">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">Day {{ day.day
                    }}</span>
                  <span class="text-sm font-medium text-gray-800">{{ day.type }}</span>
                </div>
                <svg class="w-4 h-4 text-violet-400 transition-transform"
                  :class="{ 'rotate-180': openDayIndices.includes(i) }" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div v-if="openDayIndices.includes(i)" class="divide-y divide-gray-50">
                <div v-for="(exercise, j) in day.exercises" :key="j" class="flex items-start gap-3 px-4 py-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800">{{ exercise.name }}</p>
                    <p v-if="exercise.notes" class="text-xs text-gray-500 mt-0.5">{{ exercise.notes }}</p>
                  </div>
                  <span class="shrink-0 text-xs font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                    {{ exercise.sets }} × {{ exercise.reps }}
                  </span>
                </div>
              </div>
            </div>

            <p v-if="createProgramError" class="text-xs text-red-500">{{ createProgramError }}</p>
            <p v-if="createProgramSuccess" class="text-xs text-green-600 font-medium">Program saved successfully.</p>

            <button :disabled="isCreatingProgram || createProgramSuccess"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleSaveProgram">
              <svg v-if="isCreatingProgram" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ isCreatingProgram ? 'Saving…' : 'Approve & Save as Program' }}
            </button>
          </div>

          <p v-else-if="!isAILoading && !aiError" class="text-sm text-gray-400">
            Click "Get Suggestions" to generate a personalised workout plan for this client.
          </p>
        </div>
      </div>
    </template>

    <!-- Edit Goal Modal -->
    <div v-if="isEditingGoal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      @click.self="isEditingGoal = false">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 class="text-base font-semibold text-gray-900 mb-4">Edit Client Goal</h3>
        <select v-model="editGoalValue"
          class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white mb-4">
          <option value="" disabled>Select a goal…</option>
          <option v-for="option in goalOptions" :key="option" :value="option">{{ option }}</option>
        </select>
        <div class="flex gap-3">
          <button
            class="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            @click="isEditingGoal = false">
            Cancel
          </button>
          <button :disabled="!editGoalValue"
            class="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
            @click="handleSaveGoal">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
