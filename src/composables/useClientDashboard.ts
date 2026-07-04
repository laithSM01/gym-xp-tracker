import { ref, computed, watch, onUnmounted, inject } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { Profile, Measurement, Challenges, NutritionPlan, Program } from '@/types/client'

export { tierConfig, tierMin, tierMax, xpProgress, formatDate } from '@/utils/xp'

export function useClientDashboard() {
  const convex = inject<ConvexClient>('convex')!

  const profile = ref<Profile | null>(null)
  const measurements = ref<Measurement[] | null>(null)
  const challenges = ref<Challenges | null>(null)
  const nutritionPlan = ref<NutritionPlan | null | undefined>(undefined)
  const programs = ref<Program[] | null>(null)

  const { unsubscribe: unsubProfile } = convex.onUpdate(
    api.clients.getMyProfile,
    {},
    (data) => { profile.value = data as Profile | null },
  )

  const { unsubscribe: unsubMeasurements } = convex.onUpdate(
    api.measurements.getMyMeasurements,
    {},
    (data) => { measurements.value = data as Measurement[] | null },
  )

  const { unsubscribe: unsubChallenges } = convex.onUpdate(
    api.challenges.getMyChallenges,
    {},
    (data) => { challenges.value = data as Challenges | null },
  )

  const { unsubscribe: unsubPrograms } = convex.onUpdate(
    api.programs.getMyPrograms,
    {},
    (data) => { programs.value = data as Program[] | null },
  )

  const todayDateKey = new Date().toISOString().substring(0, 10)
  const todayCompletedDayIndices = ref<number[]>([])
  const claimingSession = ref(false)

  const { unsubscribe: unsubSessions } = convex.onUpdate(
    api.workoutSessions.getTodaySessions,
    { dateKey: todayDateKey },
    (data) => { todayCompletedDayIndices.value = (data as number[]) ?? [] },
  )

  let unsubNutritionPlan: (() => void) | null = null

  watch(profile, (p) => {
    if (p && !unsubNutritionPlan) {
      const { unsubscribe } = convex.onUpdate(
        api.nutritionPlans.getNutritionPlan,
        { clientId: p._id as Id<'clients'> },
        (data) => { nutritionPlan.value = data as NutritionPlan | null },
      )
      unsubNutritionPlan = unsubscribe
    }
  })

  onUnmounted(() => {
    unsubProfile()
    unsubMeasurements()
    unsubChallenges()
    unsubNutritionPlan?.()
    unsubPrograms()
    unsubSessions()
  })

  const recentMeasurements = computed(() => measurements.value?.slice(0, 5) ?? [])
  const isLoading = computed(() => profile.value === null)

  const completingChallengeId = ref<string | null>(null)

  async function completeChallenge(challengeId: string): Promise<void> {
    completingChallengeId.value = challengeId
    try {
      await convex.mutation(api.challenges.completeChallenge, {
        challengeId: challengeId as Id<'challenges'>,
      })
    } finally {
      completingChallengeId.value = null
    }
  }

  async function completeSession(
    programId: Id<'programs'> | undefined,
    dayIndex: number,
    exerciseCount: number,
  ): Promise<number> {
    claimingSession.value = true
    try {
      const xpAwarded = await convex.mutation(api.workoutSessions.completeSession, {
        programId,
        dayIndex,
        exerciseCount,
        dateKey: todayDateKey,
      })
      return xpAwarded as number
    } finally {
      claimingSession.value = false
    }
  }

  return {
    data: {
      profile,
      measurements,
      challenges,
      nutritionPlan,
      programs,
      recentMeasurements,
      completingChallengeId,
      todayCompletedDayIndices,
      claimingSession,
    },
    loading: isLoading,
    error: null,
    actions: {
      completeChallenge,
      completeSession,
    },
  }
}
