# write-tests

## Context

Follow the `vue-nuxt-architecture` skill conventions.
Use the `vitest` skill for all testing syntax and patterns.

## Goal

Write Vitest unit tests for a composable, following the `vue-nuxt-architecture` skill conventions.

---

## Instructions

### 1. Read the Composable

- Analyze the provided composable file fully
- Identify:
  - All returned values (data, loading, error, actions)
  - Business logic and computed values
  - Convex calls
  - Cleanup logic (onUnmounted)

---

### 2. Plan the Tests

For each piece of logic, plan a test that covers:

- Initial state (loading, empty data)
- Success state (data returned correctly)
- Computed/derived values (e.g. xpProgress, recentMeasurements)
- Edge cases (null data, empty arrays, max values)

---

### 3. Mock Convex

- Never call real Convex in tests
- Mock `convex.onUpdate` to return controlled data
- Mock `inject` to return the mocked Convex client

---

### 4. Write the Tests

- Place test file next to the composable: `composables/useXxx.test.ts`
- Use `describe` to group by feature
- Use `it` for individual cases
- Keep tests small and focused — one assertion per test where possible

#### Structure:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useXxx } from './useXxx'

describe('useXxx', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should start with loading true', () => {
      // ...
    })
  })

  describe('data', () => {
    it('should return profile when loaded', () => {
      // ...
    })
  })
})
```

---

### 5. Verify

- All tests should pass with `npm run test`
- No real Convex or network calls in any test
- No real Convex or network calls in any test
