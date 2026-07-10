<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClientDetail } from '@/composables/useClientDetail'
import { useClientAISuggestions } from '@/composables/useClientAISuggestions'
import { GOAL_OPTIONS } from '@/composables/useNewClient'
import { tierConfig, tierMin, tierMax, xpProgress, formatDate } from '@/utils/xp'
import type { Program } from '@/types/client'
import BaseCard from '@/components/ui/BaseCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Badge from '@/components/ui/Badge.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import FormField from '@/components/ui/FormField.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Toast from '@/components/ui/Toast.vue'
import { inputClass, selectClass, textareaClass } from '@/components/ui/formStyles'

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

// Transient success confirmations, surfaced as a single toast
const toastMessage = computed(() => {
  if (awardSuccess.value) return 'XP awarded successfully!'
  if (addChallengeSuccess.value) return 'Challenge added!'
  if (createProgramSuccess.value) return 'Program saved successfully.'
  return ''
})
const showToast = computed(() => !!toastMessage.value)
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Back -->
    <button class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      @click="router.back()">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to dashboard
    </button>

    <!-- Loading -->
    <div v-if="!client" class="flex items-center justify-center py-24">
      <div class="w-8 h-8 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
    </div>

    <template v-else>
      <!-- Client header card -->
      <BaseCard class="mb-6">
        <div class="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">{{ client.userName }}</h1>
            <p v-if="client.userEmail" class="text-sm text-slate-400 mt-0.5">{{ client.userEmail }}</p>
            <p class="text-sm text-slate-500 mt-1 flex items-center gap-2">
              Age {{ client.age }} · {{ client.goal }}
              <button class="text-slate-300 hover:text-slate-500 transition-colors" title="Edit goal"
                @click="openGoalModal">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z" />
                </svg>
              </button>
              <Badge tone="neutral">{{ client.sportTypes.join(', ') }}</Badge>
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <!-- Nutritionist access toggle -->
            <button :disabled="isTogglingAccess"
              class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50"
              :class="client.nutritionistAccess
                ? 'bg-brand-50 text-brand-600 border-brand-100 hover:bg-brand-100'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'"
              @click="actions.toggleNutritionistAccess()">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {{ client.nutritionistAccess ? 'Nutritionist: ON' : 'Nutritionist: OFF' }}
            </button>
            <Badge :badge-class="tierConfig[client.currentTier].badge">
              {{ tierConfig[client.currentTier].label }}
            </Badge>
          </div>
        </div>

        <!-- XP bar -->
        <div>
          <div class="flex justify-between items-baseline mb-2">
            <span class="text-3xl font-black text-slate-800">
              {{ client.currentXP.toLocaleString() }}
              <span class="text-lg font-semibold text-slate-400">XP</span>
            </span>
            <span v-if="tierConfig[client.currentTier].next" class="text-xs text-slate-400">
              Next: {{ tierConfig[client.currentTier].next }}
            </span>
            <span v-else class="text-xs font-semibold text-green-500">MAX TIER</span>
          </div>
          <ProgressBar
            size="md"
            :percent="xpProgress(client.currentXP, client.currentTier)"
            :bar-class="tierConfig[client.currentTier].bar"
          />
          <div class="flex justify-between text-xs text-slate-400 mt-1">
            <span>{{ tierMin[client.currentTier].toLocaleString() }}</span>
            <span v-if="client.currentTier !== 'elite'">
              {{ tierMax[client.currentTier].toLocaleString() }}
            </span>
          </div>
        </div>
      </BaseCard>

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Left: Award XP + XP History -->
        <div class="lg:col-span-1 flex flex-col gap-6">
          <!-- Award XP -->
          <BaseCard padding="p-5">
            <h2 class="text-base font-semibold text-slate-800 mb-4">Award XP</h2>
            <div class="flex flex-col gap-3">
              <FormField label="Amount">
                <input v-model.number="xpAmount" type="number" min="1" max="1000" placeholder="50" :class="inputClass" />
              </FormField>
              <FormField label="Reason">
                <input v-model="xpReason" type="text" placeholder="e.g. Completed weekly challenge"
                  :class="inputClass" @keydown.enter="handleAwardXP" />
              </FormField>
              <AppButton
                :loading="isAwarding"
                :disabled="!xpAmount || xpAmount <= 0 || !xpReason.trim()"
                @click="handleAwardXP"
              >
                {{ isAwarding ? 'Awarding…' : `+ Award ${xpAmount} XP` }}
              </AppButton>
              <p v-if="awardError" class="text-xs text-red-500 text-center">{{ awardError }}</p>
            </div>
          </BaseCard>

          <!-- XP History -->
          <BaseCard padding="p-5">
            <h2 class="text-base font-semibold text-slate-800 mb-4">XP History</h2>
            <EmptyState v-if="client.xpLogs.length === 0" message="No XP awarded yet." />
            <ul v-else class="flex flex-col divide-y divide-slate-50">
              <li v-for="log in client.xpLogs" :key="log._id"
                class="flex items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div class="min-w-0">
                  <p class="text-sm text-slate-700 leading-snug">{{ log.reason }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(log.createdAt) }}</p>
                </div>
                <span class="shrink-0 text-sm font-bold text-green-600">+{{ log.amount }}</span>
              </li>
            </ul>
          </BaseCard>
        </div>

        <!-- Right: Measurement History -->
        <div class="lg:col-span-2">
          <BaseCard padding="p-5">
            <h2 class="text-base font-semibold text-slate-800 mb-4">Measurement History</h2>
            <EmptyState v-if="!measurements || measurements.length === 0" message="No measurements logged yet." />
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs text-slate-400 border-b border-slate-100">
                    <th class="text-left pb-2 font-medium">Date</th>
                    <th class="text-right pb-2 font-medium">Weight</th>
                    <th class="text-right pb-2 font-medium">Body Fat</th>
                    <th class="text-right pb-2 font-medium">Muscle</th>
                    <th class="text-left pb-2 font-medium pl-4">Notes</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="m in measurements" :key="m._id" class="text-slate-700">
                    <td class="py-2.5 text-slate-500 text-xs">{{ formatDate(m.timestamp) }}</td>
                    <td class="py-2.5 text-right font-medium">{{ m.weight }} kg</td>
                    <td class="py-2.5 text-right">{{ m.bodyFat }}%</td>
                    <td class="py-2.5 text-right">{{ m.muscleMass }} kg</td>
                    <td class="py-2.5 pl-4 text-xs text-slate-400">{{ m.notes ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- Measurements section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Log measurement form -->
        <div class="lg:col-span-1">
          <BaseCard padding="p-5">
            <h2 class="text-base font-semibold text-slate-800 mb-4">Log Measurement</h2>
            <div class="flex flex-col gap-3">
              <div class="grid grid-cols-2 gap-3">
                <FormField label="Weight (kg)">
                  <input v-model="measWeight" type="number" step="0.1" min="0" placeholder="75.0" :class="inputClass" />
                </FormField>
                <FormField label="Body Fat (%)">
                  <input v-model="measBodyFat" type="number" step="0.1" min="0" max="100" placeholder="18.5" :class="inputClass" />
                </FormField>
              </div>
              <FormField label="Muscle Mass (kg)">
                <input v-model="measMuscleMass" type="number" step="0.1" min="0" placeholder="35.0" :class="inputClass" />
              </FormField>
              <FormField label="Notes (optional)">
                <input v-model="measNotes" type="text" placeholder="Post-session notes…" :class="inputClass" />
              </FormField>
              <AppButton
                :loading="isLogging"
                :disabled="!measWeight || !measBodyFat || !measMuscleMass"
                @click="handleLogMeasurement"
              >
                {{ isLogging ? 'Saving…' : 'Save Measurement' }}
              </AppButton>

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
          </BaseCard>
        </div>

        <!-- Challenges -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <!-- Active challenges -->
          <BaseCard padding="p-5">
            <h2 class="text-base font-semibold text-slate-800 mb-4">
              Active Challenges
              <span class="ml-2 text-xs font-normal text-slate-400">({{ activeChallenges.length }})</span>
            </h2>

            <!-- Add challenge form -->
            <div class="flex flex-col gap-3 mb-4 pb-4 border-b border-slate-100">
              <div class="grid grid-cols-2 gap-3">
                <FormField label="Title" class="col-span-2">
                  <input v-model="challengeTitle" type="text" placeholder="e.g. 30-day plank streak"
                    :class="inputClass" @keydown.enter="handleAddChallenge" />
                </FormField>
                <FormField label="Description" class="col-span-2">
                  <input v-model="challengeDescription" type="text"
                    placeholder="e.g. Hold a plank for 60s every day for 30 days" :class="inputClass" />
                </FormField>
                <FormField label="XP Reward">
                  <input v-model.number="challengeXpReward" type="number" min="1" placeholder="100" :class="inputClass" />
                </FormField>
                <div class="flex items-end">
                  <AppButton
                    class="w-full"
                    :loading="isAddingChallenge"
                    :disabled="!challengeTitle.trim() || !challengeDescription.trim() || challengeXpReward <= 0"
                    @click="handleAddChallenge"
                  >
                    + Add Challenge
                  </AppButton>
                </div>
              </div>
              <p v-if="addChallengeError" class="text-xs text-red-500">{{ addChallengeError }}</p>
            </div>

            <EmptyState v-if="activeChallenges.length === 0" message="No active challenges." />
            <ul v-else class="flex flex-col gap-3">
              <li v-for="c in activeChallenges" :key="c._id"
                class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div class="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-800">{{ c.title }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ c.description }}</p>
                </div>
                <Badge tone="amber">+{{ c.xpReward }} XP</Badge>
              </li>
            </ul>
          </BaseCard>

          <!-- Completed challenges -->
          <BaseCard v-if="completedChallenges.length > 0" padding="p-5">
            <h2 class="text-base font-semibold text-slate-800 mb-4">
              Completed
              <span class="ml-2 text-xs font-normal text-slate-400">({{ completedChallenges.length }})</span>
            </h2>
            <ul class="flex flex-col divide-y divide-slate-50">
              <li v-for="c in completedChallenges" :key="c._id"
                class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <svg class="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm text-slate-400 line-through flex-1">{{ c.title }}</span>
                <span v-if="c.completedAt" class="text-xs text-slate-300">{{ formatDate(c.completedAt) }}</span>
              </li>
            </ul>
          </BaseCard>
        </div>
      </div>

      <!-- Programs -->
      <div class="mt-6">
        <BaseCard padding="p-5">
          <h2 class="text-base font-semibold text-slate-800 mb-4">Programs</h2>
          <EmptyState
            v-if="activePrograms.length === 0"
            message="No programs yet. Generate and approve one from the AI suggestions below."
          />
          <div v-else class="flex flex-col gap-5">
            <div v-for="program in activePrograms" :key="program._id"
              class="rounded-2xl border border-slate-100 overflow-hidden transition-opacity"
              :class="{ 'opacity-50': program.status === 'completed' }">
              <!-- Program card header -->
              <div class="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <span class="text-sm font-semibold text-slate-800 flex-1 min-w-0 truncate">{{ program.title }}</span>
                <span class="text-xs text-slate-400 shrink-0">
                  {{ new Date(program.startDate).toLocaleDateString() }} –
                  {{ new Date(program.endDate).toLocaleDateString() }}
                </span>
                <Badge :tone="program.status === 'active' ? 'success' : 'neutral'">
                  {{ program.status === 'active' ? 'Active' : 'Completed' }}
                </Badge>
                <ToggleSwitch
                  :model-value="program.status === 'active'"
                  @update:model-value="handleToggleProgramStatus(program)"
                />
              </div>
              <!-- Collapsible days -->
              <div class="divide-y divide-slate-100">
                <div v-for="(day, di) in program.weeklySchedule" :key="di">
                  <button
                    class="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50/60 hover:bg-slate-100/80 text-left transition-colors"
                    @click="toggleProgramDay(program._id, di)">
                    <Badge tone="brand">Day {{ day.day }}</Badge>
                    <span class="text-xs font-medium text-slate-500 flex-1">{{ day.type }}</span>
                    <span class="text-xs text-slate-400 shrink-0">
                      {{ day.exercises.length }} exercise{{ day.exercises.length !== 1 ? 's' : '' }}
                    </span>
                    <svg class="w-4 h-4 text-slate-400 transition-transform shrink-0"
                      :class="{ 'rotate-180': isProgramDayOpen(program._id, di) }" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div v-if="isProgramDayOpen(program._id, di)" class="divide-y divide-slate-50">
                    <div v-for="(exercise, ei) in day.exercises" :key="ei" class="flex items-start gap-3 px-4 py-3">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-slate-800">{{ exercise.name }}</p>
                        <p v-if="exercise.notes" class="text-xs text-slate-400 mt-0.5">{{ exercise.notes }}</p>
                      </div>
                      <Badge tone="brand">{{ exercise.sets }} × {{ exercise.reps }}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- AI Workout Suggestions -->
      <div class="mt-6">
        <BaseCard padding="p-5">
          <div class="mb-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h2 class="text-base font-semibold text-slate-800">AI Workout Suggestions</h2>
                <p class="text-xs text-slate-400 mt-0.5">Generated based on client's XP, tier, measurements, and goals</p>
              </div>
            </div>
            <FormField label="Trainer Notes (optional)" class="mb-3">
              <textarea v-model="trainerNotes" rows="2" placeholder="e.g. Client has lower back pain, avoid deadlifts this week"
                :class="textareaClass" />
            </FormField>
            <AppButton :loading="isAILoading" @click="handleGetSuggestions">
              <svg v-if="!isAILoading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {{ isAILoading ? 'Generating…' : 'Get Suggestions' }}
            </AppButton>
          </div>

          <p v-if="aiError" class="text-xs text-red-500">{{ aiError }}</p>

          <div v-if="suggestions" class="space-y-3">
            <h3 class="text-sm font-semibold text-slate-800">{{ suggestions.title }}</h3>
            <div v-for="(day, i) in suggestions.weeklySchedule" :key="i"
              class="rounded-xl border border-brand-100 overflow-hidden">
              <button
                class="w-full flex items-center justify-between px-4 py-3 bg-brand-50 text-left hover:bg-brand-100 transition-colors"
                @click="toggleDay(i)">
                <div class="flex items-center gap-2">
                  <Badge tone="brand">Day {{ day.day }}</Badge>
                  <span class="text-sm font-medium text-slate-800">{{ day.type }}</span>
                </div>
                <svg class="w-4 h-4 text-brand-500 transition-transform"
                  :class="{ 'rotate-180': openDayIndices.includes(i) }" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div v-if="openDayIndices.includes(i)" class="divide-y divide-slate-50">
                <div v-for="(exercise, j) in day.exercises" :key="j" class="flex items-start gap-3 px-4 py-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-800">{{ exercise.name }}</p>
                    <p v-if="exercise.notes" class="text-xs text-slate-500 mt-0.5">{{ exercise.notes }}</p>
                  </div>
                  <Badge tone="brand">{{ exercise.sets }} × {{ exercise.reps }}</Badge>
                </div>
              </div>
            </div>

            <p v-if="createProgramError" class="text-xs text-red-500">{{ createProgramError }}</p>

            <AppButton
              class="w-full"
              :loading="isCreatingProgram"
              :disabled="createProgramSuccess"
              @click="handleSaveProgram"
            >
              <svg v-if="!isCreatingProgram" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ isCreatingProgram ? 'Saving…' : 'Approve & Save as Program' }}
            </AppButton>
          </div>

          <p v-else-if="!isAILoading && !aiError" class="text-sm text-slate-400">
            Click "Get Suggestions" to generate a personalised workout plan for this client.
          </p>
        </BaseCard>
      </div>
    </template>

    <!-- Edit Goal Modal -->
    <div v-if="isEditingGoal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      @click.self="isEditingGoal = false">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 class="text-base font-semibold text-slate-800 mb-4">Edit Client Goal</h3>
        <select v-model="editGoalValue" class="mb-4" :class="selectClass">
          <option value="" disabled>Select a goal…</option>
          <option v-for="option in goalOptions" :key="option" :value="option">{{ option }}</option>
        </select>
        <div class="flex gap-3">
          <AppButton variant="ghost" class="flex-1" @click="isEditingGoal = false">Cancel</AppButton>
          <AppButton class="flex-1" :disabled="!editGoalValue" @click="handleSaveGoal">Save</AppButton>
        </div>
      </div>
    </div>

    <!-- Success toast -->
    <Toast :show="showToast">
      <svg class="w-5 h-5 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="font-medium text-sm">{{ toastMessage }}</span>
    </Toast>
  </div>
</template>
