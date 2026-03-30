<script setup lang="ts">
import { ref, inject, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

const route = useRoute()
const router = useRouter()
const convex = inject<ConvexClient>('convex')!

const clientId = route.params.clientId as string

type Tier = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'

type ClientDetail = {
  _id: string
  userName: string
  userEmail?: string
  age: number
  goal: string
  currentXP: number
  currentTier: Tier
}

type Measurement = {
  _id: string
  weight: number
  bodyFat: number
  muscleMass: number
  notes?: string
  timestamp: number
}

type Meal = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

type NutritionPlan = {
  _id: string
  meals: Meal[]
  totalCalories: number
  notes?: string
}

const client = ref<ClientDetail | null>(null)
const measurements = ref<Measurement[] | null>(null)
const existingPlan = ref<NutritionPlan | null | undefined>(undefined)

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

const { unsubscribe: unsubPlan } = convex.onUpdate(
  api.nutritionPlans.getNutritionPlan,
  { clientId: clientId as Id<'clients'> },
  (data) => {
    existingPlan.value = data as NutritionPlan | null
    if (data) {
      const plan = data as NutritionPlan
      meals.value = plan.meals.map((m) => ({ ...m }))
      totalCalories.value = plan.totalCalories
      notes.value = plan.notes ?? ''
    }
  },
)

onUnmounted(() => {
  unsubClient()
  unsubMeasurements()
  unsubPlan()
})

// Form state
const meals = ref<Meal[]>([
  { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 },
])
const totalCalories = ref(0)
const notes = ref('')
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

function addMeal() {
  meals.value.push({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
}

function removeMeal(index: number) {
  meals.value.splice(index, 1)
}

const computedTotalCalories = computed(() =>
  meals.value.reduce((sum, m) => sum + (m.calories || 0), 0),
)

async function savePlan() {
  if (!meals.value.length) return
  isSaving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    await convex.mutation(api.nutritionPlans.upsertNutritionPlan, {
      clientId: clientId as Id<'clients'>,
      meals: meals.value.map((m) => ({
        name: m.name,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
      })),
      totalCalories: totalCalories.value || computedTotalCalories.value,
      notes: notes.value.trim() || undefined,
    })
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (e: unknown) {
    saveError.value = e instanceof Error ? e.message : 'Failed to save plan'
  } finally {
    isSaving.value = false
  }
}

// Tier config
const tierConfig: Record<Tier, { label: string; badge: string; bar: string }> = {
  beginner: {
    label: 'Beginner',
    badge: 'bg-gray-100 text-gray-700 ring-gray-200',
    bar: 'bg-gray-400',
  },
  novice: {
    label: 'Novice',
    badge: 'bg-blue-100 text-blue-700 ring-blue-200',
    bar: 'bg-blue-500',
  },
  intermediate: {
    label: 'Intermediate',
    badge: 'bg-amber-100 text-amber-700 ring-amber-200',
    bar: 'bg-amber-500',
  },
  advanced: {
    label: 'Advanced',
    badge: 'bg-purple-100 text-purple-700 ring-purple-200',
    bar: 'bg-purple-500',
  },
  elite: {
    label: 'Elite',
    badge: 'bg-green-100 text-green-700 ring-green-200',
    bar: 'bg-green-500',
  },
}

const latestMeasurement = computed(() =>
  measurements.value && measurements.value.length > 0 ? measurements.value[0] : null,
)

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div>
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
      <div class="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>

    <template v-else>
      <!-- Client info card -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ client.userName }}</h1>
            <p v-if="client.userEmail" class="text-sm text-gray-400 mt-0.5">{{ client.userEmail }}</p>
            <p class="text-sm text-gray-500 mt-1">Age {{ client.age }} · {{ client.goal }}</p>
          </div>
          <span
            class="shrink-0 text-sm font-semibold px-3 py-1 rounded-full ring-1"
            :class="tierConfig[client.currentTier].badge"
          >
            {{ tierConfig[client.currentTier].label }}
          </span>
        </div>

        <!-- Latest measurements -->
        <div v-if="latestMeasurement" class="mt-5 pt-5 border-t border-gray-100">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Latest Measurements
            <span class="font-normal normal-case ml-1">({{ formatDate(latestMeasurement.timestamp) }})</span>
          </p>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-xl font-bold text-gray-900">{{ latestMeasurement.weight }}<span class="text-sm font-normal text-gray-400 ml-0.5">kg</span></p>
              <p class="text-xs text-gray-400 mt-0.5">Weight</p>
            </div>
            <div class="text-center">
              <p class="text-xl font-bold text-gray-900">{{ latestMeasurement.bodyFat }}<span class="text-sm font-normal text-gray-400 ml-0.5">%</span></p>
              <p class="text-xs text-gray-400 mt-0.5">Body Fat</p>
            </div>
            <div class="text-center">
              <p class="text-xl font-bold text-gray-900">{{ latestMeasurement.muscleMass }}<span class="text-sm font-normal text-gray-400 ml-0.5">kg</span></p>
              <p class="text-xs text-gray-400 mt-0.5">Muscle Mass</p>
            </div>
          </div>
        </div>
        <div v-else-if="measurements !== null" class="mt-4 text-sm text-gray-400">
          No measurements recorded yet.
        </div>
      </div>

      <!-- Nutrition plan form -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900">Nutrition Plan</h2>
          <span v-if="existingPlan" class="text-xs text-teal-600 font-medium bg-teal-50 px-2.5 py-1 rounded-full">
            Saved plan
          </span>
        </div>

        <!-- Meals list -->
        <div class="flex flex-col gap-4 mb-6">
          <div
            v-for="(meal, index) in meals"
            :key="index"
            class="rounded-xl border border-gray-200 p-4 bg-gray-50"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-700">Meal {{ index + 1 }}</span>
              <button
                v-if="meals.length > 1"
                class="text-xs text-gray-400 hover:text-red-500 transition-colors"
                @click="removeMeal(index)"
              >
                Remove
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="sm:col-span-2">
                <label class="text-xs font-medium text-gray-500 mb-1 block">Meal name</label>
                <input
                  v-model="meal.name"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  placeholder="e.g. Breakfast, Post-workout snack…"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Calories (kcal)</label>
                <input
                  v-model.number="meal.calories"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  placeholder="500"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Protein (g)</label>
                <input
                  v-model.number="meal.protein"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  placeholder="40"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Carbs (g)</label>
                <input
                  v-model.number="meal.carbs"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  placeholder="60"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 mb-1 block">Fat (g)</label>
                <input
                  v-model.number="meal.fat"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  placeholder="15"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Add meal button -->
        <button
          class="w-full py-2.5 mb-6 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
          @click="addMeal"
        >
          + Add meal
        </button>

        <!-- Totals & notes -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Total Calories (kcal)</label>
            <input
              v-model.number="totalCalories"
              type="number"
              min="0"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              :placeholder="computedTotalCalories.toString()"
            />
            <p class="text-xs text-gray-400 mt-1">
              Sum from meals: {{ computedTotalCalories.toLocaleString() }} kcal
            </p>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Notes (optional)</label>
            <textarea
              v-model="notes"
              rows="3"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              placeholder="Any dietary notes, restrictions, or goals…"
            />
          </div>
        </div>

        <!-- Save -->
        <div class="flex items-center gap-3">
          <button
            :disabled="isSaving || meals.length === 0"
            class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            @click="savePlan"
          >
            {{ isSaving ? 'Saving…' : existingPlan ? 'Update Plan' : 'Save Plan' }}
          </button>
          <p v-if="saveSuccess" class="text-sm text-green-600 font-medium">
            Plan saved successfully!
          </p>
          <p v-if="saveError" class="text-sm text-red-500">{{ saveError }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
