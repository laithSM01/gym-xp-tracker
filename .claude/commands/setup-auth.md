Read CLAUDE.md, convex/\_generated/ai/guidelines.md, and .claude/skills/convex-setup-auth/references/clerk.md first.

Then set up Clerk authentication with Convex for this Vue 3 TypeScript gym management app:

1. Create convex/auth.config.ts using the Clerk domain from .env.local VITE_CLERK_PUBLISHABLE_KEY
2. Update src/main.ts to properly wire Clerk and Convex together
3. Create src/layouts/AuthLayout.vue that shows Clerk SignIn component for unauthenticated users
4. Create src/layouts/AppLayout.vue for authenticated users
5. Update src/router/index.ts to protect routes based on auth state

Roles in this app: trainer, client, nutritionist. Each user has a role stored in Convex.
