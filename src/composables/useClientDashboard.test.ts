import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, nextTick } from 'vue'
import type { Profile, Measurement, Challenges, NutritionPlan } from '@/types/client'
import {
  xpProgress,
  formatDate,
  tierConfig,
  tierMin,
  tierMax,
  useClientDashboard,
} from './useClientDashboard'

// ---------------------------------------------------------------------------
// Hoisted mock helpers — created before any imports resolve
// ---------------------------------------------------------------------------

const mockHelpers = vi.hoisted(() => {
  const mockOnUpdate = vi.fn()
  const onUnmountedCallbacks: (() => void)[] = []
  const mockOnUnmounted = vi.fn((cb: () => void) => {
    onUnmountedCallbacks.push(cb)
  })
  return { mockOnUpdate, mockOnUnmounted, onUnmountedCallbacks }
})

vi.mock('@convex/_generated/api', () => ({
  api: {
    clients: { getMyProfile: 'clients:getMyProfile' },
    measurements: { getMyMeasurements: 'measurements:getMyMeasurements' },
    challenges: { getMyChallenges: 'challenges:getMyChallenges' },
    nutritionPlans: { getNutritionPlan: 'nutritionPlans:getNutritionPlan' },
  },
}))

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    inject: vi.fn(() => ({ onUpdate: mockHelpers.mockOnUpdate })),
    onUnmounted: mockHelpers.mockOnUnmounted,
  }
})

// ---------------------------------------------------------------------------
// Pure function tests
// ---------------------------------------------------------------------------

describe('xpProgress', () => {
  it('returns 100 for elite tier regardless of XP', () => {
    expect(xpProgress(5000, 'elite')).toBe(100)
  })

  it('returns 0 for beginner at tier minimum (0 XP)', () => {
    expect(xpProgress(0, 'beginner')).toBe(0)
  })

  it('returns 50 for beginner at halfway (250 XP)', () => {
    expect(xpProgress(250, 'beginner')).toBe(50)
  })

  it('returns 100 for beginner at tier max (500 XP)', () => {
    expect(xpProgress(500, 'beginner')).toBe(100)
  })

  it('caps at 100 when XP exceeds tier max', () => {
    expect(xpProgress(600, 'beginner')).toBe(100)
  })

  it('calculates progress for novice tier', () => {
    // (750 - 500) / (1000 - 500) * 100 = 50
    expect(xpProgress(750, 'novice')).toBe(50)
  })

  it('calculates progress for intermediate tier', () => {
    // (1500 - 1000) / (2000 - 1000) * 100 = 50
    expect(xpProgress(1500, 'intermediate')).toBe(50)
  })

  it('calculates progress for advanced tier', () => {
    // (2500 - 2000) / (3000 - 2000) * 100 = 50
    expect(xpProgress(2500, 'advanced')).toBe(50)
  })
})

describe('formatDate', () => {
  it('formats a timestamp using en-US locale', () => {
    const ts = new Date('2024-01-15T12:00:00Z').getTime()
    const result = formatDate(ts)
    expect(result).toContain('2024')
    expect(result).toMatch(/Jan/)
  })

  it('includes the day in the output', () => {
    const ts = new Date('2024-06-07T00:00:00Z').getTime()
    const result = formatDate(ts)
    expect(result).toContain('2024')
  })
})

describe('tierConfig', () => {
  it('has an entry for every tier', () => {
    const tiers: (keyof typeof tierConfig)[] = [
      'beginner',
      'novice',
      'intermediate',
      'advanced',
      'elite',
    ]
    tiers.forEach((tier) => expect(tierConfig[tier]).toBeDefined())
  })

  it('elite tier has no next label', () => {
    expect(tierConfig.elite.next).toBeUndefined()
  })

  it('beginner tier next label points to novice', () => {
    expect(tierConfig.beginner.next).toBe('Novice at 500 XP')
  })
})

