import { ref, computed, onUnmounted, inject } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/stores/auth'
import type { AccessibleClient } from '@/types/client'

export function useNutritionistDashboard() {
  const convex = inject<ConvexClient>('convex')!
  const authStore = useAuthStore()

  const clients = ref<AccessibleClient[] | null>(null)

  const { unsubscribe } = convex.onUpdate(
    api.clients.getAccessibleClients,
    {},
    (data) => { clients.value = data as AccessibleClient[] | null },
  )

  onUnmounted(() => unsubscribe())

  const nutritionistName = computed(() => authStore.convexUser?.name ?? 'Nutritionist')

  return {
    data: {
      clients,
      nutritionistName,
    },
    loading: computed(() => clients.value === null),
    error: null,
    actions: {},
  }
}
