import { ref, computed, watch, onUnmounted, inject } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { Tier, Profile, Measurement, Challenges, NutritionPlan } from '@/types/client'

export const tierConfig: Record<Tier, { label: string; badge: string; bar: string; next?: string }> = {
  beginner: {
    label: 'Beginner',
    badge: 'bg-gray-100 text-gray-700 ring-gray-200',
    bar: 'bg-gray-400',
    next: 'Novice at 500 XP',
  },
  novice: {
    label: 'Novice',
    badge: 'bg-blue-100 text-blue-700 ring-blue-200',
    bar: 'bg-blue-500',
    next: 'Intermediate at 1,000 XP',
  },
  intermediate: {
    label: 'Intermediate',
    badge: 'bg-amber-100 text-amber-700 ring-amber-200',
    bar: 'bg-amber-500',
    next: 'Advanced at 2,000 XP',
  },
  advanced: {
    label: 'Advanced',
    badge: 'bg-purple-100 text-purple-700 ring-purple-200',
    bar: 'bg-purple-500',
    next: 'Elite at 3,000 XP',
  },
  elite: {
    label: 'Elite',
    badge: 'bg-green-100 text-green-700 ring-green-200',
    bar: 'bg-green-500',
  },
}

export const tierMin: Record<Tier, number> = {
  beginner: 0,
  novice: 500,
  intermediate: 1000,
  advanced: 2000,
  elite: 3000,
}

export const tierMax: Record<Tier, number> = {
  beginner: 500,
  novice: 1000,
  intermediate: 2000,
  advanced: 3000,
  elite: 3000,
}

export function xpProgress(xp: number, tier: Tier): number {
  if (tier === 'elite') return 100
  return Math.min(100, Math.round(((xp - tierMin[tier]) / (tierMax[tier] - tierMin[tier])) * 100))
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

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
