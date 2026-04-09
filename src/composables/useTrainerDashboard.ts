import { ref, computed, onUnmounted, inject } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/stores/auth'
import type { TrainerClient } from '@/types/client'

export function useTrainerDashboard() {
  const convex = inject<ConvexClient>('convex')!
  const authStore = useAuthStore()

  const clients = ref<TrainerClient[] | null>(null)

  const { unsubscribe } = convex.onUpdate(
    api.clients.getMyClients,
    {},
    (data) => { clients.value = data as TrainerClient[] | null },
  )

  onUnmounted(() => unsubscribe())

  const trainerName = computed(() => authStore.convexUser?.name ?? 'Trainer')
  const enrolledCount = computed(() => clients.value?.filter((c) => c.isEnrolled).length ?? 0)

  return {
    data: {
      clients,
      trainerName,
      enrolledCount,
    },
    loading: computed(() => clients.value === null),
    error: null,
    actions: {},
  }
}
