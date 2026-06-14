import { ref, onUnmounted, inject } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'

type GymDoc = Doc<'gyms'>
type TrainerPublic = Doc<'personalTrainers'> & { name: string }

export function useLandingPage() {
  const convex = inject<ConvexClient>('convex')!

  const gyms = ref<GymDoc[]>([])
  const trainers = ref<TrainerPublic[]>([])

  const unsubGyms = convex.onUpdate(api.gyms.listPublic, {}, (data) => {
    gyms.value = data ?? []
  })

  const unsubTrainers = convex.onUpdate(api.personalTrainers.listPublic, {}, (data) => {
    trainers.value = (data ?? []) as TrainerPublic[]
  })

  onUnmounted(() => {
    unsubGyms()
    unsubTrainers()
  })

  return { gyms, trainers }
}
