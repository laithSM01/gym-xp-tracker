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
