<script setup lang="ts">
import { inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { GymService } from '@/services/gyms.service'

const gymsService = inject<GymService>('gymsService')!
const router = useRouter()
const dashboard = gymsService.getGymDashboard()

watch(
  dashboard,
  (val) => {
    if (val === null) router.replace('/gym/setup')
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="dashboard" class="flex flex-col gap-6">
    <h1 class="text-xl font-bold text-white">Clients</h1>

    <section class="bg-ink-800 rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
      <p v-if="dashboard.clients.length === 0" class="text-sm text-ink-400 text-center py-4">
        No clients yet.
      </p>

      <ul v-else class="flex flex-col divide-y divide-white/5">
        <li
          v-for="client in dashboard.clients"
          :key="client.clientId"
          class="flex items-center gap-4 py-3"
        >
          <div
            class="w-8 h-8 rounded-full bg-accent-500/15 flex items-center justify-center text-sm font-semibold text-accent-500 flex-shrink-0"
          >
            {{ client.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ client.name }}</p>
            <p class="text-xs text-ink-400 truncate">{{ client.city }} &middot; {{ client.goal }}</p>
          </div>
          <span
            class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            :class="
              client.trainerName
                ? 'bg-cyan-400/15 text-cyan-400'
                : 'bg-white/5 text-ink-400'
            "
          >
            {{ client.trainerName ?? 'Unassigned' }}
          </span>
        </li>
      </ul>
    </section>
  </div>

  <div v-else-if="dashboard === undefined" class="text-center py-16 text-ink-400 text-sm">
    Loading...
  </div>
</template>
