import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'
import type { ClientDetail, Measurement, Challenge } from '@/types/client'
import { useClientDetail } from './useClientDetail'

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
    clients: {
      getClientById: 'clients:getClientById',
      awardXP: 'clients:awardXP',
      toggleNutritionistAccess: 'clients:toggleNutritionistAccess',
    },
    measurements: {
      getClientMeasurements: 'measurements:getClientMeasurements',
      logMeasurement: 'measurements:logMeasurement',
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

const pendingChallenge: Challenge = {
  _id: 'c1',
  title: 'Run 5km',
  description: 'Go for a run',
  xpReward: 50,
  status: 'pending',
}

const completedChallenge: Challenge = {
  _id: 'c2',
  title: 'Do 100 push-ups',
  description: 'Push-up challenge',
  xpReward: 30,
  status: 'completed',
  completedAt: 1700000000000,
}

const mockClient: ClientDetail = {
  _id: CLIENT_ID,
  userName: 'Jane Doe',
  age: 28,
  goal: 'Build muscle',
  currentXP: 1200,
  currentTier: 'intermediate',
  isEnrolled: true,
  challenges: [pendingChallenge, completedChallenge],
  xpLogs: [],
}

const mockMeasurement: Measurement = {
  _id: 'm1',
  weight: 65,
  bodyFat: 22,
  muscleMass: 38,
  timestamp: 1700000000000,
}

// ---------------------------------------------------------------------------
// describe block
// ---------------------------------------------------------------------------

describe('useClientDetail', () => {
  // Callbacks captured from convex.onUpdate calls (by call order):
  //   [0] client   [1] measurements
  let updateCallbacks: ((data: unknown) => void)[]
  let unsubFns: ReturnType<typeof vi.fn>[]
  let scope: ReturnType<typeof effectScope>
  let result: ReturnType<typeof useClientDetail>

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
      result = useClientDetail(CLIENT_ID)
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

    it('loading is true', () => {
      expect(result.loading.value).toBe(true)
    })

    it('activeChallenges is empty', () => {
      expect(result.data.activeChallenges.value).toEqual([])
    })

    it('completedChallenges is empty', () => {
      expect(result.data.completedChallenges.value).toEqual([])
    })

    it('isAwarding is false', () => {
      expect(result.data.isAwarding.value).toBe(false)
    })

    it('awardError is empty string', () => {
      expect(result.data.awardError.value).toBe('')
    })

    it('awardSuccess is false', () => {
      expect(result.data.awardSuccess.value).toBe(false)
    })

    it('isLogging is false', () => {
      expect(result.data.isLogging.value).toBe(false)
    })

    it('logError is empty string', () => {
      expect(result.data.logError.value).toBe('')
    })

    it('lastXPResult is null', () => {
      expect(result.data.lastXPResult.value).toBeNull()
    })

    it('isTogglingAccess is false', () => {
      expect(result.data.isTogglingAccess.value).toBe(false)
    })

    it('error is null', () => {
      expect(result.error).toBeNull()
    })

    it('starts exactly 2 subscriptions', () => {
      expect(mockHelpers.mockOnUpdate).toHaveBeenCalledTimes(2)
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

    it('sets client to null when callback fires with null', () => {
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

    it('sets measurements to null when callback fires with null', () => {
      updateCallbacks[1]!([mockMeasurement])
      updateCallbacks[1]!(null)
      expect(result.data.measurements.value).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  describe('activeChallenges', () => {
    it('returns empty array when client is null', () => {
      expect(result.data.activeChallenges.value).toEqual([])
    })

    it('returns only pending challenges', () => {
      updateCallbacks[0]!(mockClient)
      expect(result.data.activeChallenges.value).toEqual([pendingChallenge])
    })

    it('excludes completed challenges', () => {
      updateCallbacks[0]!(mockClient)
      const ids = result.data.activeChallenges.value.map((c) => c._id)
      expect(ids).not.toContain(completedChallenge._id)
    })

    it('returns empty array when all challenges are completed', () => {
      updateCallbacks[0]!({ ...mockClient, challenges: [completedChallenge] })
      expect(result.data.activeChallenges.value).toEqual([])
    })

    it('reacts when client challenges update', () => {
      updateCallbacks[0]!(mockClient)
      expect(result.data.activeChallenges.value).toHaveLength(1)
      updateCallbacks[0]!({ ...mockClient, challenges: [] })
      expect(result.data.activeChallenges.value).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  describe('completedChallenges', () => {
    it('returns empty array when client is null', () => {
      expect(result.data.completedChallenges.value).toEqual([])
    })

    it('returns only completed challenges', () => {
      updateCallbacks[0]!(mockClient)
      expect(result.data.completedChallenges.value).toEqual([completedChallenge])
    })

    it('excludes pending challenges', () => {
      updateCallbacks[0]!(mockClient)
      const ids = result.data.completedChallenges.value.map((c) => c._id)
      expect(ids).not.toContain(pendingChallenge._id)
    })

    it('returns empty array when all challenges are pending', () => {
      updateCallbacks[0]!({ ...mockClient, challenges: [pendingChallenge] })
      expect(result.data.completedChallenges.value).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  describe('awardXP', () => {
    beforeEach(() => {
      mockHelpers.mockMutation.mockResolvedValue(undefined)
    })

    it('returns true on success', async () => {
      const ok = await result.actions.awardXP(100, 'Great workout')
      expect(ok).toBe(true)
    })

    it('sets awardSuccess to true on success', async () => {
      await result.actions.awardXP(100, 'Great workout')
      expect(result.data.awardSuccess.value).toBe(true)
    })

    it('resets isAwarding to false after success', async () => {
      await result.actions.awardXP(100, 'Great workout')
      expect(result.data.isAwarding.value).toBe(false)
    })

    it('sets isAwarding to true while mutation is pending', async () => {
      let resolve!: () => void
      mockHelpers.mockMutation.mockReturnValue(new Promise<void>((r) => { resolve = r }))
      const promise = result.actions.awardXP(100, 'Reason')
      expect(result.data.isAwarding.value).toBe(true)
      resolve()
      await promise
    })

    it('passes trimmed reason to mutation', async () => {
      await result.actions.awardXP(100, '  Great workout  ')
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'clients:awardXP',
        expect.objectContaining({ reason: 'Great workout' }),
      )
    })

    it('passes the correct amount to mutation', async () => {
      await result.actions.awardXP(250, 'Reason')
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'clients:awardXP',
        expect.objectContaining({ amount: 250 }),
      )
    })

    it('passes the clientId to mutation', async () => {
      await result.actions.awardXP(100, 'Reason')
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'clients:awardXP',
        expect.objectContaining({ clientId: CLIENT_ID }),
      )
    })

    it('clears awardError before each new attempt', async () => {
      mockHelpers.mockMutation.mockRejectedValueOnce(new Error('first error'))
      await result.actions.awardXP(100, 'Reason')
      expect(result.data.awardError.value).toBe('first error')
      mockHelpers.mockMutation.mockResolvedValue(undefined)
      await result.actions.awardXP(100, 'Reason')
      expect(result.data.awardError.value).toBe('')
    })

    it('resets awardSuccess to false after 3 seconds', async () => {
      vi.useFakeTimers()
      await result.actions.awardXP(100, 'Great workout')
      expect(result.data.awardSuccess.value).toBe(true)
      vi.advanceTimersByTime(3000)
      expect(result.data.awardSuccess.value).toBe(false)
    })

    describe('on failure', () => {
      beforeEach(() => {
        mockHelpers.mockMutation.mockRejectedValue(new Error('Unauthorized'))
      })

      it('returns false', async () => {
        const ok = await result.actions.awardXP(100, 'Reason')
        expect(ok).toBe(false)
      })

      it('sets awardError to the error message', async () => {
        await result.actions.awardXP(100, 'Reason')
        expect(result.data.awardError.value).toBe('Unauthorized')
      })

      it('resets isAwarding to false after failure', async () => {
        await result.actions.awardXP(100, 'Reason')
        expect(result.data.isAwarding.value).toBe(false)
      })

      it('does not set awardSuccess on failure', async () => {
        await result.actions.awardXP(100, 'Reason')
        expect(result.data.awardSuccess.value).toBe(false)
      })

      it('uses a generic message for non-Error rejections', async () => {
        mockHelpers.mockMutation.mockRejectedValue('oops')
        await result.actions.awardXP(100, 'Reason')
        expect(result.data.awardError.value).toBe('Failed to award XP')
      })
    })
  })

  // -------------------------------------------------------------------------
  describe('logMeasurement', () => {
    const xpResult = { xpEarned: 75, reasons: ['Weight improvement', 'Consistency'] }
    const input = { weight: 70, bodyFat: 18, muscleMass: 42 }

    beforeEach(() => {
      mockHelpers.mockMutation.mockResolvedValue(xpResult)
    })

    it('returns true on success', async () => {
      const ok = await result.actions.logMeasurement(input)
      expect(ok).toBe(true)
    })

    it('sets lastXPResult on success', async () => {
      await result.actions.logMeasurement(input)
      expect(result.data.lastXPResult.value).toEqual(xpResult)
    })

    it('resets isLogging to false after success', async () => {
      await result.actions.logMeasurement(input)
      expect(result.data.isLogging.value).toBe(false)
    })

    it('sets isLogging to true while mutation is pending', async () => {
      let resolve!: (v: unknown) => void
      mockHelpers.mockMutation.mockReturnValue(new Promise((r) => { resolve = r }))
      const promise = result.actions.logMeasurement(input)
      expect(result.data.isLogging.value).toBe(true)
      resolve(xpResult)
      await promise
    })

    it('clears lastXPResult at the start of a new attempt', async () => {
      await result.actions.logMeasurement(input)
      expect(result.data.lastXPResult.value).toEqual(xpResult)
      mockHelpers.mockMutation.mockRejectedValue(new Error('fail'))
      await result.actions.logMeasurement(input)
      expect(result.data.lastXPResult.value).toBeNull()
    })

    it('passes weight, bodyFat and muscleMass to mutation', async () => {
      await result.actions.logMeasurement(input)
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'measurements:logMeasurement',
        expect.objectContaining(input),
      )
    })

    it('passes optional notes to mutation when provided', async () => {
      await result.actions.logMeasurement({ ...input, notes: 'Post-session' })
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'measurements:logMeasurement',
        expect.objectContaining({ notes: 'Post-session' }),
      )
    })

    it('passes the clientId to mutation', async () => {
      await result.actions.logMeasurement(input)
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'measurements:logMeasurement',
        expect.objectContaining({ clientId: CLIENT_ID }),
      )
    })

    describe('on failure', () => {
      beforeEach(() => {
        mockHelpers.mockMutation.mockRejectedValue(new Error('Server error'))
      })

      it('returns false', async () => {
        const ok = await result.actions.logMeasurement(input)
        expect(ok).toBe(false)
      })

      it('sets logError to the error message', async () => {
        await result.actions.logMeasurement(input)
        expect(result.data.logError.value).toBe('Server error')
      })

      it('resets isLogging to false after failure', async () => {
        await result.actions.logMeasurement(input)
        expect(result.data.isLogging.value).toBe(false)
      })

      it('uses a generic message for non-Error rejections', async () => {
        mockHelpers.mockMutation.mockRejectedValue('oops')
        await result.actions.logMeasurement(input)
        expect(result.data.logError.value).toBe('Failed to log measurement')
      })
    })
  })

  // -------------------------------------------------------------------------
  describe('toggleNutritionistAccess', () => {
    it('resets isTogglingAccess to false after success', async () => {
      mockHelpers.mockMutation.mockResolvedValue(undefined)
      await result.actions.toggleNutritionistAccess()
      expect(result.data.isTogglingAccess.value).toBe(false)
    })

    it('sets isTogglingAccess to true while mutation is pending', async () => {
      let resolve!: () => void
      mockHelpers.mockMutation.mockReturnValue(new Promise<void>((r) => { resolve = r }))
      const promise = result.actions.toggleNutritionistAccess()
      expect(result.data.isTogglingAccess.value).toBe(true)
      resolve()
      await promise
    })

    it('resets isTogglingAccess to false even on failure', async () => {
      mockHelpers.mockMutation.mockRejectedValue(new Error('fail'))
      await result.actions.toggleNutritionistAccess().catch(() => {})
      expect(result.data.isTogglingAccess.value).toBe(false)
    })

    it('calls the correct mutation with the clientId', async () => {
      mockHelpers.mockMutation.mockResolvedValue(undefined)
      await result.actions.toggleNutritionistAccess()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        'clients:toggleNutritionistAccess',
        expect.objectContaining({ clientId: CLIENT_ID }),
      )
    })
  })

  // -------------------------------------------------------------------------
  describe('cleanup', () => {
    it('registers exactly one onUnmounted handler', () => {
      expect(mockHelpers.onUnmountedCallbacks).toHaveLength(1)
    })

    it('calls both unsub functions on unmount', () => {
      mockHelpers.onUnmountedCallbacks[0]!()
      expect(unsubFns[0]).toHaveBeenCalledOnce()
      expect(unsubFns[1]).toHaveBeenCalledOnce()
    })
  })
})