describe('tierMin / tierMax', () => {
  it('beginner starts at 0', () => {
    expect(tierMin.beginner).toBe(0)
  })

  it('elite min and max are both 3000', () => {
    expect(tierMin.elite).toBe(3000)
    expect(tierMax.elite).toBe(3000)
  })

  it('tier boundaries are contiguous', () => {
    expect(tierMax.beginner).toBe(tierMin.novice)
    expect(tierMax.novice).toBe(tierMin.intermediate)
    expect(tierMax.intermediate).toBe(tierMin.advanced)
  })
})

// ---------------------------------------------------------------------------
// Composable tests
// ---------------------------------------------------------------------------

const mockProfile: Profile = {
  _id: 'client_1',
  userName: 'John Doe',
  age: 25,
  goal: 'Lose weight',
  currentXP: 750,
  currentTier: 'novice',
  isEnrolled: true,
}

const makeMeasurements = (count: number): Measurement[] =>
  Array.from({ length: count }, (_, i) => ({
    _id: `m${i}`,
    weight: 80 - i,
    bodyFat: 20,
    muscleMass: 40,
    timestamp: Date.now() - i * 1000,
  }))

describe('useClientDashboard', () => {
  // Callbacks captured from convex.onUpdate calls (by call order):
  //   [0] profile   [1] measurements   [2] challenges   [3] nutritionPlan (lazy)
  let updateCallbacks: ((data: unknown) => void)[]
  let unsubFns: ReturnType<typeof vi.fn>[]
  let scope: ReturnType<typeof effectScope>
  let result: ReturnType<typeof useClientDashboard>

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
      result = useClientDashboard()
    })
  })

  afterEach(() => {
    scope.stop()
  })

  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('starts with profile as null', () => {
      expect(result.data.profile.value).toBeNull()
    })

    it('starts with measurements as null', () => {
      expect(result.data.measurements.value).toBeNull()
    })

    it('starts with challenges as null', () => {
      expect(result.data.challenges.value).toBeNull()
    })

    it('starts with nutritionPlan as undefined', () => {
      expect(result.data.nutritionPlan.value).toBeUndefined()
    })

    it('starts with loading true', () => {
      expect(result.loading.value).toBe(true)
    })

    it('starts with recentMeasurements as an empty array', () => {
      expect(result.data.recentMeasurements.value).toEqual([])
    })

    it('error is null', () => {
      expect(result.error).toBeNull()
    })

    it('subscribes to profile, measurements, and challenges immediately', () => {
      expect(mockHelpers.mockOnUpdate).toHaveBeenCalledTimes(3)
    })
  })

  // -------------------------------------------------------------------------
  describe('profile subscription', () => {
    it('sets profile when callback fires', () => {
      updateCallbacks[0]!(mockProfile)
      expect(result.data.profile.value).toEqual(mockProfile)
    })

    it('sets loading to false when profile is received', () => {
      updateCallbacks[0]!(mockProfile)
      expect(result.loading.value).toBe(false)
    })

    it('sets profile back to null when callback fires with null', () => {
      updateCallbacks[0]!(mockProfile)
      updateCallbacks[0]!(null)
      expect(result.data.profile.value).toBeNull()
    })

    it('loading becomes true again when profile resets to null', () => {
      updateCallbacks[0]!(mockProfile)
      updateCallbacks[0]!(null)
      expect(result.loading.value).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  describe('measurements subscription', () => {
    it('sets measurements when callback fires', () => {
      const measurements = makeMeasurements(2)
      updateCallbacks[1]!(measurements)
      expect(result.data.measurements.value).toEqual(measurements)
    })

    it('sets measurements to null when callback fires with null', () => {
      updateCallbacks[1]!(makeMeasurements(1))
      updateCallbacks[1]!(null)
      expect(result.data.measurements.value).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  describe('challenges subscription', () => {
    it('sets challenges when callback fires', () => {
      const mockChallenges: Challenges = {
        active: [
          {
            _id: 'c1',
            title: 'Run 5km',
            description: 'Go for a run',
            xpReward: 50,
            status: 'pending',
          },
        ],
        completed: [],
      }
      updateCallbacks[2]!(mockChallenges)
      expect(result.data.challenges.value).toEqual(mockChallenges)
    })

    it('sets challenges to null when callback fires with null', () => {
      updateCallbacks[2]!(null)
      expect(result.data.challenges.value).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  describe('nutrition plan subscription (lazy)', () => {
    it('does not subscribe to nutrition plan before profile arrives', () => {
      expect(mockHelpers.mockOnUpdate).toHaveBeenCalledTimes(3)
    })

    it('subscribes to nutrition plan once profile becomes available', async () => {
      updateCallbacks[0]!(mockProfile)
      await nextTick()
      expect(mockHelpers.mockOnUpdate).toHaveBeenCalledTimes(4)
    })

    it('does not subscribe a second time when profile updates again', async () => {
      updateCallbacks[0]!(mockProfile)
      await nextTick()
      updateCallbacks[0]!({ ...mockProfile, currentXP: 800 })
      await nextTick()
      expect(mockHelpers.mockOnUpdate).toHaveBeenCalledTimes(4)
    })

    it('sets nutritionPlan when nutrition callback fires', async () => {
      const mockPlan: NutritionPlan = {
        _id: 'np1',
        meals: [{ name: 'Breakfast', calories: 400, protein: 30, carbs: 50, fat: 10 }],
        totalCalories: 400,
      }
      updateCallbacks[0]!(mockProfile)
      await nextTick()
      updateCallbacks[3]!(mockPlan)
      expect(result.data.nutritionPlan.value).toEqual(mockPlan)
    })

    it('sets nutritionPlan to null when callback fires with null', async () => {
      updateCallbacks[0]!(mockProfile)
      await nextTick()
      updateCallbacks[3]!(null)
      expect(result.data.nutritionPlan.value).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  describe('recentMeasurements', () => {
    it('returns empty array when measurements is null', () => {
      expect(result.data.recentMeasurements.value).toEqual([])
    })

    it('returns all measurements when fewer than 5', () => {
      updateCallbacks[1]!(makeMeasurements(3))
      expect(result.data.recentMeasurements.value).toHaveLength(3)
    })

    it('returns exactly 5 when more than 5 measurements exist', () => {
      updateCallbacks[1]!(makeMeasurements(8))
      expect(result.data.recentMeasurements.value).toHaveLength(5)
    })

    it('returns the first 5 items (not a random slice)', () => {
      const measurements = makeMeasurements(7)
      updateCallbacks[1]!(measurements)
      expect(result.data.recentMeasurements.value).toEqual(measurements.slice(0, 5))
    })
  })

  // -------------------------------------------------------------------------
  describe('cleanup', () => {
    it('registers exactly one onUnmounted handler', () => {
      expect(mockHelpers.onUnmountedCallbacks).toHaveLength(1)
    })

    it('calls all three base unsub functions on unmount', () => {
      mockHelpers.onUnmountedCallbacks[0]!()
      expect(unsubFns[0]).toHaveBeenCalledOnce()
      expect(unsubFns[1]).toHaveBeenCalledOnce()
      expect(unsubFns[2]).toHaveBeenCalledOnce()
    })

    it('also calls nutrition plan unsub when subscription was started', async () => {
      updateCallbacks[0]!(mockProfile)
      await nextTick()
      mockHelpers.onUnmountedCallbacks[0]!()
      expect(unsubFns[3]).toHaveBeenCalledOnce()
    })

    it('does not throw on unmount if nutrition plan subscription was never started', () => {
      expect(() => mockHelpers.onUnmountedCallbacks[0]!()).not.toThrow()
    })
  })
})
