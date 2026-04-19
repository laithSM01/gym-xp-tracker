<script setup lang="ts">
import { useClientDashboard, tierConfig, tierMin, tierMax, xpProgress, formatDate } from '@/composables/useClientDashboard'

const { data, loading: isLoading, actions } = useClientDashboard()
const { profile, challenges, nutritionPlan, programs, recentMeasurements, completingChallengeId } = data
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

    <template v-else>
      <!-- Welcome header + XP card -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div class="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Welcome back, {{ profile.userName }}</h1>
            <p class="text-sm text-gray-500 mt-1">{{ profile.goal }} · Age {{ profile.age }}</p>
          </div>
          <span
            class="shrink-0 text-sm font-semibold px-3 py-1 rounded-full ring-1"
            :class="tierConfig[profile.currentTier].badge"
          >
            {{ tierConfig[profile.currentTier].label }}
          </span>
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

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left column: measurements + nutrition -->
        <div class="flex flex-col gap-6">
          <!-- Recent measurements -->
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

          <!-- Nutrition Plan -->
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
        </div><!-- end left column -->

        <!-- Challenges + Programs -->
        <div class="flex flex-col gap-6">
          <!-- Active Program -->
          <div v-if="programs && programs.length > 0" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Active Program</h2>
            <div class="flex flex-col gap-5">
              <div
                v-for="program in programs"
                :key="program._id"
                class="rounded-xl border border-gray-100 overflow-hidden"
              >
                <div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span class="text-sm font-semibold text-gray-800">{{ program.title }}</span>
                  <span class="text-xs text-gray-400">
                    {{ new Date(program.startDate).toLocaleDateString() }} –
                    {{ new Date(program.endDate).toLocaleDateString() }}
                  </span>
                </div>
                <div class="divide-y divide-gray-50">
                  <div
                    v-for="(exercise, i) in program.exercises"
                    :key="i"
                    class="flex items-start gap-3 px-4 py-3"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-800">{{ exercise.name }}</p>
                      <p v-if="exercise.notes" class="text-xs text-gray-400 mt-0.5">{{ exercise.notes }}</p>
                    </div>
                    <span class="shrink-0 text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      {{ exercise.sets }} × {{ exercise.reps }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Active -->
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

          <!-- Completed -->
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
      </div>

    </template>
  </div>
</template>
