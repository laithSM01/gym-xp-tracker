import { ref, computed, watch, onUnmounted, inject } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { Profile, Measurement, Challenges, NutritionPlan } from '@/types/client'

export { tierConfig, tierMin, tierMax, xpProgress, formatDate } from '@/utils/xp'

export function useClientDashboard() {
  const convex = inject<ConvexClient>('convex')!

  const profile = ref<Profile | null>(null)
  const measurements = ref<Measurement[] | null>(null)
  const challenges = ref<Challenges | null>(null)
  const nutritionPlan = ref<NutritionPlan | null | undefined>(undefined)

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
  })

  const recentMeasurements = computed(() => measurements.value?.slice(0, 5) ?? [])
  const isLoading = computed(() => profile.value === null)

  return {
    data: {
      profile,
      measurements,
      challenges,
      nutritionPlan,
      recentMeasurements,
    },
    loading: isLoading,
    error: null,
    actions: {},
  }
}
