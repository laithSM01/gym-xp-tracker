<script setup lang="ts">
import { useClientSetup, SPORT_OPTIONS, HEALTH_OPTIONS, GOALS } from '@/composables/useClientSetup'

const {
  step,
  age, gender, height, weight, city,
  goal, sportTypes, trainingExperience, preferredTrainingDays,
  healthConditions, injuryNotes,
  isSubmitting, submitError,
  step1Valid, step2Valid,
  toggleSport, toggleHealth,
  nextStep, prevStep, submit,
} = useClientSetup()

const TRAINING_DAYS = [
  { value: '2-3', label: '2–3 days/week' },
  { value: '3-4', label: '3–4 days/week' },
  { value: '4-5', label: '4–5 days/week' },
  { value: '5-6', label: '5–6 days/week' },
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Complete beginner' },
  { value: 'some_experience', label: 'Some experience (< 1 yr)' },
  { value: 'intermediate', label: 'Intermediate (1–3 yrs)' },
  { value: 'advanced', label: 'Advanced (3+ yrs)' },
]
</script>

<template>
  <div class="max-w-xl mx-auto py-10 px-4">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-black text-gray-900">Create your profile</h1>
      <p class="text-gray-500 text-sm mt-1">Tell us about yourself so we can match you with the right trainer or gym.</p>

      <!-- Step indicator -->
      <div class="flex items-center gap-2 mt-5">
        <div
          v-for="s in [1, 2, 3]"
          :key="s"
          class="h-1.5 flex-1 rounded-full transition-colors"
          :class="s <= step ? 'bg-teal-500' : 'bg-gray-200'"
        />
      </div>
      <p class="text-xs text-gray-400 mt-2">Step {{ step }} of 3</p>
    </div>

    <!-- ── Step 1: Physical Info ─────────────────────────────────────────────── -->
    <form v-if="step === 1" class="flex flex-col gap-5" @submit.prevent="nextStep">
      <h2 class="text-base font-semibold text-gray-800">Physical information</h2>

      <!-- Age + Gender -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Age <span class="text-red-500">*</span></label>
          <input
            v-model.number="age"
            type="number"
            min="14"
            max="80"
            placeholder="e.g. 25"
            class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Gender <span class="text-red-500">*</span></label>
          <div class="flex gap-2 h-[38px]">
            <button
              type="button"
              class="flex-1 rounded-lg border text-sm font-medium transition-colors"
              :class="gender === 'male' ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600 hover:border-teal-400'"
              @click="gender = 'male'"
            >Male</button>
            <button
              type="button"
              class="flex-1 rounded-lg border text-sm font-medium transition-colors"
              :class="gender === 'female' ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600 hover:border-teal-400'"
              @click="gender = 'female'"
            >Female</button>
          </div>
        </div>
      </div>

      <!-- Height + Weight -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Height (cm) <span class="text-red-500">*</span></label>
          <input
            v-model.number="height"
            type="number"
            min="100"
            max="250"
            placeholder="e.g. 175"
            class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Current weight (kg) <span class="text-red-500">*</span></label>
          <input
            v-model.number="weight"
            type="number"
            min="30"
            max="300"
            placeholder="e.g. 80"
            class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <!-- City -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700">City <span class="text-red-500">*</span></label>
        <input
          v-model="city"
          type="text"
          placeholder="e.g. Amman"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <button
        type="submit"
        :disabled="!step1Valid"
        class="py-2.5 px-6 rounded-lg bg-teal-600 text-white font-semibold text-sm transition-colors hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next — Fitness Profile
      </button>
    </form>

    <!-- ── Step 2: Fitness Profile ───────────────────────────────────────────── -->
    <form v-else-if="step === 2" class="flex flex-col gap-5" @submit.prevent="nextStep">
      <h2 class="text-base font-semibold text-gray-800">Fitness profile</h2>

      <!-- Primary Goal -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Primary goal <span class="text-red-500">*</span></label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="g in GOALS"
            :key="g"
            type="button"
            class="py-2 px-3 rounded-lg border text-sm font-medium text-left transition-colors"
            :class="goal === g ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600 hover:border-teal-400'"
            @click="goal = g"
          >{{ g }}</button>
        </div>
      </div>

      <!-- Sport interests -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Sport interests <span class="text-red-500">*</span> <span class="text-gray-400 font-normal">(pick at least one)</span></label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="sport in SPORT_OPTIONS"
            :key="sport.value"
            type="button"
            class="px-3 py-1.5 rounded-full border text-sm font-medium transition-colors"
            :class="sportTypes.includes(sport.value) ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600 hover:border-teal-400'"
            @click="toggleSport(sport.value)"
          >{{ sport.label }}</button>
        </div>
      </div>

      <!-- Training experience -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Training experience <span class="text-red-500">*</span></label>
        <div class="flex flex-col gap-2">
          <button
            v-for="exp in EXPERIENCE_LEVELS"
            :key="exp.value"
            type="button"
            class="py-2.5 px-4 rounded-lg border text-sm font-medium text-left transition-colors"
            :class="trainingExperience === exp.value ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600 hover:border-teal-400'"
            @click="trainingExperience = exp.value as typeof trainingExperience"
          >{{ exp.label }}</button>
        </div>
      </div>

      <!-- Training days -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Preferred training days/week <span class="text-red-500">*</span></label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="d in TRAINING_DAYS"
            :key="d.value"
            type="button"
            class="py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors"
            :class="preferredTrainingDays === d.value ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-gray-600 hover:border-teal-400'"
            @click="preferredTrainingDays = d.value as typeof preferredTrainingDays"
          >{{ d.label }}</button>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="button" class="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50" @click="prevStep">
          Back
        </button>
        <button
          type="submit"
          :disabled="!step2Valid"
          class="flex-[2] py-2.5 rounded-lg bg-teal-600 text-white font-semibold text-sm transition-colors hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next — Health & Safety
        </button>
      </div>
    </form>

    <!-- ── Step 3: Health & Safety ───────────────────────────────────────────── -->
    <form v-else class="flex flex-col gap-5" @submit.prevent="submit">
      <h2 class="text-base font-semibold text-gray-800">Health & safety <span class="text-gray-400 font-normal text-sm">(optional)</span></h2>

      <!-- Health conditions -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Any health conditions?</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="condition in HEALTH_OPTIONS"
            :key="condition"
            type="button"
            class="px-3 py-1.5 rounded-full border text-sm font-medium transition-colors"
            :class="healthConditions.includes(condition) ? 'bg-red-100 text-red-700 border-red-300' : 'border-gray-300 text-gray-600 hover:border-gray-400'"
            @click="toggleHealth(condition)"
          >{{ condition }}</button>
        </div>
      </div>

      <!-- Injury notes -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700">Injuries or physical limitations</label>
        <textarea
          v-model="injuryNotes"
          rows="3"
          placeholder="Describe any injuries or limitations your trainer should know about..."
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>

      <div class="flex gap-3">
        <button type="button" class="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50" @click="prevStep">
          Back
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex-[2] py-2.5 rounded-lg bg-teal-600 text-white font-semibold text-sm transition-colors hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Creating profile...' : 'Complete setup' }}
        </button>
      </div>
    </form>
  </div>
</template>
