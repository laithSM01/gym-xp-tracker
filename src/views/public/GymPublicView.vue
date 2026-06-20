<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGymPublicPage } from '@/composables/useGymPublicPage'
import type { Id } from '../../../convex/_generated/dataModel'

const route = useRoute()
const gymId = route.params.gymId as Id<'gyms'>

const { page, ctaState, sendJoinRequest } = useGymPublicPage(gymId)

const DURATION_LABELS: Record<string, string> = {
  '1_month': '1 Month',
  '3_months': '3 Months',
  '6_months': '6 Months',
  '8_months': '8 Months',
  '12_months': '12 Months',
}

const DURATION_MONTHS: Record<string, number> = {
  '1_month': 1,
  '3_months': 3,
  '6_months': 6,
  '8_months': 8,
  '12_months': 12,
}

const CATEGORY_LABELS: Record<string, string> = {
  supplement: 'Supplement',
  equipment: 'Equipment',
  food: 'Food',
  digital_program: 'Digital Program',
  session: 'Session',
}

const FACILITY_ICONS: Record<string, string> = {
  'weights': '🏋️',
  'cardio': '🚴',
  'swimming pool': '🌊',
  'boxing': '🥊',
  'sauna': '🔥',
  'steam room': '♨️',
  'group classes': '👥',
  'parking': '🅿️',
  'locker rooms': '🔑',
  'women section': '♀️',
}

