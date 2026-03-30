Read CLAUDE.md and convex/\_generated/ai/guidelines.md first.

Do these tasks in order. Do not move to next until current one works.

1. Update convex/schema.ts:
   - Add bodyMeasurements table: clientId, trainerId, weight, bodyFat, muscleMass, notes, timestamp
   - Add nutritionistAccess boolean to clients table

2. Create convex/measurements.ts:
   - logMeasurement mutation: saves measurement, compares to last measurement, auto-calculates XP based on improvement, creates xpLog entry
   - XP rules: body fat decreased → +50 XP per 0.1% decrease, muscle mass increased → +40 XP per 0.1kg increase, attending (logging measurement) → +20 XP bonus
   - getClientMeasurements query: returns all measurements for a client ordered by timestamp desc

3. Update src/views/trainer/ClientDetailView.vue:
   - Add log measurement form: weight, bodyFat, muscleMass, notes
   - Show measurement history table below form
   - Show XP earned from last measurement
   - Add nutritionist access toggle button

4. Add getUnassignedClients query to convex/clients.ts:
   - Returns all users with role "client" who have no row in clients table yet

5. Update createClient mutation in convex/clients.ts:
   - Remove placeholder user creation entirely
   - Accept userId of an existing Convex user instead
   - Create clients row linked to that real userId

6. Update src/views/trainer/NewClientView.vue:
   - Show dropdown/search of unassigned clients using getUnassignedClients
   - After selecting a client, show intake form: age, goal, initial measurements
   - On submit: call createClient with selected userId
   - Redirect to client detail after submit
   - Add "New Client" button link from TrainerDashboardView.vue
