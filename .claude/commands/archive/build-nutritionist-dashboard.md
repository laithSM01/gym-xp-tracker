Read CLAUDE.md and convex/\_generated/ai/guidelines.md first.

Build the nutritionist dashboard.

1. Add getAccessibleClients query to convex/clients.ts:
   - Gets the logged in nutritionist via ctx.auth.getUserIdentity()
   - Returns all clients where nutritionistAccess = true
   - Include userName, tier, XP, goal, age for each client

2. Add getNutritionPlan query to convex/nutritionPlans.ts (create if needed):
   - Returns the nutrition plan for a specific clientId
   - Returns null if no plan exists yet

3. Add upsertNutritionPlan mutation to convex/nutritionPlans.ts:
   - Creates or updates a nutrition plan for a client
   - Only nutritionist role can call this
   - Fields: clientId, meals (array of {name, calories, protein, carbs, fat}),
     totalCalories, notes

4. Build src/views/nutritionist/NutritionistDashboardView.vue:
   - List of accessible clients (nutritionistAccess = true only)
   - Each client shows name, tier badge, XP, goal
   - Click client → opens a side panel or navigates to client nutrition view
   - Shows "No clients yet" if none have been granted access

5. Create src/views/nutritionist/ClientNutritionView.vue:
   - Read-only client info at top: name, tier, age, goal, latest measurements
   - Nutrition plan form below: meals list, total calories, notes
   - Save button calls upsertNutritionPlan
   - Add route /nutritionist/client/:clientId to router

Use same tier colors and card styles as other views.
