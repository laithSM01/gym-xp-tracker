<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useClientNutrition } from '@/composables/useClientNutrition'
import { tierConfig, formatDate } from '@/utils/xp'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

const { data, actions } = useClientNutrition(clientId)
const {
  client,
  measurements,
  existingPlan,
  latestMeasurement,
  meals,
  totalCalories,
  notes,
  computedTotalCalories,
  isSaving,
  saveError,
  saveSuccess,
} = data
const { addMeal, removeMeal, savePlan } = actions
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
