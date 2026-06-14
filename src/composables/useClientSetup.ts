import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { ClientService, SportType, TrainingExperience, PreferredTrainingDays } from '@/services/clients.service'

const SPORT_OPTIONS: { value: SportType; label: string }[] = [
  { value: 'gym', label: 'Gym' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'boxing', label: 'Boxing' },
  { value: 'football', label: 'Football' },
  { value: 'running', label: 'Running' },
  { value: 'crossfit', label: 'CrossFit' },
]

const HEALTH_OPTIONS = [
  'Diabetes',
  'High blood pressure',
  'Heart condition',
  'Joint problems',
  'Asthma',
]

const GOALS = [
  'Fat loss',
  'Muscle gain',
  'Body recomposition',
  'General fitness',
  'Sports performance',
  'Injury rehabilitation',
]

export { SPORT_OPTIONS, HEALTH_OPTIONS, GOALS }

export function useClientSetup() {
  const clientsService = inject<ClientService>('clientsService')!
  const router = useRouter()

  const step = ref<1 | 2 | 3>(1)

  // Step 1 — Physical info
  const age = ref<number | ''>('')
  const gender = ref<'male' | 'female' | ''>('')
  const height = ref<number | ''>('')
  const weight = ref<number | ''>('')
  const city = ref('')

  // Step 2 — Fitness profile
  const goal = ref('')
  const sportTypes = ref<SportType[]>([])
  const trainingExperience = ref<TrainingExperience | ''>('')
  const preferredTrainingDays = ref<PreferredTrainingDays | ''>('')

  // Step 3 — Health & safety
  const healthConditions = ref<string[]>([])
  const injuryNotes = ref('')

  const isSubmitting = ref(false)
  const submitError = ref('')

  const step1Valid = computed(
    () =>
      age.value !== '' &&
      Number(age.value) >= 14 &&
      Number(age.value) <= 80 &&
      gender.value !== '' &&
      height.value !== '' &&
      weight.value !== '' &&
      city.value.trim().length > 0,
  )

  const step2Valid = computed(
    () =>
      goal.value !== '' &&
      sportTypes.value.length > 0 &&
      trainingExperience.value !== '' &&
      preferredTrainingDays.value !== '',
  )

  const step3Valid = computed(() => true) // health & safety is optional

  function toggleSport(sport: SportType) {
    const idx = sportTypes.value.indexOf(sport)
    if (idx === -1) sportTypes.value.push(sport)
    else sportTypes.value.splice(idx, 1)
  }

  function toggleHealth(condition: string) {
    const idx = healthConditions.value.indexOf(condition)
    if (idx === -1) healthConditions.value.push(condition)
    else healthConditions.value.splice(idx, 1)
  }

  function nextStep() {
    if (step.value === 1 && step1Valid.value) step.value = 2
    else if (step.value === 2 && step2Valid.value) step.value = 3
  }

  function prevStep() {
    if (step.value === 2) step.value = 1
    else if (step.value === 3) step.value = 2
  }

  async function submit() {
    if (!step3Valid.value || isSubmitting.value) return
    isSubmitting.value = true
    submitError.value = ''

    try {
      await clientsService.createMyProfile({
        age: Number(age.value),
        gender: gender.value as 'male' | 'female',
        goal: goal.value,
        height: Number(height.value),
        weight: Number(weight.value),
        city: city.value.trim(),
        sportTypes: sportTypes.value,
        trainingExperience: trainingExperience.value as TrainingExperience,
        preferredTrainingDays: preferredTrainingDays.value as PreferredTrainingDays,
        healthConditions: healthConditions.value,
        injuryNotes: injuryNotes.value.trim() || undefined,
      })
      router.push('/client/dashboard')
    } catch (e: unknown) {
      submitError.value = e instanceof Error ? e.message : 'Something went wrong'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    step,
    age, gender, height, weight, city,
    goal, sportTypes, trainingExperience, preferredTrainingDays,
    healthConditions, injuryNotes,
    isSubmitting, submitError,
    step1Valid, step2Valid, step3Valid,
    toggleSport, toggleHealth,
    nextStep, prevStep, submit,
  }
}
