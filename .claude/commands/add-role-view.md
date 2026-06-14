Scaffold a new role-based view in the Vue 3 frontend.

## Steps

1. Read `src/router/index.ts` to understand existing route structure and role guards.
2. Read an existing view for the target role (e.g. `src/views/trainer/TrainerDashboardView.vue`) to follow conventions.
3. Ask the user (if not already specified):
   - Which role this view belongs to: `trainer | client | nutritionist | gym_owner`
   - The view name (PascalCase, e.g. `GymDashboardView`)
   - The route path (e.g. `/gym/dashboard`)
   - What data it needs from Convex (queries/mutations)
4. Create the view file at `src/views/<role>/<ViewName>.vue`.
5. Create a composable at `src/composables/use<ViewName>.ts` that:
   - Injects the Convex client via `inject<ConvexClient>('convex')`
   - Subscribes to data with `convex.onUpdate()` and cleans up on unmount
   - Exposes reactive state and mutation handlers
6. Register the route in `src/router/index.ts` under the correct role guard block.
7. Add a nav link in `src/layouts/AppLayout.vue` if the view should appear in the sidebar.
