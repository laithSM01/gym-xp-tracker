import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'
import type { ClientDetail, Measurement, NutritionPlan } from '@/types/client'
import { useClientNutrition } from './useClientNutrition'

const CLIENT_ID = 'client_1'

// ---------------------------------------------------------------------------
// Hoisted mock helpers — created before any imports resolve
// ---------------------------------------------------------------------------

const mockHelpers = vi.hoisted(() => {
  const mockOnUpdate = vi.fn()
  const mockMutation = vi.fn()
  const onUnmountedCallbacks: (() => void)[] = []
  const mockOnUnmounted = vi.fn((cb: () => void) => {
    onUnmountedCallbacks.push(cb)
  })
  return { mockOnUpdate, mockMutation, mockOnUnmounted, onUnmountedCallbacks }
})

vi.mock('@convex/_generated/api', () => ({
  api: {
    clients: { getClientById: 'clients:getClientById' },
    measurements: { getClientMeasurements: 'measurements:getClientMeasurements' },
    nutritionPlans: {
      getNutritionPlan: 'nutritionPlans:getNutritionPlan',
      upsertNutritionPlan: 'nutritionPlans:upsertNutritionPlan',
    },
  },
}))

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    inject: vi.fn(() => ({
      onUpdate: mockHelpers.mockOnUpdate,
      mutation: mockHelpers.mockMutation,
    })),
    onUnmounted: mockHelpers.mockOnUnmounted,
  }
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockClient: ClientDetail = {
  _id: CLIENT_ID,
  userName: 'Alice',
  age: 30,
  goal: 'Lose fat',
  height: 165,
  sportType: 'General Fitness',
  currentXP: 800,
  currentTier: 'novice',
  isEnrolled: true,
  challenges: [],
  xpLogs: [],
}

const mockMeasurement: Measurement = {
  _id: 'm1',
  weight: 68,
  bodyFat: 24,
  muscleMass: 36,
  timestamp: 1700000000000,
}

