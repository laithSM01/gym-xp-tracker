<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useTrainerPublicPage } from '@/composables/useTrainerPublicPage'
import type { Id } from '../../../convex/_generated/dataModel'

const route = useRoute()
const trainerProfileId = route.params.trainerProfileId as Id<'personalTrainers'>

const { page, ctaState, sendJoinRequest } = useTrainerPublicPage(trainerProfileId)

const CATEGORY_LABELS: Record<string, string> = {
  supplement: 'Supplement',
  equipment: 'Equipment',
  food: 'Food',
  digital_program: 'Digital Program',
  session: 'Session',
}

let isJoining = false
async function handleJoin() {
  if (isJoining) return
  isJoining = true
  try {
    await sendJoinRequest()
  } finally {
    isJoining = false
  }
}
</script>

<template>
  <!-- Loading -->
  <div v-if="page === undefined" class="flex items-center justify-center min-h-screen">
    <div class="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
  </div>

  <!-- Not found -->
  <div v-else-if="page === null" class="flex flex-col items-center justify-center min-h-screen gap-4 text-gray-500">
    <p class="text-xl font-semibold">Trainer not found</p>
    <RouterLink to="/" class="text-sm text-purple-600 hover:underline">Back to marketplace</RouterLink>
  </div>

  <!-- Profile -->
  <div v-else>
    <!-- Cover banner -->
    <div
      class="relative w-full h-56 sm:h-72 bg-gradient-to-br from-teal-700 to-gray-900 overflow-hidden"
    >
      <img
        v-if="page.trainerProfile.coverPhotoUrl"
        :src="page.trainerProfile.coverPhotoUrl"
        :alt="page.name"
        class="w-full h-full object-cover opacity-70"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div class="absolute bottom-5 left-6 flex items-end gap-4">
        <div
          class="w-16 h-16 rounded-full border-2 border-white/40 overflow-hidden flex items-center justify-center bg-teal-100 flex-shrink-0"
        >
          <img
            v-if="page.trainerProfile.profilePhotoUrl"
            :src="page.trainerProfile.profilePhotoUrl"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-2xl font-bold text-teal-700">
            {{ page.name.charAt(0).toUpperCase() }}
          </span>
        </div>
        <div>
          <h1 class="text-2xl font-black text-white leading-tight">{{ page.name }}</h1>
          <p class="text-sm text-white/70">Personal Trainer</p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-10">

      <!-- Bio + Quick stats -->
      <section class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
          <span v-if="page.trainerProfile.yearsOfExperience">
            {{ page.trainerProfile.yearsOfExperience }} year{{ page.trainerProfile.yearsOfExperience === 1 ? '' : 's' }} experience
          </span>
          <a
            v-if="page.trainerProfile.instagramHandle"
            :href="`https://instagram.com/${page.trainerProfile.instagramHandle}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-purple-600 hover:underline"
          >
            @{{ page.trainerProfile.instagramHandle }}
          </a>
        </div>
        <p v-if="page.trainerProfile.bio" class="text-gray-700 leading-relaxed">
          {{ page.trainerProfile.bio }}
        </p>
      </section>

      <!-- Specializations -->
      <section v-if="page.trainerProfile.specializations.length">
        <h2 class="text-lg font-bold text-gray-900 mb-3">Specializations</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="spec in page.trainerProfile.specializations"
            :key="spec"
            class="text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-700 font-medium"
          >
            {{ spec }}
          </span>
        </div>
      </section>

      <!-- Certifications -->
      <section v-if="page.trainerProfile.certifications.length">
        <h2 class="text-lg font-bold text-gray-900 mb-3">Certifications</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="cert in page.trainerProfile.certifications"
            :key="cert"
            class="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700"
          >
            {{ cert }}
          </span>
        </div>
      </section>

      <!-- Products -->
      <section v-if="page.products.length > 0">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Products & Services</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="product in page.products"
            :key="String(product._id)"
            class="border border-gray-200 rounded-xl overflow-hidden bg-white"
          >
            <div class="h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                v-if="product.imageUrl"
                :src="product.imageUrl"
                :alt="product.name"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-3xl text-gray-300">📦</span>
            </div>
            <div class="p-3 flex flex-col gap-1">
              <span class="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 self-start font-medium">
                {{ CATEGORY_LABELS[product.category] }}
              </span>
              <p class="text-sm font-semibold text-gray-900">{{ product.name }}</p>
              <p class="text-xs text-gray-500 line-clamp-2">{{ product.description }}</p>
              <p class="text-sm font-bold text-teal-700 mt-1">{{ product.priceJod }} JOD</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="border-t border-gray-100 pt-8">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p class="text-lg font-bold text-gray-900">Work with {{ page.name }}</p>
            <p class="text-sm text-gray-500">Send a join request to get started.</p>
          </div>

          <RouterLink
            v-if="ctaState === 'unauthenticated'"
            :to="`/sign-in?redirect_url=/trainer/${trainerProfileId}`"
            class="px-6 py-2.5 rounded-lg bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition-colors"
          >
            Sign in to join
          </RouterLink>

          <button
            v-else-if="ctaState === 'join'"
            @click="handleJoin"
            class="px-6 py-2.5 rounded-lg bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition-colors"
          >
            Request to Join
          </button>

          <span
            v-else-if="ctaState === 'pending'"
            class="px-4 py-2 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm font-medium"
          >
            Request pending
          </span>

          <span
            v-else-if="ctaState === 'approved'"
            class="px-4 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm font-medium"
          >
            Request approved
          </span>

          <span
            v-else-if="ctaState === 'rejected'"
            class="px-4 py-2 rounded-lg bg-gray-50 text-gray-500 border border-gray-200 text-sm font-medium"
          >
            Request declined
          </span>
        </div>
      </section>

    </div>
  </div>
</template>
