<script setup lang="ts">
import { watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { GymService } from '@/services/gyms.service'

const gymsService = inject<GymService>('gymsService')!
const router = useRouter()
const gym = gymsService.getMyGym()

// Redirect to setup if no gym profile exists yet
watch(gym, (val) => {
  if (val === null) router.replace('/gym/setup')
}, { immediate: true })
</script>

<template>
  <div v-if="gym" class="flex flex-col gap-6">
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
        🏋️
      </div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">{{ gym.name }}</h1>
        <p class="text-sm text-gray-500">{{ gym.city }} · {{ gym.location }}</p>
      </div>
    </div>
    <p class="text-gray-500 text-sm">Gym management features coming in the next phase.</p>
  </div>

  <div v-else-if="gym === undefined" class="text-center py-16 text-gray-400 text-sm">
    Loading...
  </div>
</template>
