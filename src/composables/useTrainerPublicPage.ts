import { computed, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { TrainerService } from '@/services/trainers.service'
import type { JoinRequestsService } from '@/services/join-requests.service'
import type { Id } from '../../convex/_generated/dataModel'

export type TrainerCtaState = 'join' | 'pending' | 'approved' | 'rejected' | 'hidden' | 'unauthenticated'

export function useTrainerPublicPage(trainerProfileId: Id<'personalTrainers'>) {
  const trainersService = inject<TrainerService>('trainersService')!
  const joinRequestsService = inject<JoinRequestsService>('joinRequestsService')!
  const authStore = useAuthStore()

  const page = trainersService.getTrainerPublicPage(trainerProfileId)
  const myRequests = joinRequestsService.getMyRequests()

  const existingRequest = computed(
    () => myRequests.value?.find((r) => r.trainerProfileId === trainerProfileId) ?? null,
  )

  const ctaState = computed<TrainerCtaState>(() => {
    if (!authStore.isSignedIn) return 'unauthenticated'
    if (authStore.convexUser?.role !== 'client') return 'hidden'
    const req = existingRequest.value
    if (!req) return 'join'
    return req.status as TrainerCtaState
  })

  async function sendJoinRequest() {
    await joinRequestsService.sendRequest({ trainerProfileId })
  }

  return { page, ctaState, sendJoinRequest }
}
