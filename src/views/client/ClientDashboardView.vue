<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@clerk/vue'
import { useClientDashboard, tierConfig, tierMin, tierMax, xpProgress, formatDate } from '@/composables/useClientDashboard'
import type { ClientService } from '@/services/clients.service'
import type { StarterProgramsService } from '@/services/starterPrograms.service'
import { useJoinRequests } from '@/composables/useJoinRequests'
import type { Id } from '@convex/_generated/dataModel'

type TabKey = 'workout' | 'measurements' | 'nutrition' | 'challenges' | 'requests'

const NAV_ICONS: { key: TabKey; svg: string }[] = [
  {
    key: 'workout',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  },
  {
    key: 'measurements',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
  },
  {
    key: 'nutrition',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/></svg>',
  },
  {
    key: 'challenges',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.977 9.101c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
  },
  {
    key: 'requests',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>',
  },
]

const WORKOUT_IMAGES: Record<string, string> = {
  'Full Body': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  'Push': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
  'Upper Body': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
  'Pull': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  'Legs': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
  'Lower Body': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
  'Pull + Legs': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
}
const DEFAULT_WORKOUT_IMAGE = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80'

const EXERCISE_IMAGE_KEYWORDS: [string[], string][] = [
  [['push', 'chest', 'bench', 'dip', 'fly'], 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=120&q=80'],
  [['pull', 'row', 'lat', 'chin', 'back'], 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&q=80'],
  [['squat', 'leg press', 'lunge', 'quad', 'leg'], 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=120&q=80'],
  [['deadlift', 'hip', 'glute', 'hamstring', 'rdl'], 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=120&q=80'],
  [['shoulder', 'press', 'overhead', 'lateral', 'raise'], 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=120&q=80'],
  [['curl', 'bicep', 'tricep', 'arm', 'extension'], 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=120&q=80'],
  [['plank', 'crunch', 'core', 'ab', 'sit'], 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&q=80'],
  [['run', 'jump', 'burpee', 'cardio', 'mountain'], 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=120&q=80'],
]
const EXERCISE_IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&q=80'

function getExerciseImage(name: string): string {
  const lower = name.toLowerCase()
  for (const [keywords, url] of EXERCISE_IMAGE_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return url
  }
  return EXERCISE_IMAGE_FALLBACK
}

const DIFFICULTY_MAP: Record<string, number> = {
  beginner: 1, novice: 2, intermediate: 3, advanced: 4, elite: 5,
}

const { user: clerkUser } = useUser()

const clientsService = inject<ClientService>('clientsService')!
const starterProgramsService = inject<StarterProgramsService>('starterProgramsService')!
const router = useRouter()
const clientProfile = clientsService.getMyProfile()
const starterProgram = starterProgramsService.getStarterProgram()

watch(clientProfile, (val) => {
  if (val === null) router.replace('/client/setup')
}, { immediate: true })

const { data, loading: isLoading, actions } = useClientDashboard()
const { profile, challenges, nutritionPlan, programs, recentMeasurements, completingChallengeId, todayCompletedDayIndices, claimingSession } = data

const { outbound, inbound, myRequests, respondingTo, respondError, approveInbound, rejectInbound } = useJoinRequests()

const STATUS_LABELS: Record<string, string> = { pending: 'Pending', approved: 'Joined', rejected: 'Declined' }

const activeTab = ref<TabKey>('workout')
const pendingInboundCount = computed(() => inbound.value.filter((r) => r.status === 'pending').length)
const hasNoGymOrTrainer = computed(() => !!starterProgram.value)

type NormalizedExercise = { name: string; sets: number; reps: string }
type NormalizedDay = { label: string; type: string; exercises: NormalizedExercise[] }

const activeProgram = computed(() => programs.value?.[0] ?? null)

const schedule = computed<NormalizedDay[]>(() => {
  if (activeProgram.value) {
    return activeProgram.value.weeklySchedule.map((d) => ({
      label: `Day ${d.day}`,
      type: d.type,
      exercises: d.exercises.map((ex) => ({ name: ex.name, sets: ex.sets, reps: String(ex.reps) })),
    }))
  }
  if (starterProgram.value) {
    return starterProgram.value.weeklySchedule.map((d) => ({
      label: d.day,
      type: d.type,
      exercises: d.exercises.map((ex) => ({ name: ex.name, sets: ex.sets, reps: ex.reps })),
    }))
  }
  return []
})

const selectedDayIndex = ref(0)
watch(schedule, () => { selectedDayIndex.value = 0 })

const selectedDay = computed(() => schedule.value[selectedDayIndex.value] ?? null)

const dayStats = computed(() => {
  const day = selectedDay.value
  if (!day) return { exerciseCount: 0, totalSets: 0 }
  return {
    exerciseCount: day.exercises.length,
    totalSets: day.exercises.reduce((sum, ex) => sum + ex.sets, 0),
  }
})

const completedExercises = ref<Set<string>>(new Set())

function exerciseKey(name: string): string {
  return `${selectedDayIndex.value}-${name}`
}

function toggleExercise(name: string) {
  const key = exerciseKey(name)
  const next = new Set(completedExercises.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  completedExercises.value = next
}

const completedCount = computed(() => {
  const day = selectedDay.value
  if (!day) return 0
  return day.exercises.filter((ex) => completedExercises.value.has(exerciseKey(ex.name))).length
})

const allExercisesDone = computed(() => {
  const day = selectedDay.value
  if (!day || day.exercises.length === 0) return false
  return completedCount.value === day.exercises.length
})

const isCurrentDayCompleted = computed(() => todayCompletedDayIndices.value.includes(selectedDayIndex.value))

const xpToast = ref<number | null>(null)

async function handleClaimXP() {
  try {
    const xp = await actions.completeSession(
      activeProgram.value?._id as Id<'programs'> | undefined,
      selectedDayIndex.value,
      selectedDay.value?.exercises.length ?? 0,
    )
    xpToast.value = xp
    setTimeout(() => { xpToast.value = null }, 3000)
  } catch { /* race condition guard */ }
}

const focusedExercise = ref<string | null>(null)
watch(selectedDayIndex, () => { focusedExercise.value = null })

const heroImage = computed(() => {
  if (focusedExercise.value) return getExerciseImage(focusedExercise.value)
  return WORKOUT_IMAGES[selectedDay.value?.type ?? ''] ?? DEFAULT_WORKOUT_IMAGE
})
const difficulty = computed(() => DIFFICULTY_MAP[profile.value?.currentTier ?? 'beginner'] ?? 1)
const estimatedMins = computed(() => Math.max(15, dayStats.value.totalSets * 3))

const descriptionSteps = computed(() => {
  const day = selectedDay.value
  if (!day) return []
  return [
    {
      num: '01',
      title: day.type,
      text: `${day.exercises.length} exercises targeting your ${day.type.toLowerCase()} muscles. Focus on form over speed.`,
    },
    {
      num: '02',
      title: 'Your Goal',
      text: profile.value?.goal ?? 'Complete all exercises and claim your XP to track your progress.',
    },
  ]
})
</script>

<template>
  <div class="min-h-screen w-full bg-[#5b9aa0] flex items-center justify-center p-4 font-sans">

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center">
      <div class="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>

    <!-- Not enrolled / setup not done -->
    <div v-else-if="!profile" class="bg-white rounded-3xl p-12 text-center shadow-2xl">
      <p class="text-lg font-semibold text-slate-800">No profile found</p>
      <p class="text-sm text-slate-400 mt-1">Complete your setup to get started.</p>
      <button
        class="mt-4 px-5 py-2 rounded-xl bg-[#3fb6a8] text-white font-semibold text-sm hover:bg-[#35a096] transition-colors"
        @click="router.replace('/client/setup')"
      >
        Go to Setup
      </button>
    </div>

    <!-- Main card -->
    <div v-else class="w-full max-w-7xl bg-[#f4f6f8] rounded-[2rem] shadow-2xl flex overflow-hidden" style="min-height: calc(100vh - 2rem)">

      <!-- ── Sidebar ── -->
      <aside class="w-20 bg-white flex flex-col items-center justify-between py-6 shrink-0">
        <!-- Logo -->
        <div class="h-11 w-11 rounded-full bg-gradient-to-br from-red-400 to-rose-600 shadow-md flex items-center justify-center">
          <div class="h-7 w-7 rounded-full border-2 border-white/70" />
        </div>

        <!-- Nav icons -->
        <nav class="flex flex-col items-center gap-3 rounded-full bg-[#eaf3f3] py-4 px-2">
          <button
            v-for="item in NAV_ICONS"
            :key="item.key"
            class="h-10 w-10 rounded-full flex items-center justify-center transition-colors relative"
            :class="activeTab === item.key ? 'bg-[#3fb6a8] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'"
            @click="activeTab = item.key"
          >
            <span v-html="item.svg" class="h-5 w-5" />
            <span
              v-if="item.key === 'requests' && pendingInboundCount > 0"
              class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
            >
              {{ pendingInboundCount }}
            </span>
          </button>
        </nav>

        <!-- User avatar -->
        <div class="h-12 w-12 rounded-full overflow-hidden ring-2 ring-white shadow bg-[#3fb6a8] flex items-center justify-center">
          <img
            v-if="clerkUser?.imageUrl"
            :src="clerkUser.imageUrl"
            alt="Profile"
            class="h-full w-full object-cover"
          />
          <span v-else class="text-white font-bold text-sm">
            {{ profile.userName?.charAt(0).toUpperCase() }}
          </span>
        </div>
      </aside>

      <!-- ── Main content ── -->
      <main class="flex-1 p-6 lg:p-8 overflow-y-auto">

        <!-- ═══ WORKOUT TAB ═══ -->
        <template v-if="activeTab === 'workout'">

          <!-- Day tabs -->
          <div class="flex items-center gap-8 mb-6 px-2">
            <p v-if="schedule.length === 0" class="text-slate-400 text-sm">No program assigned yet.</p>
            <template v-else>
              <button
                v-for="(day, i) in schedule"
                :key="i"
                class="relative text-lg font-bold transition-colors pb-1"
                :class="selectedDayIndex === i ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'"
                @click="selectedDayIndex = i"
              >
                {{ day.label }}
                <span v-if="selectedDayIndex === i" class="absolute -top-4 left-1/2 -translate-x-1/2 h-3 w-px bg-slate-800" />
              </button>
            </template>
          </div>

          <div v-if="selectedDay" class="grid grid-cols-1 xl:grid-cols-3 gap-6">

            <!-- Left column -->
            <div class="xl:col-span-2 flex flex-col gap-6">

              <!-- Hero image card -->
              <div class="bg-white rounded-3xl p-4 shadow-sm">
                <div class="relative rounded-2xl overflow-hidden bg-[#79b4b7]">
                  <img :src="heroImage" :alt="focusedExercise ?? selectedDay.type" class="w-full object-cover transition-all duration-500" style="height: 300px;" />
                  <div v-if="focusedExercise" class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-5 py-4">
                    <p class="text-white font-semibold text-sm">{{ focusedExercise }}</p>
                    <p class="text-white/70 text-xs mt-0.5">Tap the circle to mark complete · Video coming soon</p>
                  </div>
                </div>

                <!-- 4-stat row -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 px-2">
                  <div class="flex items-center gap-3">
                    <div class="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 4l4 4-4 12M18 4l-4 4 4 12M10 8h4"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-bold text-slate-800 leading-tight text-sm truncate max-w-[72px]">{{ selectedDay.type }}</p>
                      <p class="text-xs text-slate-400">Exercise</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="h-11 w-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-violet-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.5 6.7L12 17.3 5.9 20.8l1.5-6.7L2.2 9.5l6.9-.6z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-bold text-slate-800 leading-tight">{{ difficulty }}</p>
                      <p class="text-xs text-slate-400">Difficult</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 7v5l3 2"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-bold text-slate-800 leading-tight">~{{ estimatedMins }}min</p>
                      <p class="text-xs text-slate-400">Total Time</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="h-11 w-11 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 2L4.5 12.5H11l-1 9.5 8.5-11.5H12l1-8.5z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-bold text-slate-800 leading-tight">{{ completedCount }}/{{ dayStats.exerciseCount }}</p>
                      <p class="text-xs text-slate-400">Done</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Description card -->
              <div class="bg-white rounded-3xl p-6 shadow-sm">
                <h3 class="font-bold text-slate-800 mb-5">Description</h3>
                <div class="relative pl-2">
                  <div v-for="(step, i) in descriptionSteps" :key="i" class="relative flex gap-4 pb-6 last:pb-0">
                    <span v-if="i < descriptionSteps.length - 1" class="absolute left-[14px] top-9 bottom-0 w-px bg-slate-200" />
                    <div
                      class="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold z-10"
                      :class="i === 0 ? 'bg-slate-800 text-white' : 'bg-[#d9f0ec] text-[#3fb6a8]'"
                    >
                      {{ step.num }}
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800">{{ step.title }}</p>
                      <p class="text-sm text-slate-400 mt-1 leading-relaxed">{{ step.text }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Claim XP -->
              <div
                v-if="allExercisesDone && !isCurrentDayCompleted"
                class="bg-[#d9f0ec] border border-[#3fb6a8]/30 rounded-3xl p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p class="font-semibold text-slate-800">All exercises done!</p>
                  <p class="text-sm text-[#3fb6a8] mt-0.5">Claim your XP reward for today's session.</p>
                </div>
                <button
                  :disabled="claimingSession"
                  class="shrink-0 px-5 py-2.5 rounded-2xl bg-[#3fb6a8] text-white font-semibold text-sm hover:bg-[#35a096] transition-colors disabled:opacity-50 shadow-md"
                  @click="handleClaimXP"
                >
                  {{ claimingSession ? 'Claiming...' : 'Claim XP' }}
                </button>
              </div>
              <div
                v-else-if="isCurrentDayCompleted"
                class="bg-[#d9f0ec] border border-[#3fb6a8]/30 rounded-3xl p-5 flex items-center gap-3"
              >
                <svg class="w-5 h-5 text-[#3fb6a8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm font-semibold text-slate-700">Session completed for today. Come back tomorrow!</p>
              </div>
            </div>

            <!-- Right column -->
            <div class="flex flex-col gap-6">

              <!-- Exercise list -->
              <div class="bg-white rounded-3xl p-6 shadow-sm">
                <h3 class="font-bold text-slate-800 mb-5">Exercises</h3>
                <div class="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1">
                  <div
                    v-for="ex in selectedDay.exercises"
                    :key="ex.name"
                    class="flex items-center gap-3 cursor-pointer rounded-2xl transition-colors px-1 -mx-1"
                    :class="focusedExercise === ex.name ? 'bg-[#eaf3f3]' : 'hover:bg-slate-50'"
                    @click="focusedExercise = ex.name"
                  >
                    <div class="h-14 w-14 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                      <img :src="getExerciseImage(ex.name)" :alt="ex.name" class="h-full w-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p
                        class="font-semibold text-sm truncate transition-colors"
                        :class="completedExercises.has(exerciseKey(ex.name)) ? 'text-slate-400 line-through' : 'text-slate-800'"
                      >
                        {{ ex.name }}
                      </p>
                      <p class="text-xs text-slate-400 mt-1">{{ ex.sets }} sets · {{ ex.reps }} reps</p>
                    </div>
                    <div
                      class="h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors"
                      :class="completedExercises.has(exerciseKey(ex.name)) ? 'bg-[#3fb6a8]' : 'border-2 border-[#3fb6a8]'"
                      @click.stop="toggleExercise(ex.name)"
                    >
                      <svg
                        v-if="completedExercises.has(exerciseKey(ex.name))"
                        class="h-3.5 w-3.5 text-white"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Level / XP card -->
              <div class="bg-[#3fb6a8] rounded-3xl p-6 shadow-sm text-white">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 17l6-6 4 4 7-7"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-bold leading-tight">{{ tierConfig[profile.currentTier].label }}</p>
                      <p class="text-sm text-white/70">Your Level</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-auto text-yellow-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 2L4.5 12.5H11l-1 9.5 8.5-11.5H12l1-8.5z"/>
                    </svg>
                    <p class="font-bold mt-1">{{ profile.currentXP.toLocaleString() }}</p>
                  </div>
                </div>

                <!-- XP progress -->
                <div class="mt-4">
                  <div class="flex justify-between text-xs text-white/70 mb-1.5">
                    <span>{{ tierMin[profile.currentTier].toLocaleString() }} XP</span>
                    <span v-if="tierConfig[profile.currentTier].next">{{ tierConfig[profile.currentTier].next }}</span>
                    <span v-else class="text-yellow-300 font-semibold">MAX TIER</span>
                  </div>
                  <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-white rounded-full transition-all duration-700"
                      :style="{ width: xpProgress(profile.currentXP, profile.currentTier) + '%' }"
                    />
                  </div>
                </div>

                <!-- CTA / connected state -->
                <div class="mt-6">
                  <p class="font-bold mb-3 text-sm">{{ hasNoGymOrTrainer ? 'Level Up Faster' : 'Connected' }}</p>
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm text-white/80 flex-1 leading-snug">
                      {{ hasNoGymOrTrainer
                        ? 'Join a gym or trainer for a personalized program.'
                        : 'Your trainer is managing your program.' }}
                    </p>
                    <button
                      v-if="hasNoGymOrTrainer"
                      class="h-11 w-11 rounded-2xl bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center shadow-lg shrink-0"
                      @click="router.push('/')"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </button>
                    <div v-else class="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══ MEASUREMENTS TAB ═══ -->
        <template v-else-if="activeTab === 'measurements'">
          <h2 class="text-xl font-bold text-slate-800 mb-6">Measurements</h2>
          <div class="bg-white rounded-3xl shadow-sm p-6">
            <div v-if="recentMeasurements.length === 0" class="text-sm text-slate-400">No measurements logged yet.</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs text-slate-400 border-b border-slate-100">
                    <th class="text-left pb-3 font-medium">Date</th>
                    <th class="text-right pb-3 font-medium">Weight</th>
                    <th class="text-right pb-3 font-medium">Body Fat</th>
                    <th class="text-right pb-3 font-medium">Muscle</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="m in recentMeasurements" :key="m._id" class="text-slate-700">
                    <td class="py-3 text-slate-400 text-xs">{{ formatDate(m.timestamp) }}</td>
                    <td class="py-3 text-right font-semibold">{{ m.weight }} kg</td>
                    <td class="py-3 text-right">{{ m.bodyFat }}%</td>
                    <td class="py-3 text-right">{{ m.muscleMass }} kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- ═══ NUTRITION TAB ═══ -->
        <template v-else-if="activeTab === 'nutrition'">
          <h2 class="text-xl font-bold text-slate-800 mb-6">Nutrition Plan</h2>
          <div class="bg-white rounded-3xl shadow-sm p-6">
            <div v-if="nutritionPlan === null" class="text-sm text-slate-400">No nutrition plan assigned yet.</div>
            <template v-else-if="nutritionPlan">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-xs text-slate-400 border-b border-slate-100">
                      <th class="text-left pb-3 font-medium">Meal</th>
                      <th class="text-right pb-3 font-medium">Calories</th>
                      <th class="text-right pb-3 font-medium">Protein</th>
                      <th class="text-right pb-3 font-medium">Carbs</th>
                      <th class="text-right pb-3 font-medium">Fat</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr v-for="meal in nutritionPlan.meals" :key="meal.name" class="text-slate-700">
                      <td class="py-3 font-medium">{{ meal.name }}</td>
                      <td class="py-3 text-right">{{ meal.calories }} kcal</td>
                      <td class="py-3 text-right">{{ meal.protein }}g</td>
                      <td class="py-3 text-right">{{ meal.carbs }}g</td>
                      <td class="py-3 text-right">{{ meal.fat }}g</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <p v-if="nutritionPlan.notes" class="text-sm text-slate-500 flex-1">{{ nutritionPlan.notes }}</p>
                <span v-else class="flex-1" />
                <span class="text-sm font-bold text-slate-700">Total: {{ nutritionPlan.totalCalories.toLocaleString() }} kcal</span>
              </div>
            </template>
          </div>
        </template>

        <!-- ═══ CHALLENGES TAB ═══ -->
        <template v-else-if="activeTab === 'challenges'">
          <h2 class="text-xl font-bold text-slate-800 mb-6">Challenges</h2>
          <div class="flex flex-col gap-5">
            <div class="bg-white rounded-3xl shadow-sm p-6">
              <h3 class="font-semibold text-slate-800 mb-4">
                Active
                <span class="ml-2 text-xs font-normal text-slate-400">({{ challenges?.active.length ?? 0 }})</span>
              </h3>
              <div v-if="!challenges?.active.length" class="text-sm text-slate-400">No active challenges.</div>
              <ul v-else class="flex flex-col gap-3">
                <li v-for="c in challenges.active" :key="c._id" class="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                  <button
                    :disabled="completingChallengeId === c._id"
                    class="mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 transition-colors hover:border-[#3fb6a8] hover:bg-[#eaf3f3] disabled:opacity-50"
                    :class="completingChallengeId === c._id ? 'border-[#3fb6a8] bg-[#eaf3f3]' : 'border-slate-300'"
                    @click="actions.completeChallenge(c._id)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-800">{{ c.title }}</p>
                    <p class="text-xs text-slate-400 mt-0.5">{{ c.description }}</p>
                  </div>
                  <span class="shrink-0 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">+{{ c.xpReward }} XP</span>
                </li>
              </ul>
            </div>
            <div v-if="challenges?.completed.length" class="bg-white rounded-3xl shadow-sm p-6">
              <h3 class="font-semibold text-slate-800 mb-4">
                Completed
                <span class="ml-2 text-xs font-normal text-slate-400">({{ challenges.completed.length }})</span>
              </h3>
              <ul class="flex flex-col divide-y divide-slate-50">
                <li v-for="c in challenges.completed" :key="c._id" class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <svg class="w-5 h-5 text-[#3fb6a8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-sm text-slate-400 line-through flex-1">{{ c.title }}</span>
                  <span v-if="c.completedAt" class="text-xs text-slate-300">{{ formatDate(c.completedAt) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </template>

        <!-- ═══ REQUESTS TAB ═══ -->
        <template v-else-if="activeTab === 'requests'">
          <h2 class="text-xl font-bold text-slate-800 mb-6">Gym &amp; Trainer Requests</h2>
          <div class="bg-white rounded-3xl shadow-sm p-6">
            <p v-if="respondError" class="text-sm text-red-600 mb-4">{{ respondError }}</p>

            <div v-if="inbound.length > 0" class="mb-6">
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Invites from Gyms &amp; Trainers</h3>
              <ul class="flex flex-col divide-y divide-slate-100">
                <li v-for="r in inbound" :key="r._id" class="flex items-center gap-4 py-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-800 truncate">{{ r.initiatedBy === 'gym' ? 'Gym invite' : 'Trainer invite' }}</p>
                    <p v-if="r.message" class="text-xs text-slate-400 truncate">{{ r.message }}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button v-if="r.status === 'pending'" :disabled="respondingTo === r._id"
                      class="text-xs px-3 py-1.5 rounded-xl bg-[#3fb6a8] text-white hover:bg-[#35a096] transition-colors disabled:opacity-40"
                      @click="approveInbound(r._id)">
                      {{ respondingTo === r._id ? '...' : 'Accept' }}
                    </button>
                    <button v-if="r.status === 'pending'" :disabled="respondingTo === r._id"
                      class="text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40"
                      @click="rejectInbound(r._id)">
                      Decline
                    </button>
                    <span v-else class="text-xs font-semibold px-2 py-0.5 rounded-full ring-1" :class="{
                      'bg-green-100 text-green-700 ring-green-200': r.status === 'approved',
                      'bg-slate-100 text-slate-500 ring-slate-200': r.status === 'rejected',
                    }">{{ STATUS_LABELS[r.status] }}</span>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Requests You Sent</h3>
              <div v-if="myRequests === undefined" class="py-4 flex justify-center">
                <div class="w-4 h-4 rounded-full border-2 border-[#3fb6a8] border-t-transparent animate-spin" />
              </div>
              <p v-else-if="outbound.length === 0" class="text-sm text-slate-400 py-4 text-center">No requests sent yet.</p>
              <ul v-else class="flex flex-col divide-y divide-slate-100">
                <li v-for="r in outbound" :key="r._id" class="flex items-center gap-4 py-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-800 truncate">{{ r.gymId ? 'Gym request' : 'Trainer request' }}</p>
                    <p class="text-xs text-slate-400">{{ new Date(r.createdAt).toLocaleDateString() }}</p>
                  </div>
                  <span class="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ring-1" :class="{
                    'bg-yellow-100 text-yellow-700 ring-yellow-200': r.status === 'pending',
                    'bg-green-100 text-green-700 ring-green-200': r.status === 'approved',
                    'bg-slate-100 text-slate-500 ring-slate-200': r.status === 'rejected',
                  }">{{ STATUS_LABELS[r.status] }}</span>
                </li>
              </ul>
            </div>
          </div>
        </template>

      </main>
    </div>

    <!-- XP toast -->
    <Transition name="xp-toast">
      <div
        v-if="xpToast"
        class="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none"
      >
        <svg class="w-5 h-5 text-yellow-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L4.5 12.5H11l-1 9.5 8.5-11.5H12l1-8.5z"/>
        </svg>
        <span class="font-bold text-lg">+{{ xpToast }} XP</span>
        <span class="text-sm text-slate-400">earned!</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.xp-toast-enter-active,
.xp-toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.xp-toast-enter-from,
.xp-toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
