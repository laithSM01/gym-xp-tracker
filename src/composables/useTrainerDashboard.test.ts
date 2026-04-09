import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'
import type { ConvexUser } from '@/stores/auth'
import type { TrainerClient } from '@/types/client'
import { useTrainerDashboard } from './useTrainerDashboard'

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
    clients: { getMyClients: 'clients:getMyClients' },
  },
}))

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

const mockClients: TrainerClient[] = [
  { _id: 'c1', userName: 'Alice', currentTier: 'novice', currentXP: 500, goal: 'Lose weight', isEnrolled: true, age: 28 },
  { _id: 'c2', userName: 'Bob', currentTier: 'intermediate', currentXP: 1200, goal: 'Build muscle', isEnrolled: false, age: 32 },
  { _id: 'c3', userName: 'Carol', currentTier: 'beginner', currentXP: 100, goal: 'Stay fit', isEnrolled: true, age: 24 },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTrainerDashboard', () => {
  let updateCallback: ((data: unknown) => void) | undefined
  let unsubFn: ReturnType<typeof vi.fn>
  let scope: ReturnType<typeof effectScope>
  let result: ReturnType<typeof useTrainerDashboard>

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
      result = useTrainerDashboard()
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

    it('actions is an empty object', () => {
      expect(result.actions).toEqual({})
    })

    it('starts exactly 1 subscription', () => {
      expect(mockHelpers.mockOnUpdate).toHaveBeenCalledTimes(1)
    })

    it('trainerName defaults to Trainer when no user', () => {
      expect(result.data.trainerName.value).toBe('Trainer')
    })

    it('enrolledCount is 0 when clients is null', () => {
      expect(result.data.enrolledCount.value).toBe(0)
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
      const updated: TrainerClient[] = [{ ...mockClients[0]!, currentXP: 999 }]
      updateCallback!(updated)
      expect(result.data.clients.value).toEqual(updated)
    })
  })

  // -------------------------------------------------------------------------
  describe('enrolledCount', () => {
    it('counts only enrolled clients', () => {
      updateCallback!(mockClients) // c1 and c3 are enrolled → 2
      expect(result.data.enrolledCount.value).toBe(2)
    })

    it('returns 0 when no clients are enrolled', () => {
      const noneEnrolled: TrainerClient[] = mockClients.map((c) => ({ ...c, isEnrolled: false }))
      updateCallback!(noneEnrolled)
      expect(result.data.enrolledCount.value).toBe(0)
    })

    it('returns full count when all clients are enrolled', () => {
      const allEnrolled: TrainerClient[] = mockClients.map((c) => ({ ...c, isEnrolled: true }))
      updateCallback!(allEnrolled)
      expect(result.data.enrolledCount.value).toBe(3)
    })

    it('returns 0 for an empty client list', () => {
      updateCallback!([])
      expect(result.data.enrolledCount.value).toBe(0)
    })

    it('updates reactively when client list changes', () => {
      updateCallback!(mockClients) // 2 enrolled
      expect(result.data.enrolledCount.value).toBe(2)

      const allEnrolled: TrainerClient[] = mockClients.map((c) => ({ ...c, isEnrolled: true }))
      updateCallback!(allEnrolled)
      expect(result.data.enrolledCount.value).toBe(3)
    })
  })

  // -------------------------------------------------------------------------
  describe('trainerName', () => {
    function runWithUser(convexUser: ConvexUser | null | undefined) {
      mockAuthState.convexUser = convexUser
      let r: ReturnType<typeof useTrainerDashboard>
      const s = effectScope()
      s.run(() => { r = useTrainerDashboard() })
      return { result: r!, scope: s }
    }

    it('returns the user name when convexUser has a name', () => {
      const { result: r, scope: s } = runWithUser({ _id: 'u1', role: 'trainer', name: 'John' })
      expect(r.data.trainerName.value).toBe('John')
      s.stop()
    })

    it('falls back to Trainer when convexUser is null', () => {
      const { result: r, scope: s } = runWithUser(null)
      expect(r.data.trainerName.value).toBe('Trainer')
      s.stop()
    })

    it('falls back to Trainer when convexUser is undefined', () => {
      const { result: r, scope: s } = runWithUser(undefined)
      expect(r.data.trainerName.value).toBe('Trainer')
      s.stop()
    })

    it('falls back to Trainer when name is not set on convexUser', () => {
      const { result: r, scope: s } = runWithUser({ _id: 'u1', role: 'trainer' })
      expect(r.data.trainerName.value).toBe('Trainer')
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
