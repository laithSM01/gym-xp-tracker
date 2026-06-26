<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { EffectCube } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-cube'
import { useLandingPage } from '@/composables/useLandingPage'
import { useJoinRequests } from '@/composables/useJoinRequests'
import { useAuthStore } from '@/stores/auth'
import type { PricingPlan } from '@/services/gyms.service'
import type { Id } from '../../../convex/_generated/dataModel'

const cubeModules = [EffectCube]
const cubeEffect = { shadow: false, slideShadows: true }

const { filteredGyms, filteredTrainers, search, selectedCity, activeTab } = useLandingPage()
const { sendingTo, sendError, sendToGym, gymRequestStatus } = useJoinRequests()
const authStore = useAuthStore()
const router = useRouter()

const CITIES = ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Salt']
const TABS = [
  { value: 'all' as const, label: 'All' },
  { value: 'gyms' as const, label: 'Gyms' },
  { value: 'trainers' as const, label: 'Trainers' },
]

const isClient = computed(() => authStore.convexUser?.role === 'client')

function formatPlans(plans: PricingPlan[]): string {
  if (!plans?.length) return ''
  const min = Math.min(...plans.map((p) => p.priceJod))
  return `From ${min} JOD / mo`
}

const GENDER_LABELS: Record<string, string> = {
  male: "Men's",
  female: "Ladies'",
  mixed: 'Mixed',
}
const GENDER_CLASSES: Record<string, string> = {
  male: 'bg-blue-100 text-blue-700',
  female: 'bg-pink-100 text-pink-700',
  mixed: 'bg-purple-100 text-purple-700',
}

function gymButtonLabel(gymId: Id<'gyms'>) {
  const status = gymRequestStatus(gymId)
  if (sendingTo.value === gymId) return 'Sending...'
  if (status === 'pending') return 'Request Sent'
  if (status === 'approved') return 'Member'
  return 'Request to Join'
}

function gymButtonDisabled(gymId: Id<'gyms'>) {
  const status = gymRequestStatus(gymId)
  return !!sendingTo.value || status === 'pending' || status === 'approved'
}

function gymButtonClass(gymId: Id<'gyms'>) {
  const status = gymRequestStatus(gymId)
  if (status === 'approved') return 'bg-green-100 text-green-700 cursor-default'
  if (status === 'pending') return 'bg-gray-100 text-gray-500 cursor-default'
  return 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
}

function handleJoinGym(gymId: Id<'gyms'>) {
  if (!authStore.isSignedIn) {
    router.push('/sign-in')
    return
  }
  sendToGym(gymId)
}
</script>

