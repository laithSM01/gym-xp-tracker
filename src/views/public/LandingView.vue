<script setup lang="ts">
import { useLandingPage } from '@/composables/useLandingPage'
import type { PricingPlan } from '@/services/gyms.service'

const { gyms, trainers } = useLandingPage()

function formatPlans(plans: PricingPlan[]): string {
  if (!plans?.length) return 'See pricing'
  const min = Math.min(...plans.map((p) => p.priceJod))
  return `From ${min} JOD/mo`
}
</script>

<template>
  <!-- Hero -->
  <section class="bg-gray-900 text-white px-6 py-20 text-center">
    <h1 class="text-4xl font-black tracking-tight mb-4">
      Find your gym.<br />Find your trainer.
    </h1>
    <p class="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
      Jordan's fitness marketplace — browse gyms, connect with personal trainers, and track your progress.
    </p>
    <div class="flex justify-center gap-4 flex-wrap">
      <a
        href="#gyms"
        class="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
      >
        Browse gyms
      </a>
      <RouterLink
        to="/sign-in"
        class="px-6 py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
      >
        Join as trainer / gym
      </RouterLink>
    </div>
  </section>

  <!-- Gyms -->
  <section id="gyms" class="px-6 py-12 max-w-6xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Gyms</h2>

    <div v-if="gyms.length === 0" class="text-center py-16 text-gray-400">
      No gyms listed yet — check back soon.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <RouterLink
        v-for="gym in gyms"
        :key="gym._id"
        :to="`/gym/${gym._id}`"
        class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
      >
        <div>
          <h3 class="font-bold text-gray-900 text-lg leading-tight">{{ gym.name }}</h3>
          <p class="text-sm text-gray-500">{{ gym.city }} · {{ gym.location }}</p>
        </div>

        <p v-if="gym.bio" class="text-sm text-gray-600 line-clamp-2">{{ gym.bio }}</p>

        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="facility in gym.facilities.slice(0, 3)"
            :key="facility"
            class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
          >
            {{ facility }}
          </span>
          <span
            v-if="gym.facilities.length > 3"
            class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400"
          >
            +{{ gym.facilities.length - 3 }} more
          </span>
        </div>

        <div class="mt-auto pt-2 border-t border-gray-100 text-sm font-medium text-purple-700">
          {{ formatPlans(gym.pricingPlans) }}
        </div>
      </RouterLink>
    </div>
  </section>

  <!-- Trainers -->
  <section id="trainers" class="px-6 py-12 max-w-6xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Personal Trainers</h2>

    <div v-if="trainers.length === 0" class="text-center py-16 text-gray-400">
      No trainers listed yet — check back soon.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <RouterLink
        v-for="trainer in trainers"
        :key="trainer._id"
        :to="`/trainer/${trainer._id}`"
        class="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
            {{ trainer.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="font-bold text-gray-900 leading-tight">{{ trainer.name }}</h3>
            <span class="text-xs text-gray-500">
              Personal Trainer
              <template v-if="trainer.yearsOfExperience">
                · {{ trainer.yearsOfExperience }}y exp
              </template>
            </span>
          </div>
        </div>

        <p v-if="trainer.bio" class="text-sm text-gray-600 line-clamp-2">{{ trainer.bio }}</p>

        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="spec in trainer.specializations.slice(0, 3)"
            :key="spec"
            class="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700"
          >
            {{ spec }}
          </span>
        </div>

        <a
          v-if="trainer.instagramHandle"
          :href="`https://instagram.com/${trainer.instagramHandle}`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-auto"
          @click.stop
        >
          @{{ trainer.instagramHandle }}
        </a>
      </RouterLink>
    </div>
  </section>
</template>
