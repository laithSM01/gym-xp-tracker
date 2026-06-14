# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Stack

- **Frontend**: Vue 3 + TypeScript + Vite + Vue Router + Pinia
- **Backend**: Convex (real-time BaaS)
- **Auth**: Clerk (configured via `.env.local`)
- **Linting**: Oxlint + ESLint; **Formatting**: Prettier

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Type-check + build for production
npm run lint         # Run oxlint and eslint with auto-fix
npm run format       # Format src/ with Prettier
npm run type-check   # Vue TypeScript type check only
```

To run Convex backend locally alongside the frontend, run `npx convex dev` in a separate terminal. The deployment URL is set via `VITE_CONVEX_URL` in `.env.local`.

## Architecture

The frontend (`src/`) is a Vue 3 SPA:

- `src/main.ts` — app entry, registers Pinia and Vue Router
- `src/router/index.ts` — route definitions
- `src/stores/` — Pinia stores

The backend (`convex/`) contains all server-side logic as Convex functions:

- `convex/schema.ts` — database schema (define tables here)
- Public functions are exposed via the generated `api` object; internal functions via `internal`
- Auth is JWT-based via `convex/auth.config.ts` using Clerk

Environment variables required: `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `CONVEX_DEPLOYMENT`.

## Database Schema

**Existing tables** (trainer-client tracker):
- `users` — roles: `trainer | client | nutritionist | gym_owner`
- `clients` — `trainerId` is optional (gym-assigned clients may not have a trainer yet); `gymId` links to `gyms`
- `challenges`, `xpLogs`, `programs`, `bodyMeasurements`, `nutritionPlans`

**Marketplace tables** (added 2026-06-14):
- `gyms` — gym business profile; `ownerId → users` (role = gym_owner); indexes: `by_ownerId`, `by_city`, `by_isActive`
- `personalTrainers` — extended trainer profile; `userId → users` (role = trainer); indexes: `by_userId`, `by_isActive`
- `subscriptions` — plan (`trainer_solo | gym_starter | gym_pro`), AI generation budget counters, JOD pricing
- `products` — marketplace items per gym/trainer; price in JOD, category enum
- `orders` — product purchases; tracks `platformCutJod` (10–15%), `paymentGateway` (myfatoorah | cliq)
- `joinRequests` — client ↔ gym/trainer pending approval flow
- `trainerGymAffiliation` — many-to-many trainers ↔ gyms

## Routes

| Path | Auth required | Component |
|---|---|---|
| `/` | No | `PublicLayout` → `LandingView` (gym + trainer listings) |
| `/sign-in` | No | `AuthLayout` (Clerk) |
| `/onboarding` | No | `OnboardingView` (role selection) |
| `/trainer/*` | Yes | Trainer dashboard + client management |
| `/client/*` | Yes | Client dashboard |
| `/nutritionist/*` | Yes | Nutritionist dashboard |
| `/gym/dashboard` | Yes | Gym owner dashboard (stub) |

## Frontend Architecture Rule — Service Layer (MANDATORY)

**This project will eventually migrate away from Convex** to a different backend (FastAPI, Django, Node.js, or .NET). To keep that migration painless, all new frontend data-fetching code MUST follow the three-layer pattern:

```
View → Composable → Service (interface) → Adapter (Convex now, HTTP later)
```

### The rule in practice

**Never import Convex directly inside a composable.** Instead:

1. Define a typed service interface in `src/services/<domain>.service.ts`:
```ts
// src/services/gyms.service.ts
export interface GymsService {
  listPublic(): Ref<readonly Gym[]>
}
```

2. Implement it for the current backend in `src/services/convex/<domain>.convex.ts`:
```ts
export class ConvexGymsService implements GymsService { ... }
```

3. Provide it in `main.ts`:
```ts
app.provide('gymsService', new ConvexGymsService(convex))
```

4. In the composable, inject the interface — never ConvexClient or `api.*` directly:
```ts
const gymsService = inject<GymsService>('gymsService')!
const gyms = gymsService.listPublic()
```

### When to swap backends

To migrate a domain to a new backend: write `HttpGymsService implements GymsService` and change the `provide()` line in `main.ts`. **Zero composable or view changes.**

### Applies to

All new composables added from Step 3 (Gym/trainer registration) onward. The 7 existing composables (trainer-client tracker flow) are exempt — they predate this decision.

## Skills

- vue-nuxt-architecture: enforces component architecture, composables pattern, and testing conventions
- vitest: Vitest testing framework patterns and best practices
