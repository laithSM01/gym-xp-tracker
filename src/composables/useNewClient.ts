import { ref, computed, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { UnassignedUser, SportType, Tier } from '@/types/client'
import { SPORT_TYPES } from '@/constants/sports'
import { TIER_OPTIONS } from '@/constants/tiers'

export const GOAL_OPTIONS = [
  'Fat Loss',
  'Muscle Gain',
  'Strength Building',
  'General Fitness',
  'Endurance / Cardio',
  'Body Recomposition',
  'Athletic Performance',
  'Flexibility & Mobility',
  'Rehabilitation & Recovery',
  'Lifestyle & Wellness',
] as const

export function useNewClient() {
  const convex = inject<ConvexClient>('convex')!
  const router = useRouter()

  const unassignedClients = ref<UnassignedUser[] | null>(null)

  const { unsubscribe } = convex.onUpdate(api.clients.getUnassignedClients, {}, (data) => {
    unassignedClients.value = data as UnassignedUser[] | null
  })

  onUnmounted(() => unsubscribe())

  const selectedUserId = ref<string>('')
  const search = ref('')

  const filteredClients = computed(() => {
    const list = unassignedClients.value ?? []
    const q = search.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((u) => {
      const name = (u.name ?? '').toLowerCase()
      const email = (u.email ?? '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  })

  function displayName(u: UnassignedUser): string {
    return u.name ?? u.email ?? u._id
  }

  const age = ref('')
  const gender = ref<'male' | 'female' | ''>('')
  const goal = ref<string>('')
  const height = ref('')
  const city = ref('')
  const sportTypes = ref<SportType[]>([])
  const preferredTrainingDays = ref<'2-3' | '3-4' | '4-5' | '5-6' | ''>('')
  const healthConditions = ref<string[]>([])
  const initialTier = ref<Tier | ''>('')
  const injuryNotes = ref('')
  const weight = ref('')
  const bodyFat = ref('')
  const muscleMass = ref('')

  const isSubmitting = ref(false)
  const submitError = ref('')

  const isFormValid = computed(() =>
    selectedUserId.value &&
    age.value &&
    parseInt(age.value) > 0 &&
    gender.value !== '' &&
    goal.value.trim() &&
    height.value &&
    parseFloat(height.value) > 0 &&
    city.value.trim() &&
    sportTypes.value.length >= 1 && sportTypes.value.length <= 2 &&
    preferredTrainingDays.value !== '' &&
    initialTier.value !== '' &&
    weight.value &&
    parseFloat(weight.value) > 0 &&
    bodyFat.value &&
    parseFloat(bodyFat.value) > 0 &&
    muscleMass.value &&
    parseFloat(muscleMass.value) > 0,
  )

  async function submit() {
    if (!isFormValid.value) return
    isSubmitting.value = true
    submitError.value = ''
    try {
      const clientId = await convex.mutation(api.clients.createClient, {
        userId: selectedUserId.value as Id<'users'>,
        age: parseInt(age.value),
        gender: gender.value as 'male' | 'female',
        goal: goal.value.trim(),
        height: parseFloat(height.value),
        city: city.value.trim(),
        sportTypes: sportTypes.value,
        preferredTrainingDays: preferredTrainingDays.value as '2-3' | '3-4' | '4-5' | '5-6',
        healthConditions: healthConditions.value,
        initialTier: initialTier.value as Tier,
        injuryNotes: injuryNotes.value.trim() || undefined,
        initialWeight: parseFloat(weight.value),
        initialBodyFat: parseFloat(bodyFat.value),
        initialMuscleMass: parseFloat(muscleMass.value),
      })
      router.push(`/trainer/client/${clientId as Id<'clients'>}`)
    } catch (e: unknown) {
      submitError.value = e instanceof Error ? e.message : 'Failed to create client'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    data: {
      unassignedClients,
      filteredClients,
      selectedUserId,
      search,
      age,
      gender,
      goal,
      height,
      city,
      sportTypes,
      preferredTrainingDays,
      healthConditions,
      initialTier,
      injuryNotes,
      weight,
      bodyFat,
      muscleMass,
      isFormValid,
      isSubmitting,
      submitError,
      SPORT_TYPES,
      TIER_OPTIONS,
    },
    loading: computed(() => unassignedClients.value === null),
    error: null,
    actions: {
      submit,
      displayName,
      goalOptions: GOAL_OPTIONS,
    },
  }
}
