import { ref, computed, onUnmounted, inject } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { ClientDetail, Measurement, NutritionPlan, Meal } from '@/types/client'

export function useClientNutrition(clientId: string) {
  const convex = inject<ConvexClient>('convex')!

  const client = ref<ClientDetail | null>(null)
  const measurements = ref<Measurement[] | null>(null)
  const existingPlan = ref<NutritionPlan | null | undefined>(undefined)

  // Form state — pre-populated when a saved plan loads
  const meals = ref<Meal[]>([{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }])
  const totalCalories = ref(0)
  const notes = ref('')

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

  const { unsubscribe: unsubPlan } = convex.onUpdate(
    api.nutritionPlans.getNutritionPlan,
    { clientId: clientId as Id<'clients'> },
    (data) => {
      existingPlan.value = data as NutritionPlan | null
      if (data) {
        const plan = data as NutritionPlan
        meals.value = plan.meals.map((m) => ({ ...m }))
        totalCalories.value = plan.totalCalories
        notes.value = plan.notes ?? ''
      }
    },
  )

  onUnmounted(() => {
    unsubClient()
    unsubMeasurements()
    unsubPlan()
  })

  const latestMeasurement = computed(() =>
    measurements.value && measurements.value.length > 0 ? measurements.value[0] : null,
  )

  const computedTotalCalories = computed(() =>
    meals.value.reduce((sum, m) => sum + (m.calories || 0), 0),
  )

  function addMeal() {
    meals.value.push({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  function removeMeal(index: number) {
    meals.value.splice(index, 1)
  }

  // Save plan
  const isSaving = ref(false)
  const saveError = ref('')
  const saveSuccess = ref(false)

  async function savePlan(): Promise<void> {
    if (!meals.value.length) return
    isSaving.value = true
    saveError.value = ''
    saveSuccess.value = false
    try {
      await convex.mutation(api.nutritionPlans.upsertNutritionPlan, {
        clientId: clientId as Id<'clients'>,
        meals: meals.value.map((m) => ({
          name: m.name,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
        })),
        totalCalories: totalCalories.value || computedTotalCalories.value,
        notes: notes.value.trim() || undefined,
      })
      saveSuccess.value = true
      setTimeout(() => { saveSuccess.value = false }, 3000)
    } catch (e: unknown) {
      saveError.value = e instanceof Error ? e.message : 'Failed to save plan'
    } finally {
      isSaving.value = false
    }
  }

  return {
    data: {
      client,
      measurements,
      existingPlan,
      latestMeasurement,
      meals,
      totalCalories,
      notes,
      computedTotalCalories,
      isSaving,
      saveError,
      saveSuccess,
    },
    loading: computed(() => client.value === null),
    error: null,
    actions: {
      addMeal,
      removeMeal,
      savePlan,
    },
  }
}
