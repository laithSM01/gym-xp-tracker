---
name: vue-nuxt-architecture
description: 'Team conventions for Nuxt 3 + Vue 3 projects, composables, Convex usage, TypeScript, and testing rules'
---

## Core Principles

- Nuxt 3 is the application framework (SSR/CSR handled by Nuxt only)
- Convex is strictly the data layer (no business logic in components)
- Clear separation: UI ↔ composables ↔ data layer
- Prefer simplicity and consistency over cleverness

---

## Tech Rules

- Vue 3 (Composition API only)
- Nuxt 3 conventions must be followed (auto-imports, file-based routing)
- TypeScript required in all logic files (composables, services, stores)
- No business logic inside `.vue` templates

---

## Folder Structure

- `/pages` → routing only
- `/components` → dumb/presentational UI
- `/composables` → reusable logic (main business layer)
- `/stores` → global state (Pinia or useState)
- `/server` → server routes / backend logic (if needed)
- `/utils` → pure helper functions
- `/types` → shared TypeScript types

---

## Component Rules

- Components must be presentational only
- No direct API/Convex calls inside components
- Receive data via props, emit events for actions
- Keep components small and reusable

---

## Composables Rules

- All business logic lives here
- Responsible for:
  - Calling Convex
  - Transforming data
  - Handling loading/error states
- Must start with `use` (e.g. `useTrainees`)
- Return structured object:

```ts
return {
  data,
  loading,
  error,
  actions,
}
```

---

## Testing Rules

- Vitest for all unit tests
- Test files live next to the composable: `composables/useXP.test.ts`
- Test the return values and logic, not Convex calls directly
- Mock Convex in tests
