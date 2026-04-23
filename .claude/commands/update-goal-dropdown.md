# update-goal-dropdown.md

## What this command does

Converts the client goal field from a free-text input to a fixed dropdown in two places:

1. `/trainer/new-client` — NewClientView.vue + useNewClient composable
2. `/trainer/client/:clientId` — ClientDetailView.vue (edit goal via modal)

---

## The 10 goal categories (use exactly these strings)

```
Fat Loss
Muscle Gain
Strength Building
General Fitness
Endurance / Cardio
Body Recomposition
Flexibility & Mobility
Athletic Performance
Rehabilitation & Recovery
Lifestyle & Wellness
```

---

## Change 1 — useNewClient.ts

Replace:

```typescript
const goal = ref('')
```

With:

```typescript
const GOAL_OPTIONS = [
  'Fat Loss',
  'Muscle Gain',
  'Strength Building',
  'General Fitness',
  'Endurance / Cardio',
  'Body Recomposition',
  'Athletic Performance',
  'Flexibility & Mobility',
  'Rehabilitation & Recovery',
  'Lifestyle & Wellness',
] as const

const goal = ref<string>('')
```

Export `GOAL_OPTIONS` from the composable return so the Vue template can use it.

---

## Change 2 — NewClientView.vue

Find the goal input field (currently a text input with placeholder "e.g. Lose 10kg") and replace it with a `<select>` dropdown:

```html
<div>
  <label class="text-xs font-medium text-gray-600 mb-1 block">Goal</label>
  <select
    v-model="goal"
    required
    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
  >
    <option value="" disabled>Select a goal…</option>
    <option v-for="option in actions.goalOptions" :key="option" :value="option">
      {{ option }}
    </option>
  </select>
</div>
```

Export `goalOptions` from actions in the composable return.

---

## Change 3 — ClientDetailView.vue (edit goal modal)

### 3a — Add modal state in script setup

Add these refs after the existing form state refs:

```typescript
const isEditingGoal = ref(false)
const editGoalValue = ref('')

function openGoalModal() {
  editGoalValue.value = client.value!.goal
  isEditingGoal.value = true
}

async function handleSaveGoal() {
  if (!editGoalValue.value) return
  await actions.updateGoal(editGoalValue.value)
  isEditingGoal.value = false
}
```

### 3b — Add edit icon next to goal text in the client header card

Find this line in the template:

```html
<p class="text-sm text-gray-500 mt-1">Age {{ client.age }} · {{ client.goal }}</p>
```

Replace with:

```html
<p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
  Age {{ client.age }} · {{ client.goal }}
  <button
    class="text-gray-300 hover:text-gray-500 transition-colors"
    title="Edit goal"
    @click="openGoalModal"
  >
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z"
      />
    </svg>
  </button>
</p>
```

### 3c — Add the modal at the bottom of the template (before closing </template>)

```html
<!-- Edit Goal Modal -->
<div
  v-if="isEditingGoal"
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
  @click.self="isEditingGoal = false"
>
  <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
    <h3 class="text-base font-semibold text-gray-900 mb-4">Edit Client Goal</h3>
    <select
      v-model="editGoalValue"
      class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white mb-4"
    >
      <option value="" disabled>Select a goal…</option>
      <option v-for="option in goalOptions" :key="option" :value="option">{{ option }}</option>
    </select>
    <div class="flex gap-3">
      <button
        class="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        @click="isEditingGoal = false"
      >
        Cancel
      </button>
      <button
        :disabled="!editGoalValue"
        class="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
        @click="handleSaveGoal"
      >
        Save
      </button>
    </div>
  </div>
</div>
```

---

## Change 4 — useClientDetail.ts

Add an `updateGoal` action that patches the client's goal in Convex:

```typescript
async function updateGoal(newGoal: string): Promise<boolean> {
  try {
    await convex.mutation(api.clients.updateClientGoal, {
      clientId: clientId as Id<'clients'>,
      goal: newGoal,
    })
    return true
  } catch (e) {
    return false
  }
}
```

Export it in actions.

---

## Change 5 — convex/clients.ts

Add a new mutation `updateClientGoal`:

```typescript
export const updateClientGoal = mutation({
  args: {
    clientId: v.id('clients'),
    goal: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const trainer = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!trainer) throw new Error('Trainer not found')

    const client = await ctx.db.get(args.clientId)
    if (!client) throw new Error('Client not found')
    if (client.trainerId !== trainer._id) throw new Error('Not authorized')

    await ctx.db.patch(args.clientId, { goal: args.goal })
  },
})
```

---

## Important notes for Claude Code

- `GOAL_OPTIONS` should be defined once and shared — export from composable, import in template via actions
- The modal closes when clicking outside (`.self` modifier handles this)
- Do not change anything else in these files
- Do not touch the Convex schema — `goal` is already `v.string()` so no migration needed
- Follow existing patterns for error handling and loading states in useClientDetail

```

---

## Important notes for Claude Code

- `GOAL_OPTIONS` should be defined once and shared — export from composable, import in template via actions
- The modal closes when clicking outside (`.self` modifier handles this)
- Do not change anything else in these files
- Do not touch the Convex schema — `goal` is already `v.string()` so no migration needed
- Follow existing patterns for error handling and loading states in useClientDetail
```
