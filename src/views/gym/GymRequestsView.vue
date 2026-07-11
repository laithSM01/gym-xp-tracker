<script setup lang="ts">
import { useIncomingRequests } from '@/composables/useIncomingRequests'

const {
  pendingRequests,
  freeClients,
  respondingTo,
  respondError,
  pingingClient,
  pingError,
  approve,
  reject,
  ping,
} = useIncomingRequests()
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-xl font-bold text-white">Requests</h1>

    <!-- Client Requests panel -->
    <section class="bg-ink-800 rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
      <h2 class="text-base font-semibold text-white">Client Join Requests</h2>

      <p v-if="respondError" class="text-sm text-red-400">{{ respondError }}</p>

      <div v-if="pendingRequests === undefined" class="py-6 flex justify-center">
        <div class="w-5 h-5 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
      </div>

      <p v-else-if="pendingRequests?.length === 0" class="text-sm text-ink-400 text-center py-4">
        No pending requests from clients.
      </p>

      <ul v-else class="flex flex-col divide-y divide-white/5">
        <li
          v-for="r in pendingRequests"
          :key="r._id"
          class="flex items-center gap-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white truncate">{{ r.clientName }}</p>
            <p class="text-xs text-ink-400">{{ r.clientCity }} &middot; {{ r.clientGoal }}</p>
            <p v-if="r.message" class="text-xs text-ink-400/70 mt-0.5 truncate">{{ r.message }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              :disabled="respondingTo === r._id"
              class="text-xs px-3 py-1.5 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors disabled:opacity-40"
              @click="approve(r._id)"
            >
              {{ respondingTo === r._id ? '...' : 'Approve' }}
            </button>
            <button
              :disabled="respondingTo === r._id"
              class="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-ink-400 hover:bg-white/5 transition-colors disabled:opacity-40"
              @click="reject(r._id)"
            >
              Decline
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- Discover Free Clients panel -->
    <section class="bg-ink-800 rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
      <div>
        <h2 class="text-base font-semibold text-white">Discover Free Clients</h2>
        <p class="text-xs text-ink-400 mt-0.5">Unassigned clients with no gym or trainer yet</p>
      </div>

      <p v-if="pingError" class="text-sm text-red-400">{{ pingError }}</p>

      <div v-if="freeClients === undefined" class="py-6 flex justify-center">
        <div class="w-5 h-5 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
      </div>

      <p v-else-if="freeClients === null" class="text-sm text-ink-400 text-center py-4">
        An active subscription is required to discover free clients.
      </p>

      <p v-else-if="freeClients.length === 0" class="text-sm text-ink-400 text-center py-4">
        No free clients found in this area.
      </p>

      <ul v-else class="flex flex-col divide-y divide-white/5">
        <li
          v-for="client in freeClients"
          :key="client._id"
          class="flex items-center gap-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white truncate">{{ client.name }}</p>
            <p class="text-xs text-ink-400">{{ client.city }} &middot; Age {{ client.age }}</p>
            <p class="text-xs text-ink-400/70 truncate">{{ client.goal }}</p>
          </div>
          <button
            :disabled="pingingClient === client.userId"
            class="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors disabled:opacity-40"
            @click="ping(client.userId)"
          >
            {{ pingingClient === client.userId ? 'Sending...' : 'Invite' }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
