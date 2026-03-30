<script setup lang="ts">
import { ref, inject, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

const router = useRouter()
const convex = inject<ConvexClient>('convex')!

type UnassignedUser = {
  _id: string
  name?: string
  email?: string
}

const unassignedClients = ref<UnassignedUser[] | null>(null)
const { unsubscribe } = convex.onUpdate(api.clients.getUnassignedClients, {}, (data) => {
  unassignedClients.value = data as UnassignedUser[] | null
})
onUnmounted(() => unsubscribe())

// Step 1: select a user
const selectedUserId = ref<string>('')
const search = ref('')

const filteredClients = computed(() => {
  const list = unassignedClients.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((u) => {
    const name = (u.name ?? '').toLowerCase()
    const email = (u.email ?? '').toLowerCase()
    return name.includes(q) || email.includes(q)
  })
})

function displayName(u: UnassignedUser) {
  return u.name ?? u.email ?? u._id
}

// Step 2: intake form
const age = ref('')
const goal = ref('')
const weight = ref('')
const bodyFat = ref('')
const muscleMass = ref('')

const isSubmitting = ref(false)
const submitError = ref('')

const isFormValid = computed(() =>
  selectedUserId.value &&
  age.value &&
  parseInt(age.value) > 0 &&
  goal.value.trim() &&
  weight.value &&
  parseFloat(weight.value) > 0 &&
  bodyFat.value &&
  parseFloat(bodyFat.value) > 0 &&
  muscleMass.value &&
  parseFloat(muscleMass.value) > 0,
)

async function submit() {
  if (!isFormValid.value) return
  isSubmitting.value = true
  submitError.value = ''
  try {
    const clientId = await convex.mutation(api.clients.createClient, {
      userId: selectedUserId.value as Id<'users'>,
      age: parseInt(age.value),
      goal: goal.value.trim(),
      initialWeight: parseFloat(weight.value),
      initialBodyFat: parseFloat(bodyFat.value),
      initialMuscleMass: parseFloat(muscleMass.value),
    })
    router.push(`/trainer/client/${clientId as Id<'clients'>}`)
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Failed to create client'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto">
    <!-- Back -->
    <button
      class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      @click="router.back()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to dashboard
    </button>

    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h1 class="text-xl font-bold text-gray-900 mb-1">New Client Intake</h1>
      <p class="text-sm text-gray-400 mb-6">Select an existing client account and fill in their intake details.</p>

      <form class="flex flex-col gap-5" @submit.prevent="submit">
        <!-- Step 1: select client -->
        <div>
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Client</h2>

          <!-- Loading -->
          <div v-if="unassignedClients === null" class="flex items-center gap-2 text-sm text-gray-400 py-2">
            <div class="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
            Loading available clients…
          </div>

          <div v-else-if="unassignedClients.length === 0" class="text-sm text-gray-400 py-2">
            No unassigned clients found. All registered clients are already enrolled.
          </div>

          <div v-else class="flex flex-col gap-2">
            <input
              v-model="search"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Search by name or email…"
            />
            <div class="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              <div v-if="filteredClients.length === 0" class="px-3 py-2 text-sm text-gray-400">
                No matches
              </div>
              <button
                v-for="u in filteredClients"
                :key="u._id"
                type="button"
                class="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                :class="selectedUserId === u._id ? 'bg-purple-50' : ''"
                @click="selectedUserId = u._id"
              >
                <div
                  class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                  :class="selectedUserId === u._id ? 'border-purple-600 bg-purple-600' : 'border-gray-300'"
                >
                  <div v-if="selectedUserId === u._id" class="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">{{ displayName(u) }}</p>
                  <p v-if="u.name && u.email" class="text-xs text-gray-400 truncate">{{ u.email }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: intake form (only when a client is selected) -->
        <template v-if="selectedUserId">
          <div>
            <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Client Info</h2>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-medium text-gray-600 mb-1 block">Age</label>
                <input
                  v-model="age"
                  type="number"
                  min="10"
                  max="100"
                  required
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="28"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600 mb-1 block">Goal</label>
                <input
                  v-model="goal"
                  type="text"
                  required
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g. Lose 10kg"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Baseline Measurements</h2>
            <p class="text-xs text-gray-400 mb-3">Intake values — no XP is awarded for the first measurement.</p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-xs font-medium text-gray-600 mb-1 block">Weight (kg)</label>
                <input
                  v-model="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="80.0"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600 mb-1 block">Body Fat (%)</label>
                <input
                  v-model="bodyFat"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="22.0"
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600 mb-1 block">Muscle (kg)</label>
                <input
                  v-model="muscleMass"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="35.0"
                />
              </div>
            </div>
          </div>
        </template>

        <p v-if="submitError" class="text-xs text-red-500">{{ submitError }}</p>

        <button
          type="submit"
          :disabled="isSubmitting || !isFormValid"
          class="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isSubmitting ? 'Creating…' : 'Create Client' }}
        </button>
      </form>
    </div>
  </div>
</template>
