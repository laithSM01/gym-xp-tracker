import { ref, computed, onUnmounted, inject } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { ClientDetail, Measurement } from '@/types/client'

export function useClientDetail(clientId: string) {
  const convex = inject<ConvexClient>('convex')!

  const client = ref<ClientDetail | null>(null)
  const measurements = ref<Measurement[] | null>(null)

  const { unsubscribe: unsubClient } = convex.onUpdate(
    api.clients.getClientById,
    { clientId: clientId as Id<'clients'> },
    (data) => { client.value = data as ClientDetail | null },
  )

  const { unsubscribe: unsubMeasurements } = convex.onUpdate(
    api.measurements.getClientMeasurements,
    { clientId: clientId as Id<'clients'> },
    (data) => { measurements.value = data as Measurement[] | null },
  )

  onUnmounted(() => {
    unsubClient()
    unsubMeasurements()
  })

  const activeChallenges = computed(() =>
    client.value?.challenges.filter((c) => c.status === 'pending') ?? [],
  )
  const completedChallenges = computed(() =>
    client.value?.challenges.filter((c) => c.status === 'completed') ?? [],
  )

  // Award XP
  const isAwarding = ref(false)
  const awardError = ref('')
  const awardSuccess = ref(false)

  async function awardXP(amount: number, reason: string): Promise<boolean> {
    isAwarding.value = true
    awardError.value = ''
    awardSuccess.value = false
    try {
      await convex.mutation(api.clients.awardXP, {
        clientId: clientId as Id<'clients'>,
        amount,
        reason: reason.trim(),
      })
      awardSuccess.value = true
      setTimeout(() => { awardSuccess.value = false }, 3000)
      return true
    } catch (e: unknown) {
      awardError.value = e instanceof Error ? e.message : 'Failed to award XP'
      return false
    } finally {
      isAwarding.value = false
    }
  }

  // Log Measurement
  const isLogging = ref(false)
  const logError = ref('')
  const lastXPResult = ref<{ xpEarned: number; reasons: string[] } | null>(null)

  async function logMeasurement(input: {
    weight: number
    bodyFat: number
    muscleMass: number
    notes?: string
  }): Promise<boolean> {
    isLogging.value = true
    logError.value = ''
    lastXPResult.value = null
    try {
      const result = await convex.mutation(api.measurements.logMeasurement, {
        clientId: clientId as Id<'clients'>,
        ...input,
      })
      lastXPResult.value = result as { xpEarned: number; reasons: string[] }
      return true
    } catch (e: unknown) {
      logError.value = e instanceof Error ? e.message : 'Failed to log measurement'
      return false
    } finally {
      isLogging.value = false
    }
  }

  // Add Challenge
  const isAddingChallenge = ref(false)
  const addChallengeError = ref('')
  const addChallengeSuccess = ref(false)

  async function addChallenge(title: string, description: string, xpReward: number): Promise<boolean> {
    isAddingChallenge.value = true
    addChallengeError.value = ''
    addChallengeSuccess.value = false
    try {
      await convex.mutation(api.challenges.addChallenge, {
        assignedTo: clientId as Id<'clients'>,
        title,
        description,
        xpReward,
      })
      addChallengeSuccess.value = true
      setTimeout(() => { addChallengeSuccess.value = false }, 3000)
      return true
    } catch (e: unknown) {
      addChallengeError.value = e instanceof Error ? e.message : 'Failed to add challenge'
      return false
    } finally {
      isAddingChallenge.value = false
    }
  }

  // Nutritionist access toggle
  const isTogglingAccess = ref(false)

  async function toggleNutritionistAccess(): Promise<void> {
    isTogglingAccess.value = true
    try {
      await convex.mutation(api.clients.toggleNutritionistAccess, {
        clientId: clientId as Id<'clients'>,
      })
    } finally {
      isTogglingAccess.value = false
    }
  }

  return {
    data: {
      client,
      measurements,
      activeChallenges,
      completedChallenges,
      isAwarding,
      awardError,
      awardSuccess,
      isLogging,
      logError,
      lastXPResult,
      isTogglingAccess,
      isAddingChallenge,
      addChallengeError,
      addChallengeSuccess,
    },
    loading: computed(() => client.value === null),
    error: null,
    actions: {
      awardXP,
      logMeasurement,
      toggleNutritionistAccess,
      addChallenge,
    },
  }
}
