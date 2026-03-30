Read CLAUDE.md and convex/\_generated/ai/guidelines.md first.

Build the client dashboard for src/views/client/ClientDashboardView.vue.

The logged in client should see ONLY their own data.

1. Add getMyProfile query to convex/clients.ts:
   - Gets the logged in user via ctx.auth.getUserIdentity()
   - Returns their clients row + userName, tier, XP, goal, age

2. Add getMyMeasurements query to convex/measurements.ts:
   - Returns last 10 measurements for the logged in client

3. Add getMyChallenges query to convex/challenges.ts (create file if needed):
   - Returns all challenges assigned to the logged in client
   - Split into active (pending) and completed

4. Build src/views/client/ClientDashboardView.vue:
   - Welcome header with client name
   - Current tier badge + XP bar showing progress to next tier
   - Recent measurements table (last 5)
   - Active challenges list with XP rewards
   - Completed challenges list (strikethrough)

Use same tier colors as TrainerDashboardView.vue:
beginner=gray, novice=blue, intermediate=amber, advanced=purple, elite=green
