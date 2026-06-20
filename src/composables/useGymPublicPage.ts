import { computed, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { GymService } from '@/services/gyms.service'
import type { JoinRequestsService } from '@/services/join-requests.service'
import type { Id } from '../../convex/_generated/dataModel'

export type GymCtaState = 'join' | 'pending' | 'approved' | 'rejected' | 'hidden' | 'unauthenticated'

export function useGymPublicPage(gymId: Id<'gyms'>) {
  const gymsService = inject<GymService>('gymsService')!
  const joinRequestsService = inject<JoinRequestsService>('joinRequestsService')!
  const authStore = useAuthStore()

  const page = gymsService.getGymPublicPage(gymId)
  const myRequests = joinRequestsService.getMyRequests()

  const existingRequest = computed(
    () => myRequests.value?.find((r) => r.gymId === gymId) ?? null,
  )

  const ctaState = computed<GymCtaState>(() => {
    if (!authStore.isSignedIn) return 'unauthenticated'
    if (authStore.convexUser?.role !== 'client') return 'hidden'
    const req = existingRequest.value
    if (!req) return 'join'
    return req.status as GymCtaState
  })

  async function sendJoinRequest() {
    await joinRequestsService.sendRequest({ gymId })
  }

  return { page, ctaState, sendJoinRequest }
}
