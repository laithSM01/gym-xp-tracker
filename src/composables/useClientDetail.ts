import { ref, computed, onUnmounted, inject } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { ClientDetail, Measurement, Program } from '@/types/client'

export function useClientDetail(clientId: string) {
  const convex = inject<ConvexClient>('convex')!

  const client = ref<ClientDetail | null>(null)
  const measurements = ref<Measurement[] | null>(null)
  const programs = ref<Program[] | null>(null)

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

  const { unsubscribe: unsubPrograms } = convex.onUpdate(
    api.programs.getClientPrograms,
    { clientId: clientId as Id<'clients'> },
    (data) => { programs.value = data as Program[] | null },
  )

  onUnmounted(() => {
    unsubClient()
    unsubMeasurements()
    unsubPrograms()
  })

  const activeChallenges = computed(() =>
    client.value?.challenges.filter((c) => c.status === 'pending') ?? [],
  )
  const completedChallenges = computed(() =>
    client.value?.challenges.filter((c) => c.status === 'completed') ?? [],
  )
  const activePrograms = computed(() => programs.value ?? [])

  const trainerNotes = ref('')

  const aiPayload = computed(() => {
    if (!client.value) return null
    const active = activePrograms.value.find((p) => p.status === 'active')
    const past = activePrograms.value.filter((p) => p.status === 'completed')
    return {
      age: client.value.age,
      goal: client.value.goal,
      height: client.value.height,
      sportType: client.value.sportType,
      trainerNotes: trainerNotes.value,
      currentXP: client.value.currentXP,
      currentTier: client.value.currentTier,
      measurements: (measurements.value ?? []).map((m) => ({
        weight: m.weight,
        bodyFat: m.bodyFat,
        muscleMass: m.muscleMass,
      })),
      xpLogs: (client.value.xpLogs ?? []).map((l) => ({
        amount: l.amount,
        reason: l.reason,
      })),
      currentExercises: [...new Set(active?.weeklySchedule?.flatMap((d) => d.exercises.map((e) => e.name)) ?? [])],
      completedChallenges: (client.value.challenges ?? [])
        .filter((c) => c.status === 'completed')
        .map((c) => c.title),
      pastPrograms: past.slice(0, 3).map((p) => ({
        title: p.title,
        exercises: p.weeklySchedule?.flatMap((d) => d.exercises.map((e) => e.name)),
      })),
    }
  })

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

  // Create Program
  const isCreatingProgram = ref(false)
  const createProgramError = ref('')
  const createProgramSuccess = ref(false)

  async function createProgram(
    title: string,
    weeklySchedule: { day: number; type: string; exercises: { name: string; sets: number; reps: number; notes?: string }[] }[],
  ): Promise<boolean> {
    isCreatingProgram.value = true
    createProgramError.value = ''
    createProgramSuccess.value = false
    try {
      await convex.mutation(api.programs.createProgram, {
        clientId: clientId as Id<'clients'>,
        title,
        weeklySchedule,
      })
      createProgramSuccess.value = true
      setTimeout(() => { createProgramSuccess.value = false }, 3000)
      return true
    } catch (e: unknown) {
      createProgramError.value = e instanceof Error ? e.message : 'Failed to create program'
      return false
    } finally {
      isCreatingProgram.value = false
    }
  }

  // Update Program Status
  async function updateProgramStatus(programId: string, status: 'active' | 'completed'): Promise<void> {
    await convex.mutation(api.programs.updateProgramStatus, {
      programId: programId as Id<'programs'>,
      status,
    })
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

  // Update Goal
  async function updateGoal(newGoal: string): Promise<boolean> {
    try {
      await convex.mutation(api.clients.updateClientGoal, {
        clientId: clientId as Id<'clients'>,
        goal: newGoal,
      })
      return true
    } catch (e) {
      return false
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
      isCreatingProgram,
      createProgramError,
      createProgramSuccess,
      activePrograms,
      trainerNotes,
      aiPayload,
    },
    loading: computed(() => client.value === null),
    error: null,
    actions: {
      awardXP,
      logMeasurement,
      toggleNutritionistAccess,
      addChallenge,
      createProgram,
      updateProgramStatus,
      updateGoal,
    },
  }
}