const mockPlan: NutritionPlan = {
  _id: 'np1',
  meals: [
    { name: 'Breakfast', calories: 400, protein: 30, carbs: 50, fat: 10 },
    { name: 'Lunch', calories: 600, protein: 45, carbs: 70, fat: 15 },
  ],
  totalCalories: 1000,
  notes: 'High protein focus',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useClientNutrition', () => {
  // Subscriptions captured in call order:
  //   [0] client   [1] measurements   [2] nutrition plan
  let updateCallbacks: ((data: unknown) => void)[]
  let unsubFns: ReturnType<typeof vi.fn>[]
  let scope: ReturnType<typeof effectScope>
  let result: ReturnType<typeof useClientNutrition>

  beforeEach(() => {
    updateCallbacks = []
    unsubFns = []
    mockHelpers.onUnmountedCallbacks.length = 0

    mockHelpers.mockOnUpdate.mockImplementation(
      (_query: unknown, _args: unknown, cb: (data: unknown) => void) => {
        const unsub = vi.fn()
        updateCallbacks.push(cb)
        unsubFns.push(unsub)
        return { unsubscribe: unsub }
      },
    )

    scope = effectScope()
    scope.run(() => {
      result = useClientNutrition(CLIENT_ID)
    })
  })

  afterEach(() => {
    scope.stop()
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('client is null', () => {
      expect(result.data.client.value).toBeNull()
    })

    it('measurements is null', () => {
      expect(result.data.measurements.value).toBeNull()
    })

    it('existingPlan is undefined (not null)', () => {
      expect(result.data.existingPlan.value).toBeUndefined()
    })

    it('loading is true', () => {
      expect(result.loading.value).toBe(true)
    })

    it('meals starts with one empty entry', () => {
      expect(result.data.meals.value).toHaveLength(1)
    })

    it('default meal has all fields at zero/empty', () => {
      const meal = result.data.meals.value[0]!
      expect(meal).toEqual({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
    })

    it('totalCalories is 0', () => {
      expect(result.data.totalCalories.value).toBe(0)
    })

    it('notes is empty string', () => {
      expect(result.data.notes.value).toBe('')
    })

    it('computedTotalCalories is 0 (default empty meal)', () => {
      expect(result.data.computedTotalCalories.value).toBe(0)
    })

    it('isSaving is false', () => {
      expect(result.data.isSaving.value).toBe(false)
    })

    it('saveError is empty string', () => {
      expect(result.data.saveError.value).toBe('')
    })

    it('saveSuccess is false', () => {
      expect(result.data.saveSuccess.value).toBe(false)
    })

    it('error is null', () => {
      expect(result.error).toBeNull()
    })

    it('starts exactly 3 subscriptions', () => {
      expect(mockHelpers.mockOnUpdate).toHaveBeenCalledTimes(3)
    })
  })

  // -------------------------------------------------------------------------
  describe('client subscription', () => {
    it('sets client when callback fires', () => {
      updateCallbacks[0]!(mockClient)
      expect(result.data.client.value).toEqual(mockClient)
    })

    it('sets loading to false when client is received', () => {
      updateCallbacks[0]!(mockClient)
      expect(result.loading.value).toBe(false)
    })

    it('handles null client', () => {
      updateCallbacks[0]!(mockClient)
      updateCallbacks[0]!(null)
      expect(result.data.client.value).toBeNull()
    })

    it('loading returns to true when client resets to null', () => {
      updateCallbacks[0]!(mockClient)
      updateCallbacks[0]!(null)
      expect(result.loading.value).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  describe('measurements subscription', () => {
    it('sets measurements when callback fires', () => {
      updateCallbacks[1]!([mockMeasurement])
      expect(result.data.measurements.value).toEqual([mockMeasurement])
    })

    it('handles null measurements', () => {
      updateCallbacks[1]!([mockMeasurement])
      updateCallbacks[1]!(null)
      expect(result.data.measurements.value).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  describe('plan subscription', () => {
    it('sets existingPlan when callback fires', () => {
      updateCallbacks[2]!(mockPlan)
      expect(result.data.existingPlan.value).toEqual(mockPlan)
    })

    it('sets existingPlan to null when null received', () => {
      updateCallbacks[2]!(mockPlan)
      updateCallbacks[2]!(null)
      expect(result.data.existingPlan.value).toBeNull()
    })

    it('pre-populates meals from the plan', () => {
      updateCallbacks[2]!(mockPlan)
      expect(result.data.meals.value).toEqual(mockPlan.meals.map((m) => ({ ...m })))
    })

    it('pre-populates meals as independent copies (not shared references)', () => {
      updateCallbacks[2]!(mockPlan)
      result.data.meals.value[0]!.calories = 9999
      expect(mockPlan.meals[0]!.calories).toBe(400)
    })

    it('pre-populates totalCalories from the plan', () => {
      updateCallbacks[2]!(mockPlan)
      expect(result.data.totalCalories.value).toBe(mockPlan.totalCalories)
    })

    it('pre-populates notes from the plan', () => {
      updateCallbacks[2]!(mockPlan)
      expect(result.data.notes.value).toBe(mockPlan.notes)
    })

    it('sets notes to empty string when plan has no notes', () => {
      const planWithoutNotes: NutritionPlan = { ...mockPlan, notes: undefined }
      updateCallbacks[2]!(planWithoutNotes)
      expect(result.data.notes.value).toBe('')
    })

    it('does not pre-populate form when null is received', () => {
      updateCallbacks[2]!(null)
      expect(result.data.meals.value).toHaveLength(1)
      expect(result.data.totalCalories.value).toBe(0)
      expect(result.data.notes.value).toBe('')
    })
  })

  // -------------------------------------------------------------------------
  describe('latestMeasurement', () => {
    it('is null when measurements is null', () => {
      expect(result.data.latestMeasurement.value).toBeNull()
    })

    it('is null when measurements is an empty array', () => {
      updateCallbacks[1]!([])
      expect(result.data.latestMeasurement.value).toBeNull()
    })

    it('returns the first measurement', () => {
      const second: Measurement = { ...mockMeasurement, _id: 'm2', timestamp: 1700100000000 }
      updateCallbacks[1]!([mockMeasurement, second])
      expect(result.data.latestMeasurement.value).toEqual(mockMeasurement)
    })

    it('updates reactively when measurements change', () => {
      updateCallbacks[1]!([mockMeasurement])
      expect(result.data.latestMeasurement.value).toEqual(mockMeasurement)
      updateCallbacks[1]!([])
      expect(result.data.latestMeasurement.value).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  describe('computedTotalCalories', () => {
    it('is 0 with the default empty meal', () => {
      expect(result.data.computedTotalCalories.value).toBe(0)
    })

    it('sums calories across all meals', () => {
      result.data.meals.value = [
        { name: 'A', calories: 300, protein: 0, carbs: 0, fat: 0 },
        { name: 'B', calories: 500, protein: 0, carbs: 0, fat: 0 },
      ]
      expect(result.data.computedTotalCalories.value).toBe(800)
    })

    it('treats falsy calories as 0', () => {
      result.data.meals.value = [
        { name: 'A', calories: 0, protein: 0, carbs: 0, fat: 0 },
        { name: 'B', calories: 200, protein: 0, carbs: 0, fat: 0 },
      ]
      expect(result.data.computedTotalCalories.value).toBe(200)
    })

    it('updates reactively when a meal is added', () => {
      result.data.meals.value = [{ name: 'A', calories: 400, protein: 0, carbs: 0, fat: 0 }]
      expect(result.data.computedTotalCalories.value).toBe(400)
      result.data.meals.value.push({ name: 'B', calories: 300, protein: 0, carbs: 0, fat: 0 })
      expect(result.data.computedTotalCalories.value).toBe(700)
    })
  })

  // -------------------------------------------------------------------------
  describe('addMeal', () => {
    it('increases meals length by 1', () => {
      result.actions.addMeal()
      expect(result.data.meals.value).toHaveLength(2)
    })

    it('appends a blank meal with all fields at defaults', () => {
      result.actions.addMeal()
      const newMeal = result.data.meals.value[1]!
      expect(newMeal).toEqual({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
    })

    it('can be called multiple times', () => {
      result.actions.addMeal()
      result.actions.addMeal()
      expect(result.data.meals.value).toHaveLength(3)
    })
  })

  // -------------------------------------------------------------------------
  describe('removeMeal', () => {
    beforeEach(() => {
      result.data.meals.value = [
        { name: 'Breakfast', calories: 400, protein: 30, carbs: 50, fat: 10 },
        { name: 'Lunch', calories: 600, protein: 45, carbs: 70, fat: 15 },
        { name: 'Dinner', calories: 500, protein: 40, carbs: 60, fat: 12 },
      ]
    })

    it('decreases meals length by 1', () => {
      result.actions.removeMeal(0)
      expect(result.data.meals.value).toHaveLength(2)
    })

    it('removes the meal at the given index', () => {
      result.actions.removeMeal(1)
      expect(result.data.meals.value.map((m) => m.name)).toEqual(['Breakfast', 'Dinner'])
    })

    it('can remove the first meal', () => {
      result.actions.removeMeal(0)
      expect(result.data.meals.value[0]!.name).toBe('Lunch')
    })

    it('can remove the last meal', () => {
      result.actions.removeMeal(2)
      expect(result.data.meals.value).toHaveLength(2)
      expect(result.data.meals.value[1]!.name).toBe('Lunch')
    })

    it('can empty the list entirely', () => {
      result.actions.removeMeal(0)
      result.actions.removeMeal(0)
      result.actions.removeMeal(0)
      expect(result.data.meals.value).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  describe('savePlan', () => {
    beforeEach(() => {
      mockHelpers.mockMutation.mockResolvedValue(undefined)
    })

    it('does nothing when meals list is empty', async () => {
      result.data.meals.value = []
      await result.actions.savePlan()
      expect(mockHelpers.mockMutation).not.toHaveBeenCalled()
    })

    it('sets isSaving to true while mutation is pending', async () => {
      let resolve!: () => void
      mockHelpers.mockMutation.mockReturnValue(new Promise<void>((r) => { resolve = r }))
      const promise = result.actions.savePlan()
      expect(result.data.isSaving.value).toBe(true)
      resolve()
      await promise
    })

    it('resets isSaving to false after success', async () => {
      await result.actions.savePlan()
      expect(result.data.isSaving.value).toBe(false)
    })

    it('sets saveSuccess to true on success', async () => {
      await result.actions.savePlan()
      expect(result.data.saveSuccess.value).toBe(true)
    })

    it('resets saveSuccess to false after 3 seconds', async () => {
      vi.useFakeTimers()
      await result.actions.savePlan()
      expect(result.data.saveSuccess.value).toBe(true)
      vi.advanceTimersByTime(3000)
      expect(result.data.saveSuccess.value).toBe(false)
    })

    it('passes the clientId to mutation', async () => {
      await result.actions.savePlan()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'nutritionPlans:upsertNutritionPlan',
        expect.objectContaining({ clientId: CLIENT_ID }),
      )
    })

    it('passes mapped meals to mutation', async () => {
      result.data.meals.value = [
        { name: 'Breakfast', calories: 400, protein: 30, carbs: 50, fat: 10 },
      ]
      await result.actions.savePlan()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'nutritionPlans:upsertNutritionPlan',
        expect.objectContaining({
          meals: [{ name: 'Breakfast', calories: 400, protein: 30, carbs: 50, fat: 10 }],
        }),
      )
    })

    it('uses computedTotalCalories when totalCalories is 0', async () => {
      result.data.meals.value = [{ name: 'A', calories: 750, protein: 0, carbs: 0, fat: 0 }]
      result.data.totalCalories.value = 0
      await result.actions.savePlan()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'nutritionPlans:upsertNutritionPlan',
        expect.objectContaining({ totalCalories: 750 }),
      )
    })

    it('prefers manual totalCalories over computed when non-zero', async () => {
      result.data.meals.value = [{ name: 'A', calories: 750, protein: 0, carbs: 0, fat: 0 }]
      result.data.totalCalories.value = 2000
      await result.actions.savePlan()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'nutritionPlans:upsertNutritionPlan',
        expect.objectContaining({ totalCalories: 2000 }),
      )
    })

    it('passes trimmed notes when notes has content', async () => {
      result.data.notes.value = '  High protein diet  '
      await result.actions.savePlan()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'nutritionPlans:upsertNutritionPlan',
        expect.objectContaining({ notes: 'High protein diet' }),
      )
    })

    it('passes undefined when notes is empty', async () => {
      result.data.notes.value = ''
      await result.actions.savePlan()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'nutritionPlans:upsertNutritionPlan',
        expect.objectContaining({ notes: undefined }),
      )
    })

    it('passes undefined when notes is only whitespace', async () => {
      result.data.notes.value = '   '
      await result.actions.savePlan()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'nutritionPlans:upsertNutritionPlan',
        expect.objectContaining({ notes: undefined }),
      )
    })

    it('clears saveError before a new attempt', async () => {
      mockHelpers.mockMutation.mockRejectedValueOnce(new Error('first error'))
      await result.actions.savePlan()
      expect(result.data.saveError.value).toBe('first error')
      mockHelpers.mockMutation.mockResolvedValue(undefined)
      await result.actions.savePlan()
      expect(result.data.saveError.value).toBe('')
    })

    describe('on failure', () => {
      beforeEach(() => {
        mockHelpers.mockMutation.mockRejectedValue(new Error('Network error'))
      })

      it('sets saveError to the error message', async () => {
        await result.actions.savePlan()
        expect(result.data.saveError.value).toBe('Network error')
      })

      it('resets isSaving to false after failure', async () => {
        await result.actions.savePlan()
        expect(result.data.isSaving.value).toBe(false)
      })

      it('does not set saveSuccess on failure', async () => {
        await result.actions.savePlan()
        expect(result.data.saveSuccess.value).toBe(false)
      })

      it('uses a generic message for non-Error rejections', async () => {
        mockHelpers.mockMutation.mockRejectedValue('oops')
        await result.actions.savePlan()
        expect(result.data.saveError.value).toBe('Failed to save plan')
      })
    })
  })

  // -------------------------------------------------------------------------
  describe('cleanup', () => {
    it('registers exactly one onUnmounted handler', () => {
      expect(mockHelpers.onUnmountedCallbacks).toHaveLength(1)
    })

    it('calls all three unsub functions on unmount', () => {
      mockHelpers.onUnmountedCallbacks[0]!()
      expect(unsubFns[0]).toHaveBeenCalledOnce()
      expect(unsubFns[1]).toHaveBeenCalledOnce()
      expect(unsubFns[2]).toHaveBeenCalledOnce()
    })
  })
})
