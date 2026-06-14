<script setup lang="ts">
import { useTrainerSetup } from '@/composables/useTrainerSetup'

const {
  bio, certifications, certInput, specializations, specInput,
  yearsOfExperience, instagramHandle,
  profilePreview, coverPreview,
  isSubmitting, submitError, isFormValid,
  addCertification, removeCertification,
  addSpecialization, removeSpecialization,
  onProfileChange, onCoverChange, submit,
} = useTrainerSetup()
</script>

<template>
  <div class="max-w-2xl mx-auto py-10 px-4">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-gray-900">Set up your trainer profile</h1>
      <p class="text-gray-500 text-sm mt-1">This is how you'll appear to potential clients on the marketplace.</p>
    </div>

    <form @submit.prevent="submit" class="flex flex-col gap-6">

      <!-- Profile photo -->
      <div class="flex items-center gap-5">
        <div class="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
          <img v-if="profilePreview" :src="profilePreview" class="w-full h-full object-cover" />
          <span v-else class="text-3xl">👤</span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">Profile photo <span class="text-gray-400">(optional)</span></label>
          <label class="cursor-pointer text-sm text-purple-600 font-medium hover:text-purple-700">
            Choose photo
            <input type="file" accept="image/*" class="hidden" @change="onProfileChange" />
          </label>
        </div>
      </div>

      <!-- Cover photo -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Cover photo <span class="text-gray-400">(optional)</span></label>
        <label class="relative w-full h-28 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer group">
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

      <!-- Bio -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-700">About you <span class="text-gray-400">(optional)</span></label>
        <textarea
          v-model="bio"
          rows="3"
          placeholder="Tell clients about your training philosophy and experience..."
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <!-- Specializations (required — at least 1) -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">
          Specializations <span class="text-red-500">*</span>
          <span class="text-gray-400 font-normal ml-1">(e.g. fat loss, muscle gain, sports rehab)</span>
        </label>
        <div class="flex gap-2">
          <input
            v-model="specInput"
            type="text"
            placeholder="Add specialization..."
            @keydown.enter.prevent="addSpecialization"
            class="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button type="button" @click="addSpecialization" class="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200">
            Add
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="spec in specializations"
            :key="spec"
            class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700"
          >
            {{ spec }}
            <button type="button" @click="removeSpecialization(spec)" class="text-teal-400 hover:text-teal-700 leading-none">×</button>
          </span>
        </div>
      </div>

      <!-- Certifications -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">
          Certifications <span class="text-gray-400 font-normal">(optional — e.g. ISSA, ACE, NASM)</span>
        </label>
        <div class="flex gap-2">
          <input
            v-model="certInput"
            type="text"
            placeholder="Add certification..."
            @keydown.enter.prevent="addCertification"
            class="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button type="button" @click="addCertification" class="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200">
            Add
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="cert in certifications"
            :key="cert"
            class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"
          >
            {{ cert }}
            <button type="button" @click="removeCertification(cert)" class="text-gray-400 hover:text-gray-700 leading-none">×</button>
          </span>
        </div>
      </div>

      <!-- Years of experience + Instagram -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Years of experience <span class="text-gray-400">(optional)</span></label>
          <input
            v-model.number="yearsOfExperience"
            type="number"
            min="0"
            max="50"
            placeholder="e.g. 5"
            class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700">Instagram <span class="text-gray-400">(optional)</span></label>
          <input
            v-model="instagramHandle"
            type="text"
            placeholder="@yourhandle"
            class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <!-- Error -->
      <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="!isFormValid || isSubmitting"
        class="py-2.5 px-6 rounded-lg bg-purple-600 text-white font-semibold text-sm transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isSubmitting ? 'Creating profile...' : 'Create trainer profile' }}
      </button>

    </form>
  </div>
</template>