<template>
  <!-- Hero -->
  <section class="bg-gradient-to-br from-gray-900 to-purple-950 text-white px-6 py-16">
    <div class="max-w-3xl mx-auto text-center">
      <h1 class="text-4xl sm:text-5xl font-black tracking-tight mb-3">
        Find your gym or trainer in Jordan
      </h1>
      <p class="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
        Browse gyms and personal trainers, then send a join request in one click.
      </p>

      <!-- Search + city filter -->
      <div class="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
        <input v-model="search" type="text" placeholder="Search by name..."
          class="flex-1 px-4 py-3 rounded-xl text-white-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
        <select v-model="selectedCity"
          class="px-4 py-3 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
          <option value="all">All Cities</option>
          <option v-for="city in CITIES" :key="city" :value="city">{{ city }}</option>
        </select>
      </div>

      <!-- Result type tabs -->
      <div class="flex justify-center gap-2 mt-5">
        <button v-for="tab in TABS" :key="tab.value"
          class="px-5 py-2 rounded-full text-sm font-semibold transition-colors" :class="activeTab === tab.value
              ? 'bg-purple-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
            " @click="activeTab = tab.value">
          {{ tab.label }}
        </button>
      </div>
    </div>
  </section>

  <!-- Error banner -->
  <div v-if="sendError" class="bg-red-50 border-b border-red-200 px-6 py-3 text-sm text-red-700 text-center">
    {{ sendError }}
  </div>

  <!-- Results -->
  <div class="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-12">

    <!-- Gyms -->
    <section v-if="activeTab !== 'trainers'">
      <h2 class="text-xl font-bold text-gray-900 mb-6">
        Gyms
        <span v-if="filteredGyms.length" class="ml-2 text-sm font-normal text-gray-400">
          {{ filteredGyms.length }} listed
        </span>
      </h2>

      <p v-if="filteredGyms.length === 0" class="text-center py-16 text-gray-400">
        No gyms match your search — try a different city or keyword.
      </p>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <div v-for="gym in filteredGyms" :key="gym._id" class="relative">
          <!-- Sits above the Swiper in z-order — never touched by Swiper's pointer capture -->
          <RouterLink :to="`/gym/${gym._id}`"
            class="absolute bottom-14 left-4 z-20 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-purple-700 hover:bg-white shadow transition-colors">
            View Gym ↗
          </RouterLink>

          <Swiper
            :modules="cubeModules"
            effect="cube"
            :grab-cursor="true"
            :cube-effect="cubeEffect"
            class="aspect-square w-full rounded-2xl"
          >
            <!-- Face 1: Cover photo -->
            <SwiperSlide class="rounded-2xl overflow-hidden">
              <div class="w-full h-full relative">
                <img v-if="gym.coverPhotoUrl" :src="gym.coverPhotoUrl" :alt="gym.name"
                  class="w-full h-full object-cover" />
                <div v-else class="w-full h-full bg-gradient-to-br from-amber-400 to-orange-600" />

                <!-- dark gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                <!-- Drag-to-flip hint — pulsing pill, top-center -->
                <div class="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-10">
                  <span class="animate-pulse bg-black/55 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-widest uppercase select-none">
                    ← Drag to flip →
                  </span>
                </div>

                <!-- Logo badge -->
                <div v-if="gym.logoUrl"
                  class="absolute bottom-16 right-3 w-10 h-10 rounded-lg border-2 border-white overflow-hidden bg-white shadow-md">
                  <img :src="gym.logoUrl" :alt="gym.name + ' logo'" class="w-full h-full object-cover" />
                </div>

                <!-- Name overlay -->
                <div class="absolute bottom-0 left-0 right-0 p-4">
                  <h3 class="font-black text-white text-xl leading-tight drop-shadow">{{ gym.name }}</h3>
                  <p class="text-sm text-gray-300 mt-0.5">{{ gym.city }}</p>
                </div>
              </div>
            </SwiperSlide>

            <!-- Face 2: Info -->
            <SwiperSlide class="rounded-2xl overflow-hidden">
              <div class="w-full h-full bg-gradient-to-br from-purple-700 to-indigo-800 flex flex-col justify-between p-5 text-white">
                <!-- Top: name + gender + location -->
                <div>
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <h3 class="font-bold text-lg leading-tight">{{ gym.name }}</h3>
                    <span v-if="gym.genderType"
                      class="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {{ GENDER_LABELS[gym.genderType] }}
                    </span>
                  </div>
                  <p class="text-xs text-purple-300">
                    {{ gym.city }}{{ gym.location ? ' · ' + gym.location : '' }}
                  </p>

                  <!-- Facility chips -->
                  <div class="flex flex-wrap gap-1.5 mt-3">
                    <span v-for="facility in gym.facilities.slice(0, 5)" :key="facility"
                      class="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white">
                      {{ facility }}
                    </span>
                    <span v-if="gym.facilities.length > 5"
                      class="text-xs px-2 py-0.5 rounded-full bg-white/10 text-purple-300">
                      +{{ gym.facilities.length - 5 }} more
                    </span>
                  </div>
                </div>

                <!-- Bottom: price + buttons -->
                <div>
                  <p v-if="formatPlans(gym.pricingPlans)" class="text-sm font-bold text-purple-200 mb-3">
                    {{ formatPlans(gym.pricingPlans) }}
                  </p>
                  <div class="swiper-no-swiping">
                    <button v-if="!authStore.isSignedIn || isClient"
                      :disabled="authStore.isSignedIn && gymButtonDisabled(gym._id)"
                      class="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-white/40 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      @click="handleJoinGym(gym._id)">
                      {{ authStore.isSignedIn ? gymButtonLabel(gym._id) : 'Request to Join' }}
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </section>

    <!-- Trainers -->
    <section v-if="activeTab !== 'gyms'">
      <h2 class="text-xl font-bold text-gray-900 mb-6">
        Personal Trainers
        <span v-if="filteredTrainers.length" class="ml-2 text-sm font-normal text-gray-400">
          {{ filteredTrainers.length }} listed
        </span>
      </h2>

      <p v-if="filteredTrainers.length === 0" class="text-center py-16 text-gray-400">
        No trainers match your search — try a different keyword.
      </p>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="trainer in filteredTrainers" :key="trainer._id"
          class="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">

          <!-- Banner + overlapping avatar -->
          <div class="relative h-28 bg-gradient-to-br from-purple-600 to-indigo-700 flex-shrink-0">
            <div class="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div
                class="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-purple-100 flex items-center justify-center">
                <img v-if="trainer.profilePhotoUrl" :src="trainer.profilePhotoUrl" :alt="trainer.name"
                  class="w-full h-full object-cover" />
                <span v-else class="text-2xl font-bold text-purple-600 select-none">
                  {{ trainer.name.charAt(0).toUpperCase() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card body -->
          <div class="flex flex-col flex-1 items-center text-center pt-14 pb-5 px-5">
            <!-- Name + role -->
            <h3 class="font-bold text-gray-900 text-lg leading-tight">{{ trainer.name }}</h3>
            <p class="text-sm text-gray-400 mt-0.5">Personal Trainer</p>

            <!-- Specialization chips -->
            <div v-if="trainer.specializations.length" class="flex flex-wrap justify-center gap-1.5 mt-3">
              <span v-for="spec in trainer.specializations.slice(0, 3)" :key="spec"
                class="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium capitalize">
                {{ spec }}
              </span>
            </div>

            <!-- Action buttons -->
            <div class="flex gap-2 mt-5 w-full">
              <RouterLink :to="`/trainer/${trainer._id}`"
                class="flex-1 py-2 rounded-full text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors text-center">
                View Profile
              </RouterLink>
              <a v-if="trainer.instagramHandle" :href="`https://instagram.com/${trainer.instagramHandle}`"
                target="_blank" rel="noopener noreferrer"
                class="flex-1 py-2 rounded-full text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-center">
                Instagram
              </a>
              <button v-else
                class="flex-1 py-2 rounded-full text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Contact
              </button>
            </div>

            <!-- Stats row -->
            <div class="flex items-stretch w-full mt-4 pt-4 border-t border-gray-100 divide-x divide-gray-100">
              <div class="flex flex-col items-center flex-1 px-2">
                <span class="font-bold text-gray-900 text-sm">
                  {{ trainer.yearsOfExperience ?? '—' }}yr{{ trainer.yearsOfExperience !== 1 ? 's' : '' }}
                </span>
                <span class="text-xs text-gray-400">Experience</span>
              </div>
              <div class="flex flex-col items-center flex-1 px-2">
                <span class="font-bold text-gray-900 text-sm">{{ trainer.specializations.length }}</span>
                <span class="text-xs text-gray-400">Specialties</span>
              </div>
              <div class="flex flex-col items-center flex-1 px-2">
                <span class="font-bold text-gray-900 text-sm">{{ trainer.certifications?.length ?? 0 }}</span>
                <span class="text-xs text-gray-400">Certs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

