import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'
import type { ConvexUser } from '@/stores/auth'
import type { AccessibleClient } from '@/types/client'
import { useNutritionistDashboard } from './useNutritionistDashboard'

// ---------------------------------------------------------------------------
// Hoisted mock helpers — created before any imports resolve
// ---------------------------------------------------------------------------

const mockAuthState = vi.hoisted(() => ({
  convexUser: undefined as ConvexUser | null | undefined,
}))

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
    clients: { getAccessibleClients: 'clients:getAccessibleClients' },
  },
}))

// Mock the whole auth store so no Pinia instance is needed
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => mockAuthState),
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
// Fixtures
// ---------------------------------------------------------------------------

const mockClients: AccessibleClient[] = [
  { _id: 'c1', userName: 'Bob', currentTier: 'novice', currentXP: 600, goal: 'Lose weight', age: 25 },
  { _id: 'c2', userName: 'Carol', currentTier: 'intermediate', currentXP: 1100, goal: 'Build muscle', age: 30 },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNutritionistDashboard', () => {
  // Only one subscription: clients [0]
  let updateCallback: ((data: unknown) => void) | undefined
  let unsubFn: ReturnType<typeof vi.fn>
  let scope: ReturnType<typeof effectScope>
  let result: ReturnType<typeof useNutritionistDashboard>

  beforeEach(() => {
    mockAuthState.convexUser = undefined
    mockHelpers.onUnmountedCallbacks.length = 0

    mockHelpers.mockOnUpdate.mockImplementation(
      (_query: unknown, _args: unknown, cb: (data: unknown) => void) => {
        const unsub = vi.fn()
        updateCallback = cb
        unsubFn = unsub
        return { unsubscribe: unsub }
      },
    )

    scope = effectScope()
    scope.run(() => {
      result = useNutritionistDashboard()
    })
  })

  afterEach(() => {
    scope.stop()
  })

  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('clients is null', () => {
      expect(result.data.clients.value).toBeNull()
    })

    it('loading is true', () => {
      expect(result.loading.value).toBe(true)
    })

    it('error is null', () => {
      expect(result.error).toBeNull()
    })

    it('starts exactly 1 subscription', () => {
      expect(mockHelpers.mockOnUpdate).toHaveBeenCalledTimes(1)
    })

    it('nutritionistName defaults to Nutritionist when no user', () => {
      expect(result.data.nutritionistName.value).toBe('Nutritionist')
    })
  })

  // -------------------------------------------------------------------------
  describe('clients subscription', () => {
    it('sets clients when callback fires', () => {
      updateCallback!(mockClients)
      expect(result.data.clients.value).toEqual(mockClients)
    })

    it('sets loading to false when clients are received', () => {
      updateCallback!(mockClients)
      expect(result.loading.value).toBe(false)
    })

    it('sets loading to false for an empty client list', () => {
      updateCallback!([])
      expect(result.loading.value).toBe(false)
    })

    it('handles an empty client list', () => {
      updateCallback!([])
      expect(result.data.clients.value).toEqual([])
    })

    it('handles null (resets to null)', () => {
      updateCallback!(mockClients)
      updateCallback!(null)
      expect(result.data.clients.value).toBeNull()
    })

    it('loading returns to true when clients reset to null', () => {
      updateCallback!(mockClients)
      updateCallback!(null)
      expect(result.loading.value).toBe(true)
    })

    it('reflects updated client list on subsequent callbacks', () => {
      updateCallback!(mockClients)
      const updated: AccessibleClient[] = [{ ...mockClients[0]!, currentXP: 999 }]
      updateCallback!(updated)
      expect(result.data.clients.value).toEqual(updated)
    })
  })

  // -------------------------------------------------------------------------
  describe('nutritionistName', () => {
    // Each test runs a fresh composable with a specific auth state so the
    // computed getter captures the right value at creation time.
    function runWithUser(convexUser: ConvexUser | null | undefined) {
      mockAuthState.convexUser = convexUser
      let r: ReturnType<typeof useNutritionistDashboard>
      const s = effectScope()
      s.run(() => { r = useNutritionistDashboard() })
      return { result: r!, scope: s }
    }

    it('returns the user name when convexUser has a name', () => {
      const { result: r, scope: s } = runWithUser({ _id: 'u1', role: 'nutritionist', name: 'Alice' })
      expect(r.data.nutritionistName.value).toBe('Alice')
      s.stop()
    })

    it('falls back to Nutritionist when convexUser is null', () => {
      const { result: r, scope: s } = runWithUser(null)
      expect(r.data.nutritionistName.value).toBe('Nutritionist')
      s.stop()
    })

    it('falls back to Nutritionist when convexUser is undefined', () => {
      const { result: r, scope: s } = runWithUser(undefined)
      expect(r.data.nutritionistName.value).toBe('Nutritionist')
      s.stop()
    })

    it('falls back to Nutritionist when name is not set on convexUser', () => {
      const { result: r, scope: s } = runWithUser({ _id: 'u1', role: 'nutritionist' })
      expect(r.data.nutritionistName.value).toBe('Nutritionist')
      s.stop()
    })
  })

  // -------------------------------------------------------------------------
  describe('cleanup', () => {
    it('registers exactly one onUnmounted handler', () => {
      expect(mockHelpers.onUnmountedCallbacks).toHaveLength(1)
    })

    it('calls the unsub function on unmount', () => {
      mockHelpers.onUnmountedCallbacks[0]!()
      expect(unsubFn).toHaveBeenCalledOnce()
    })
  })
})
