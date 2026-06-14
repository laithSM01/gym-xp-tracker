<script setup lang="ts">
import { useGymSetup } from '@/composables/useGymSetup'

const {
  name, city, location, bio, facilities, priceMin, priceMax,
  logoPreview, coverPreview,
  isSubmitting, submitError, isFormValid,
  facilityOptions, toggleFacility, onLogoChange, onCoverChange, submit,
} = useGymSetup()
</script>

<template>
  <div class="max-w-2xl mx-auto py-10 px-4">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-gray-900">Set up your gym profile</h1>
      <p class="text-gray-500 text-sm mt-1">This is how your gym will appear on the marketplace.</p>
    </div>

    <form @submit.prevent="submit" class="flex flex-col gap-6">

      <!-- Gym name -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700">Gym name <span class="text-red-500">*</span></label>
        <input
          v-model="name"
          type="text"
          placeholder="e.g. Iron House Gym"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <!-- City + Location -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">City <span class="text-red-500">*</span></label>
          <input
            v-model="city"
            type="text"
            placeholder="e.g. Amman"
            class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Address <span class="text-red-500">*</span></label>
          <input
            v-model="location"
            type="text"
            placeholder="e.g. Sweifieh, 3rd Circle"
            class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <!-- Bio -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700">About your gym <span class="text-gray-400">(optional)</span></label>
        <textarea
          v-model="bio"
          rows="3"
          placeholder="Tell clients what makes your gym special..."
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <!-- Facilities -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Facilities</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="f in facilityOptions"
            :key="f"
            type="button"
            @click="toggleFacility(f)"
            class="text-xs px-3 py-1.5 rounded-full border transition-colors capitalize"
            :class="facilities.includes(f)
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'"
          >
            {{ f }}
          </button>
        </div>
      </div>

      <!-- Price range -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700">Monthly price range (JOD) <span class="text-red-500">*</span></label>
        <div class="flex items-center gap-3">
          <input
            v-model.number="priceMin"
            type="number"
            min="0"
            placeholder="Min"
            class="w-24 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span class="text-gray-400 text-sm">to</span>
          <input
            v-model.number="priceMax"
            type="number"
            min="0"
            placeholder="Max"
            class="w-24 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span class="text-gray-400 text-sm">JOD / month</span>
        </div>
      </div>

      <!-- Logo upload -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Logo <span class="text-gray-400">(optional)</span></label>
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50"
          >
            <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" />
            <span v-else class="text-2xl">🏋️</span>
          </div>
          <label class="cursor-pointer text-sm text-purple-600 font-medium hover:text-purple-700">
            Choose file
            <input type="file" accept="image/*" class="hidden" @change="onLogoChange" />
          </label>
        </div>
      </div>

      <!-- Cover photo -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Cover photo <span class="text-gray-400">(optional)</span></label>
        <label class="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer group">
          <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover" />
          <span v-else class="text-sm text-purple-600 font-medium group-hover:text-purple-700">Choose cover photo</span>
          <span
            v-if="coverPreview"
            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium"
          >
            Change photo
          </span>
          <input type="file" accept="image/*" class="hidden" @change="onCoverChange" />
        </label>
      </div>

      <!-- Error -->
      <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="!isFormValid || isSubmitting"
        class="py-2.5 px-6 rounded-lg bg-purple-600 text-white font-semibold text-sm transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isSubmitting ? 'Creating profile...' : 'Create gym profile' }}
      </button>

    </form>
  </div>
</template>
