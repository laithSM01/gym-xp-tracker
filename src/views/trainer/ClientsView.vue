<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { TrainerService } from '@/services/trainers.service'
import EmptyState from '@/components/ui/EmptyState.vue'
import ClientCard from '@/components/trainer/ClientCard.vue'

const trainersService = inject<TrainerService>('trainersService')!
const dashboard = trainersService.getTrainerDashboard()

const search = ref('')

const filteredClients = computed(() => {
  const list = dashboard.value?.clients ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((c) => c.name.toLowerCase().includes(q) || c.goal.toLowerCase().includes(q))
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Clients</h1>
        <p class="mt-1 text-slate-400">{{ dashboard?.clients.length ?? 0 }} total</p>
      </div>
      <div class="relative w-full sm:w-72">
        <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or goal…"
          class="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
    </div>

    <div v-if="dashboard === undefined" class="flex items-center justify-center py-24">
      <div class="w-8 h-8 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
    </div>

    <EmptyState
      v-else-if="filteredClients.length === 0"
      :message="search ? 'No clients match your search.' : 'No clients yet — clients will appear here once they\'re assigned to you.'"
    />

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <ClientCard v-for="client in filteredClients" :key="client._id" :client="client" />
    </div>
  </div>
</template>
