Create a simple onboarding flow for first-time users:

1. After Clerk sign-in, check if the user has a Convex record via getCurrentUser query
2. If no record exists, redirect to /onboarding
3. Create src/views/OnboardingView.vue with 3 role cards:
   - Trainer (purple) — "I manage and train clients"
   - Client (teal) — "I am here to train and improve"
   - Nutritionist (amber) — "I manage client nutrition plans"
4. On card click, call upsertUser mutation with the selected role
5. Redirect based on role:
   - trainer → /trainer/dashboard
   - client → /client/dashboard
   - nutritionist → /nutritionist/dashboard
6. Protect all dashboard routes — if no role yet, always redirect to /onboarding

Keep the UI clean and simple with Tailwind CSS.
