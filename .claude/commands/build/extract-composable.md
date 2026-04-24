## Context

Follow the `vue-nuxt-architecture` skill conventions strictly.

# extract-composable

## Goal

Refactor a Vue/Nuxt component by extracting business logic into composables, enforcing the `vue-nuxt-architecture` conventions.

---

## Instructions

### 1. Read Target Component

- Analyze the provided `.vue` file fully
- Identify:
  - `<script setup>` logic
  - Imports
  - Reactive state
  - Computed values
  - API/Convex calls

---

### 2. Identify Extractable Logic

Extract anything that is NOT purely UI:

- Convex/API calls
- Data fetching
- Data transformation / mapping
- Computed business logic
- Watchers tied to business logic
- Reusable utilities

Do NOT extract:

- Template-specific UI state (e.g. modal open/close unless reusable)
- Pure presentation logic tightly coupled to template

---

### 3. Create Composable(s)

- Place in `/composables`
- Name using `useXxx` based on domain (e.g. `useTrainees`, `useNotifications`)
- One composable per domain/responsibility

#### Rules:

- Use TypeScript
- Encapsulate all logic
- Call Convex ONLY inside composables
- Handle loading state and error state
- Clean up Convex subscriptions in `onUnmounted`

#### Return format:

```ts
return {
  data,
  loading,
  error,
  actions,
}
```

---

### 4. Update the Component

- Remove all extracted logic from `<script setup>`
- Import and use the new composable(s)
- Component should only contain UI state and template logic

---

### 5. Move TypeScript Types

- Move all interfaces and types to `/types`
- Name the file after the domain (e.g. `types/client.ts`)
- Import from `/types` in both the composable and component

- Import and use the new composable(s)
- Component should only contain UI state and template logic

---

### 5. Move TypeScript Types

- Move all interfaces and types to `/types`
- Name the file after the domain (e.g. `types/client.ts`)
- Import from `/types` in both the composable and component
- Name the file after the domain (e.g. `types/client.ts`)
- Import from `/types` in both the composable and component