type GenderKey = 'male' | 'female' | 'mixed'
const GENDER_CONFIG: Record<GenderKey, { label: string; bg: string; text: string; border: string }> = {
  male: { label: 'Male Only', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  female: { label: 'Female Only', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  mixed: { label: 'Mixed', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
}
function genderCfg(gender: string) {
  return GENDER_CONFIG[(gender as GenderKey)] ?? GENDER_CONFIG.mixed
}

const todayKey = computed<'weekdays' | 'weekends' | 'friday'>(() => {
  const d = new Date().getDay()
  if (d === 5) return 'friday'
  if (d === 0 || d === 6) return 'weekends'
  return 'weekdays'
})

const FACILITY_SCHEDULE_ICONS: Record<string, string> = {
  cardio: '🚴', boxing: '🥊', 'swimming pool': '🌊', swimming: '🌊',
  yoga: '🧘', crossfit: '🏋️', zumba: '💃', pilates: '🤸',
}

const sortedPlans = computed(() => {
  if (!page.value?.gym.pricingPlans) return []
  return [...page.value.gym.pricingPlans].sort((a, b) => a.priceJod - b.priceJod)
})

const monthlyBasePrice = computed(() => {
  const monthly = page.value?.gym.pricingPlans.find((p) => p.duration === '1_month')
  return monthly?.priceJod ?? null
})

function savingsPercent(plan: { duration: string; priceJod: number }): number | null {
  const base = monthlyBasePrice.value
  if (!base || plan.duration === '1_month') return null
  const months = DURATION_MONTHS[plan.duration]
  if (!months) return null
  const effective = plan.priceJod / months
  const pct = Math.round((1 - effective / base) * 100)
  return pct > 0 ? pct : null
}

// Countdown timers
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function countdown(expiresAt: number): string {
  const diff = expiresAt - now.value
  if (diff <= 0) return 'Expired'
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  if (d > 0) return `${d}d ${h}h left`
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Trainer side drawer
const selectedTrainerIdx = ref<number | null>(null)
const selectedTrainer = computed(() =>
  selectedTrainerIdx.value !== null ? page.value?.trainers[selectedTrainerIdx.value] ?? null : null,
)

function openDrawer(idx: number) { selectedTrainerIdx.value = idx }
function closeDrawer() { selectedTrainerIdx.value = null }

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
    <p class="text-xl font-semibold">Gym not found</p>
    <RouterLink to="/" class="text-sm text-purple-600 hover:underline">Back to marketplace</RouterLink>
  </div>

  <!-- Profile -->
  <div v-else class="pb-24 md:pb-0">

    <!-- ─── Hero ─── -->
    <div class="relative w-full h-64 sm:h-80 bg-gradient-to-br from-purple-900 to-gray-900 overflow-hidden">
      <img
        v-if="page.gym.coverPhotoUrl"
        :src="page.gym.coverPhotoUrl"
        :alt="page.gym.name"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div class="absolute bottom-0 left-0 right-0 px-6 pb-6">
        <div class="flex items-end gap-4">
          <!-- Logo -->
          <div class="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border-2 border-white/30 overflow-hidden flex items-center justify-center flex-shrink-0">
            <img v-if="page.gym.logoUrl" :src="page.gym.logoUrl" class="w-full h-full object-cover" />
            <span v-else class="text-2xl">🏋️</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h1 class="text-2xl font-black text-white leading-tight">{{ page.gym.name }}</h1>
              <!-- Show section badges when using new format; single badge for old format -->
              <template v-if="page.gym.genderSections?.length">
                <span
                  v-for="(section, i) in page.gym.genderSections"
                  :key="i"
                  class="text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="[genderCfg(section.gender).bg, genderCfg(section.gender).text]"
                >
                  {{ section.label || genderCfg(section.gender).label }}
                </span>
              </template>
              <span
                v-else-if="page.gym.genderType"
                class="text-xs font-semibold px-2 py-0.5 rounded-full"
                :class="[genderCfg(page.gym.genderType).bg, genderCfg(page.gym.genderType).text]"
              >
                {{ genderCfg(page.gym.genderType).label }}
              </span>
            </div>
            <p class="text-sm text-white/70">{{ page.gym.city }} · {{ page.gym.location }}</p>
          </div>
        </div>

        <!-- Gender sections (new format) -->
        <div v-if="page.gym.genderSections?.length" class="mt-4 flex flex-col gap-2">
          <div
            v-for="(section, i) in page.gym.genderSections"
            :key="i"
            class="flex flex-wrap items-start gap-2"
          >
            <span
              class="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
              :class="[genderCfg(section.gender).bg, genderCfg(section.gender).text]"
            >
              {{ section.label || genderCfg(section.gender).label }}
            </span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-if="section.weekdays"
                class="text-xs px-2.5 py-1 rounded-full backdrop-blur"
                :class="todayKey === 'weekdays' ? 'bg-white text-gray-900 font-semibold' : 'bg-white/10 text-white/80'"
              >
                Weekdays: {{ section.weekdays }}
                <span v-if="todayKey === 'weekdays'" class="inline-block ml-1 w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
              </span>
              <span
                v-if="section.weekends"
                class="text-xs px-2.5 py-1 rounded-full backdrop-blur"
                :class="todayKey === 'weekends' ? 'bg-white text-gray-900 font-semibold' : 'bg-white/10 text-white/80'"
              >
                Weekends: {{ section.weekends }}
                <span v-if="todayKey === 'weekends'" class="inline-block ml-1 w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
              </span>
              <span
                v-if="section.friday"
                class="text-xs px-2.5 py-1 rounded-full backdrop-blur"
                :class="todayKey === 'friday' ? 'bg-white text-gray-900 font-semibold' : 'bg-white/10 text-white/80'"
              >
                Friday: {{ section.friday }}
                <span v-if="todayKey === 'friday'" class="inline-block ml-1 w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
              </span>
            </div>
          </div>
        </div>

        <!-- Old format fallback: single openingHours -->
        <div v-else-if="page.gym.openingHours" class="mt-4 flex flex-wrap gap-2">
          <div
            v-for="entry in [
              { key: 'weekdays', label: 'Weekdays', value: page.gym.openingHours.weekdays },
              { key: 'weekends', label: 'Weekends', value: page.gym.openingHours.weekends },
              ...(page.gym.openingHours.friday ? [{ key: 'friday', label: 'Friday', value: page.gym.openingHours.friday }] : []),
            ]"
            :key="entry.key"
            class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full backdrop-blur"
            :class="entry.key === todayKey ? 'bg-white text-gray-900 font-semibold' : 'bg-white/10 text-white/80'"
          >
            <span class="font-medium">{{ entry.label }}:</span>
            <span>{{ entry.value }}</span>
            <span v-if="entry.key === todayKey" class="ml-1 w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Body ─── -->
    <div class="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-10">

      <!-- Bio + Facilities -->
      <section class="flex flex-col gap-4">
        <p v-if="page.gym.bio" class="text-gray-700 leading-relaxed text-[15px]">{{ page.gym.bio }}</p>
        <div v-if="page.gym.facilities.length" class="flex flex-wrap gap-2">
          <span
            v-for="f in page.gym.facilities"
            :key="f"
            class="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize"
          >
            <span>{{ FACILITY_ICONS[f] ?? '✓' }}</span>
            {{ f }}
          </span>
        </div>
      </section>

      <!-- Class Schedules -->
      <section v-if="page.gym.classSchedules?.length">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Class Schedule</h2>
        <div class="flex flex-col gap-3">
          <div
            v-for="(cls, i) in page.gym.classSchedules"
            :key="i"
            class="flex items-start gap-4 px-4 py-3 rounded-xl border border-gray-200 bg-white"
          >
            <span class="text-2xl shrink-0 mt-0.5">
              {{ FACILITY_SCHEDULE_ICONS[cls.activity.toLowerCase()] ?? '🏃' }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-baseline gap-2">
                <span class="text-sm font-semibold text-gray-900 capitalize">{{ cls.activity }}</span>
                <span v-if="cls.instructor" class="text-xs text-gray-500">with {{ cls.instructor }}</span>
              </div>
              <p class="text-sm text-gray-600 mt-0.5">{{ cls.schedule }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Plans -->
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-4">Membership Plans</h2>
        <div v-if="sortedPlans.length === 0" class="text-sm text-gray-400">No plans listed yet.</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(plan, i) in sortedPlans"
            :key="i"
            class="relative border rounded-2xl p-5 flex flex-col gap-2 overflow-hidden"
            :class="plan.isOffer ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-white' : 'border-gray-200 bg-white'"
          >
            <!-- Offer banner -->
            <div v-if="plan.isOffer" class="absolute top-0 left-0 right-0 bg-orange-500 text-white text-xs font-semibold text-center py-1">
              Limited Offer
              <span v-if="plan.offerExpiresAt && plan.offerExpiresAt > Date.now()">
                · {{ countdown(plan.offerExpiresAt) }}
              </span>
            </div>

            <div :class="plan.isOffer ? 'pt-5' : ''">
              <div class="text-sm font-medium text-gray-500">{{ DURATION_LABELS[plan.duration] }}</div>
              <div class="text-3xl font-black text-gray-900 mt-1">
                {{ plan.priceJod }}
                <span class="text-sm font-medium text-gray-400">JOD</span>
              </div>

              <div v-if="plan.label" class="text-xs text-purple-700 font-semibold mt-1">{{ plan.label }}</div>

              <div v-if="savingsPercent(plan)" class="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                Save {{ savingsPercent(plan) }}% vs monthly
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Trainers -->
      <section v-if="page.trainers.length > 0">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Our Trainers</h2>
        <div class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          <button
            v-for="(trainer, idx) in page.trainers"
            :key="String(trainer.userId)"
            type="button"
            @click="openDrawer(idx)"
            class="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:border-purple-300 hover:shadow-md transition-all w-32 text-center"
          >
            <div class="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl flex-shrink-0">
              {{ trainer.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{{ trainer.name }}</p>
              <p class="text-xs text-gray-400 mt-0.5 capitalize">{{ trainer.affiliationRole.replace('_', ' ') }}</p>
            </div>
          </button>
        </div>
      </section>

      <!-- Products -->
      <section v-if="page.products.length > 0">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Products & Services</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="product in page.products"
            :key="String(product._id)"
            class="border border-gray-200 rounded-2xl overflow-hidden bg-white"
          >
            <div class="h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
              <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover" />
              <span v-else class="text-3xl text-gray-300">📦</span>
            </div>
            <div class="p-4 flex flex-col gap-1">
              <span class="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 self-start font-medium">
                {{ CATEGORY_LABELS[product.category] }}
              </span>
              <p class="text-sm font-semibold text-gray-900">{{ product.name }}</p>
              <p class="text-xs text-gray-500 line-clamp-2">{{ product.description }}</p>
              <p class="text-base font-bold text-purple-700 mt-1">{{ product.priceJod }} JOD</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Desktop CTA -->
      <section class="hidden md:block border-t border-gray-100 pt-8">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p class="text-lg font-bold text-gray-900">Ready to join {{ page.gym.name }}?</p>
            <p v-if="sortedPlans[0]" class="text-sm text-gray-500">
              From {{ sortedPlans[0].priceJod }} JOD / {{ DURATION_LABELS[sortedPlans[0].duration] }}
            </p>
          </div>
          <RouterLink
            v-if="ctaState === 'unauthenticated'"
            :to="`/sign-in?redirect_url=/gym/${gymId}`"
            class="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors"
          >
            Sign in to join
          </RouterLink>
          <button
            v-else-if="ctaState === 'join'"
            @click="handleJoin"
            class="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors"
          >
            Request to Join
          </button>
          <span v-else-if="ctaState === 'pending'" class="px-4 py-2 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm font-medium">
            Request pending
          </span>
          <span v-else-if="ctaState === 'approved'" class="px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-medium">
            You're a member
          </span>
          <span v-else-if="ctaState === 'rejected'" class="px-4 py-2 rounded-xl bg-gray-50 text-gray-500 border border-gray-200 text-sm font-medium">
            Request declined
          </span>
        </div>
      </section>

    </div>

    <!-- ─── Mobile sticky CTA ─── -->
    <Teleport to="body">
      <div class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 safe-area-pb">
        <RouterLink
          v-if="ctaState === 'unauthenticated'"
          :to="`/sign-in?redirect_url=/gym/${gymId}`"
          class="block w-full py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm text-center hover:bg-purple-700 transition-colors"
        >
          Sign in to join
        </RouterLink>
        <button
          v-else-if="ctaState === 'join'"
          @click="handleJoin"
          class="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors"
        >
          Request to Join
        </button>
        <div
          v-else-if="ctaState === 'pending'"
          class="w-full py-3 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm font-medium text-center"
        >
          Request pending
        </div>
        <div
          v-else-if="ctaState === 'approved'"
          class="w-full py-3 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-medium text-center"
        >
          You're a member
        </div>
        <div
          v-else-if="ctaState === 'rejected'"
          class="w-full py-3 rounded-xl bg-gray-50 text-gray-500 border border-gray-200 text-sm font-medium text-center"
        >
          Request declined
        </div>
      </div>
    </Teleport>

    <!-- ─── Trainer side drawer ─── -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="selectedTrainer" class="fixed inset-0 z-50 flex justify-end">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer" />

          <!-- Panel -->
          <div class="relative w-full max-w-sm bg-white shadow-2xl overflow-y-auto flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <span class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Trainer</span>
              <button
                type="button"
                @click="closeDrawer"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <!-- Trainer info -->
            <div class="flex flex-col items-center gap-3 px-6 py-8 text-center border-b border-gray-100">
              <div class="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-3xl">
                {{ selectedTrainer.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900">{{ selectedTrainer.name }}</h2>
                <span class="inline-block mt-1 text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold capitalize">
                  {{ selectedTrainer.affiliationRole.replace('_', ' ') }}
                </span>
              </div>
            </div>

            <!-- Gym association -->
            <div class="px-6 py-5 flex-1">
              <p class="text-sm text-gray-500 text-center leading-relaxed">
                Trainer at <span class="font-semibold text-gray-700">{{ page?.gym?.name }}</span>
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-enter-active .relative,
.drawer-leave-active .relative {
  transition: transform 0.25s ease;
}
.drawer-enter-from {
  opacity: 0;
}
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .relative > div:last-child,
.drawer-leave-to .relative > div:last-child {
  transform: translateX(100%);
}

.safe-area-pb {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}
</style>
