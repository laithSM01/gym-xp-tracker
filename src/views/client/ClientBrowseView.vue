<script setup lang="ts">
import { inject } from 'vue'
import type { GymService } from '@/services/gyms.service'
import type { TrainerService } from '@/services/trainers.service'
import type { Id } from '../../../convex/_generated/dataModel'
import { useJoinRequests } from '@/composables/useJoinRequests'

const gymsService = inject<GymService>('gymsService')!
const trainersService = inject<TrainerService>('trainersService')!

const gyms = gymsService.listPublic()
const trainers = trainersService.listPublic()

const {
  sendingTo,
  sendError,
  sendToGym,
  sendToTrainer,
  gymRequestStatus,
  trainerRequestStatus,
} = useJoinRequests()

function formatPlans(plans: { priceJod: number }[] | undefined) {
  if (!plans?.length) return 'See pricing'
  const min = Math.min(...plans.map((p) => p.priceJod))
  return `From ${min} JOD/mo`
}

function gymButtonLabel(gymId: Id<'gyms'>) {
  const status = gymRequestStatus(gymId)
  if (sendingTo.value === gymId) return 'Sending...'
  if (status === 'pending') return 'Request Sent'
  if (status === 'approved') return 'Joined'
  return 'Request to Join'
}

function gymButtonDisabled(gymId: Id<'gyms'>) {
  const status = gymRequestStatus(gymId)
  return !!sendingTo.value || status === 'pending' || status === 'approved'
}

function trainerButtonLabel(trainerProfileId: Id<'personalTrainers'>) {
  const status = trainerRequestStatus(trainerProfileId)
  if (sendingTo.value === trainerProfileId) return 'Sending...'
  if (status === 'pending') return 'Request Sent'
  if (status === 'approved') return 'Joined'
  return 'Request to Join'
}

function trainerButtonDisabled(trainerProfileId: Id<'personalTrainers'>) {
  const status = trainerRequestStatus(trainerProfileId)
  return !!sendingTo.value || status === 'pending' || status === 'approved'
}
</script>

<template>
  <div class="max-w-6xl mx-auto flex flex-col gap-10">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Find a Gym or Trainer</h1>
        <p class="text-sm text-gray-500 mt-1">Browse and send a join request to get started</p>
      </div>
    </div>

    <p v-if="sendError" class="text-sm text-red-600 -mt-6">{{ sendError }}</p>

    <!-- Gyms -->
    <section>
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Gyms</h2>

      <div v-if="gyms.length === 0" class="text-center py-12 text-gray-400 text-sm">
        No gyms listed yet — check back soon.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="gym in gyms"
          :key="gym._id"
          class="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 shadow-sm"
        >
          <div>
            <h3 class="font-bold text-gray-900 leading-tight">{{ gym.name }}</h3>
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

          <div class="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <span class="text-sm font-medium text-purple-700">
              {{ formatPlans(gym.pricingPlans) }}
            </span>
            <button
              :disabled="gymButtonDisabled(gym._id)"
              class="text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              :class="
                gymRequestStatus(gym._id) === 'approved'
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : gymRequestStatus(gym._id) === 'pending'
                    ? 'bg-gray-100 text-gray-500 cursor-default'
                    : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
              "
              @click="sendToGym(gym._id)"
            >
              {{ gymButtonLabel(gym._id) }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Personal Trainers -->
    <section>
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Personal Trainers</h2>

      <div v-if="trainers.length === 0" class="text-center py-12 text-gray-400 text-sm">
        No trainers listed yet — check back soon.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="trainer in trainers"
          :key="trainer._id"
          class="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0"
            >
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

          <div class="mt-auto pt-3 border-t border-gray-100 flex justify-end">
            <button
              :disabled="trainerButtonDisabled(trainer._id)"
              class="text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              :class="
                trainerRequestStatus(trainer._id) === 'approved'
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : trainerRequestStatus(trainer._id) === 'pending'
                    ? 'bg-gray-100 text-gray-500 cursor-default'
                    : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
              "
              @click="sendToTrainer(trainer._id)"
            >
              {{ trainerButtonLabel(trainer._id) }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
