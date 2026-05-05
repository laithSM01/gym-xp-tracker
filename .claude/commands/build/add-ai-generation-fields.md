## Purpose

Add height, sportType, and trainerNotes to the AI program generation flow.

## Instructions

1. Read `.claude/skills/vue-nuxt-architecture` before starting
2. Read each file listed below before touching it
3. Make changes in this exact order — do not skip steps

## Step 1 — Convex schema

File: `convex/schema.ts`
Add to the `clients` table:

- `height: v.number()`
- `sportType: v.string()`

## Step 2 — Convex mutation

File: `convex/clients.ts`
Update `createClient` mutation:

- Add `height: v.number()` and `sportType: v.string()` to args
- Pass both fields into the `ctx.db.insert("clients", {...})` call

## Step 3 — TypeScript types

File: `src/types/client.ts`
Add to `ClientDetail` and `TrainerClient`:

- `height: number`
- `sportType: string`

## Step 4 — AI composable

File: `src/composables/useClientAISuggestions.ts`
Update `ClientAIPayload` interface to include:

- `height: number`
- `sportType: string`
- `trainerNotes: string`

## Step 5 — Client detail composable

File: `src/composables/useClientDetail.ts`

- Add `trainerNotes = ref('')` to composable state
- Update `aiPayload` computed to include:
  - `height: client.value!.height`
  - `sportType: client.value!.sportType`
  - `trainerNotes: trainerNotes.value`
- Expose `trainerNotes` in the returned `data` object

## Step 6 — Client detail page

File: `src/pages/clients/[clientId].vue` (or wherever the client detail page lives)

- In the AI Workout Suggestions section, add a textarea input for trainerNotes above the "Get Suggestions" button:
  - Label: "Trainer Notes (optional)"
  - Bind to `trainerNotes` from composable
  - Match existing Tailwind patterns: `rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400`
  - Placeholder: "e.g. Client has lower back pain, avoid deadlifts this week"
- In the client header, add a sport type badge next to the goal text:
  - Match the existing tier badge style
  - Read-only, sourced from `client.sportType`

## Rules

- No business logic in templates
- All new state in composable
- Do not modify any files not listed above
- Do not change schema migration — Convex handles it automatically
  trainerNotes above the "Get Suggestions" button:
  - Label: "Trainer Notes (optional)"
  - Bind to `trainerNotes` from composable
  - Match existing Tailwind patterns: `rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400`
  - Placeholder: "e.g. Client has lower back pain, avoid deadlifts this week"
- In the client header, add a sport type badge next to the goal text:
  - Match the existing tier badge style
  - Read-only, sourced from `client.sportType`

## Rules

- No business logic in templates
- All new state in composable
- Do not modify any files not listed above
- Do not change schema migration — Convex handles it automatically
