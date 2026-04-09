import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'
import type { UnassignedUser } from '@/types/client'
import { useNewClient } from './useNewClient'

// ---------------------------------------------------------------------------
// Hoisted mock helpers — created before any imports resolve
// ---------------------------------------------------------------------------

const mockHelpers = vi.hoisted(() => {
  const mockOnUpdate = vi.fn()
  const mockMutation = vi.fn()
  const mockPush = vi.fn()
  const onUnmountedCallbacks: (() => void)[] = []
  const mockOnUnmounted = vi.fn((cb: () => void) => {
    onUnmountedCallbacks.push(cb)
  })
  return { mockOnUpdate, mockMutation, mockPush, mockOnUnmounted, onUnmountedCallbacks }
})

vi.mock('@convex/_generated/api', () => ({
  api: {
    clients: {
      getUnassignedClients: 'clients:getUnassignedClients',
      createClient: 'clients:createClient',
    },
  },
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: mockHelpers.mockPush })),
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

const mockClients: UnassignedUser[] = [
  { _id: 'u1', name: 'Alice Smith', email: 'alice@example.com' },
  { _id: 'u2', name: 'Bob Jones', email: 'bob@example.com' },
  { _id: 'u3', email: 'carol@example.com' },
  { _id: 'u4' },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNewClient', () => {
  let updateCallback: ((data: unknown) => void) | undefined
  let unsubFn: ReturnType<typeof vi.fn>
  let scope: ReturnType<typeof effectScope>
  let result: ReturnType<typeof useNewClient>

  beforeEach(() => {
    vi.clearAllMocks()
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
      result = useNewClient()
    })
  })

  afterEach(() => {
    scope.stop()
  })

  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('unassignedClients is null', () => {
      expect(result.data.unassignedClients.value).toBeNull()
    })

    it('loading is true', () => {
      expect(result.loading.value).toBe(true)
    })

    it('error is null', () => {
      expect(result.error).toBeNull()
    })

    it('selectedUserId is empty string', () => {
      expect(result.data.selectedUserId.value).toBe('')
    })

    it('search is empty string', () => {
      expect(result.data.search.value).toBe('')
    })

    it('filteredClients is empty array when unassignedClients is null', () => {
      expect(result.data.filteredClients.value).toEqual([])
    })

    it('age is empty string', () => {
      expect(result.data.age.value).toBe('')
    })

    it('goal is empty string', () => {
      expect(result.data.goal.value).toBe('')
    })

    it('weight is empty string', () => {
      expect(result.data.weight.value).toBe('')
    })

    it('bodyFat is empty string', () => {
      expect(result.data.bodyFat.value).toBe('')
    })

    it('muscleMass is empty string', () => {
      expect(result.data.muscleMass.value).toBe('')
    })

    it('isSubmitting is false', () => {
      expect(result.data.isSubmitting.value).toBe(false)
    })

    it('submitError is empty string', () => {
      expect(result.data.submitError.value).toBe('')
    })

    it('isFormValid is falsy', () => {
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('starts exactly 1 subscription', () => {
      expect(mockHelpers.mockOnUpdate).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  describe('unassignedClients subscription', () => {
    it('sets clients when callback fires', () => {
      updateCallback!(mockClients)
      expect(result.data.unassignedClients.value).toEqual(mockClients)
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
      expect(result.data.unassignedClients.value).toEqual([])
    })

    it('handles null (resets to null)', () => {
      updateCallback!(mockClients)
      updateCallback!(null)
      expect(result.data.unassignedClients.value).toBeNull()
    })

    it('loading returns to true when reset to null', () => {
      updateCallback!(mockClients)
      updateCallback!(null)
      expect(result.loading.value).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  describe('filteredClients', () => {
    beforeEach(() => {
      updateCallback!(mockClients)
    })

    it('returns all clients when search is empty', () => {
      expect(result.data.filteredClients.value).toEqual(mockClients)
    })

    it('filters by name (case-insensitive)', () => {
      result.data.search.value = 'alice'
      expect(result.data.filteredClients.value).toEqual([mockClients[0]])
    })

    it('filters by email (case-insensitive)', () => {
      result.data.search.value = 'bob@'
      expect(result.data.filteredClients.value).toEqual([mockClients[1]])
    })

    it('filters by partial name', () => {
      result.data.search.value = 'jones'
      expect(result.data.filteredClients.value).toEqual([mockClients[1]])
    })

    it('filters by partial email', () => {
      result.data.search.value = 'carol'
      expect(result.data.filteredClients.value).toEqual([mockClients[2]])
    })

    it('is case-insensitive for uppercase query', () => {
      result.data.search.value = 'ALICE'
      expect(result.data.filteredClients.value).toEqual([mockClients[0]])
    })

    it('returns empty array when no matches', () => {
      result.data.search.value = 'zzznomatch'
      expect(result.data.filteredClients.value).toEqual([])
    })

    it('trims whitespace from search query', () => {
      result.data.search.value = '  alice  '
      expect(result.data.filteredClients.value).toEqual([mockClients[0]])
    })

    it('matches multiple clients when query is broad', () => {
      result.data.search.value = 'example.com'
      expect(result.data.filteredClients.value).toHaveLength(3)
    })

    it('returns empty array when unassignedClients resets to null', () => {
      updateCallback!(null)
      expect(result.data.filteredClients.value).toEqual([])
    })

    it('matches user with no name via email only', () => {
      result.data.search.value = 'carol@example.com'
      expect(result.data.filteredClients.value).toEqual([mockClients[2]])
    })

    it('does not match user with no name or email via name query', () => {
      result.data.search.value = 'alice'
      const noNameNoEmail = result.data.filteredClients.value.find((u) => u._id === 'u4')
      expect(noNameNoEmail).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  describe('displayName', () => {
    it('returns name when name is present', () => {
      expect(result.actions.displayName({ _id: 'u1', name: 'Alice', email: 'alice@example.com' })).toBe('Alice')
    })

    it('falls back to email when name is absent', () => {
      expect(result.actions.displayName({ _id: 'u3', email: 'carol@example.com' })).toBe('carol@example.com')
    })

    it('falls back to _id when neither name nor email', () => {
      expect(result.actions.displayName({ _id: 'u4' })).toBe('u4')
    })

    it('prefers name over email when both are present', () => {
      const display = result.actions.displayName({ _id: 'u1', name: 'Alice', email: 'alice@example.com' })
      expect(display).not.toBe('alice@example.com')
    })
  })

  // -------------------------------------------------------------------------
  describe('isFormValid', () => {
    function fillValidForm() {
      result.data.selectedUserId.value = 'user-1'
      result.data.age.value = '25'
      result.data.goal.value = 'Lose weight'
      result.data.weight.value = '80'
      result.data.bodyFat.value = '20'
      result.data.muscleMass.value = '35'
    }

    it('is truthy when all fields are valid', () => {
      fillValidForm()
      expect(result.data.isFormValid.value).toBeTruthy()
    })

    it('is falsy when selectedUserId is empty', () => {
      fillValidForm()
      result.data.selectedUserId.value = ''
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when age is empty', () => {
      fillValidForm()
      result.data.age.value = ''
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when age is zero', () => {
      fillValidForm()
      result.data.age.value = '0'
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when age is negative', () => {
      fillValidForm()
      result.data.age.value = '-5'
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when goal is empty', () => {
      fillValidForm()
      result.data.goal.value = ''
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when goal is whitespace only', () => {
      fillValidForm()
      result.data.goal.value = '   '
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when weight is empty', () => {
      fillValidForm()
      result.data.weight.value = ''
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when weight is zero', () => {
      fillValidForm()
      result.data.weight.value = '0'
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when bodyFat is empty', () => {
      fillValidForm()
      result.data.bodyFat.value = ''
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when bodyFat is zero', () => {
      fillValidForm()
      result.data.bodyFat.value = '0'
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when muscleMass is empty', () => {
      fillValidForm()
      result.data.muscleMass.value = ''
      expect(result.data.isFormValid.value).toBeFalsy()
    })

    it('is falsy when muscleMass is zero', () => {
      fillValidForm()
      result.data.muscleMass.value = '0'
      expect(result.data.isFormValid.value).toBeFalsy()
    })
  })

  // -------------------------------------------------------------------------
  describe('submit', () => {
    function fillValidForm() {
      result.data.selectedUserId.value = 'user-1'
      result.data.age.value = '25'
      result.data.goal.value = 'Lose weight'
      result.data.weight.value = '80'
      result.data.bodyFat.value = '20'
      result.data.muscleMass.value = '35'
    }

    it('does nothing when form is invalid', async () => {
      await result.actions.submit()
      expect(mockHelpers.mockMutation).not.toHaveBeenCalled()
    })

    it('calls convex.mutation with correct arguments', async () => {
      mockHelpers.mockMutation.mockResolvedValueOnce('client-123')
      fillValidForm()
      await result.actions.submit()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith('clients:createClient', {
        userId: 'user-1',
        age: 25,
        goal: 'Lose weight',
        initialWeight: 80,
        initialBodyFat: 20,
        initialMuscleMass: 35,
      })
    })

    it('parses numeric fields as numbers', async () => {
      mockHelpers.mockMutation.mockResolvedValueOnce('client-123')
      fillValidForm()
      result.data.age.value = '30'
      result.data.weight.value = '75.5'
      result.data.bodyFat.value = '18.2'
      result.data.muscleMass.value = '40.0'
      await result.actions.submit()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ age: 30, initialWeight: 75.5, initialBodyFat: 18.2, initialMuscleMass: 40.0 }),
      )
    })

    it('trims goal before submitting', async () => {
      mockHelpers.mockMutation.mockResolvedValueOnce('client-123')
      fillValidForm()
      result.data.goal.value = '  Build muscle  '
      await result.actions.submit()
      expect(mockHelpers.mockMutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ goal: 'Build muscle' }),
      )
    })

    it('navigates to client detail page on success', async () => {
      mockHelpers.mockMutation.mockResolvedValueOnce('client-123')
      fillValidForm()
      await result.actions.submit()
      expect(mockHelpers.mockPush).toHaveBeenCalledWith('/trainer/client/client-123')
    })

    it('sets isSubmitting to true during mutation', async () => {
      let capturedIsSubmitting = false
      mockHelpers.mockMutation.mockImplementationOnce(async () => {
        capturedIsSubmitting = result.data.isSubmitting.value
        return 'client-123'
      })
      fillValidForm()
      await result.actions.submit()
      expect(capturedIsSubmitting).toBe(true)
    })

    it('resets isSubmitting to false after success', async () => {
      mockHelpers.mockMutation.mockResolvedValueOnce('client-123')
      fillValidForm()
      await result.actions.submit()
      expect(result.data.isSubmitting.value).toBe(false)
    })

    it('resets isSubmitting to false after failure', async () => {
      mockHelpers.mockMutation.mockRejectedValueOnce(new Error('Network error'))
      fillValidForm()
      await result.actions.submit()
      expect(result.data.isSubmitting.value).toBe(false)
    })

    it('sets submitError with the Error message on failure', async () => {
      mockHelpers.mockMutation.mockRejectedValueOnce(new Error('Server error'))
      fillValidForm()
      await result.actions.submit()
      expect(result.data.submitError.value).toBe('Server error')
    })

    it('sets submitError to fallback message for non-Error throws', async () => {
      mockHelpers.mockMutation.mockRejectedValueOnce('something bad')
      fillValidForm()
      await result.actions.submit()
      expect(result.data.submitError.value).toBe('Failed to create client')
    })

    it('clears submitError at the start of each attempt', async () => {
      mockHelpers.mockMutation.mockRejectedValueOnce(new Error('First error'))
      fillValidForm()
      await result.actions.submit()
      expect(result.data.submitError.value).toBe('First error')

      mockHelpers.mockMutation.mockResolvedValueOnce('client-123')
      await result.actions.submit()
      expect(result.data.submitError.value).toBe('')
    })

    it('does not navigate on failure', async () => {
      mockHelpers.mockMutation.mockRejectedValueOnce(new Error('Network error'))
      fillValidForm()
      await result.actions.submit()
      expect(mockHelpers.mockPush).not.toHaveBeenCalled()
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
