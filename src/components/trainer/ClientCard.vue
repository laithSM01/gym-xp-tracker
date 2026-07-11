<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { tierConfig, tierMax, xpProgress } from '@/utils/xp'
import type { TrainerDashboardClient } from '@/services/trainers.service'
import BaseCard from '@/components/ui/BaseCard.vue'
import Badge from '@/components/ui/Badge.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'

defineProps<{ client: TrainerDashboardClient }>()
</script>

<template>
  <RouterLink :to="`/trainer/client/${client._id}`" class="block h-full">
    <BaseCard padding="p-5" class="h-full hover:shadow-md transition-shadow duration-150">
      <!-- Name + tier badge -->
      <div class="flex items-start justify-between gap-2 mb-1">
        <span class="font-semibold text-slate-800 truncate">{{ client.name }}</span>
        <Badge :badge-class="tierConfig[client.currentTier].badge">
          {{ tierConfig[client.currentTier].label }}
        </Badge>
      </div>

      <!-- City -->
      <p class="text-xs text-slate-400 mb-2">{{ client.city }}</p>

      <!-- Goal -->
      <p class="text-sm text-slate-500 mb-4 line-clamp-2">{{ client.goal }}</p>

      <!-- XP bar -->
      <div>
        <div class="flex justify-between text-xs text-slate-400 mb-1">
          <span>{{ client.currentXP.toLocaleString() }} XP</span>
          <span v-if="client.currentTier !== 'elite'">
            {{ tierMax[client.currentTier].toLocaleString() }}
          </span>
          <span v-else class="text-green-500 font-semibold">MAX</span>
        </div>
        <ProgressBar
          :percent="xpProgress(client.currentXP, client.currentTier)"
          :bar-class="tierConfig[client.currentTier].bar"
        />
      </div>
    </BaseCard>
  </RouterLink>
</template>
