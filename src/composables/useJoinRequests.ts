import { computed, inject, ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'
import type { JoinRequestsService } from '@/services/join-requests.service'

export function useJoinRequests() {
  const service = inject<JoinRequestsService>('joinRequestsService')!

  const myRequests = service.getMyRequests()

  const outbound = computed(
    () => myRequests.value?.filter((r) => r.initiatedBy === 'client') ?? [],
  )
  const inbound = computed(
    () => myRequests.value?.filter((r) => r.initiatedBy !== 'client') ?? [],
  )

  const sendingTo = ref<string | null>(null)
  const sendError = ref<string | null>(null)

  async function sendToGym(gymId: Id<'gyms'>, message?: string) {
    sendingTo.value = gymId
    sendError.value = null
    try {
      await service.sendRequest({ gymId }, message)
    } catch (err) {
      sendError.value = err instanceof Error ? err.message : 'Failed to send request'
    } finally {
      sendingTo.value = null
    }
  }

  async function sendToTrainer(trainerProfileId: Id<'personalTrainers'>, message?: string) {
    sendingTo.value = trainerProfileId
    sendError.value = null
    try {
      await service.sendRequest({ trainerProfileId }, message)
    } catch (err) {
      sendError.value = err instanceof Error ? err.message : 'Failed to send request'
    } finally {
      sendingTo.value = null
    }
  }

  const respondingTo = ref<string | null>(null)
  const respondError = ref<string | null>(null)

  async function approveInbound(requestId: Id<'joinRequests'>) {
    respondingTo.value = requestId
    respondError.value = null
    try {
      await service.respondToRequest(requestId, true)
    } catch (err) {
      respondError.value = err instanceof Error ? err.message : 'Failed to respond'
    } finally {
      respondingTo.value = null
    }
  }

  async function rejectInbound(requestId: Id<'joinRequests'>) {
    respondingTo.value = requestId
    respondError.value = null
    try {
      await service.respondToRequest(requestId, false)
    } catch (err) {
      respondError.value = err instanceof Error ? err.message : 'Failed to respond'
    } finally {
      respondingTo.value = null
    }
  }

  function gymRequestStatus(gymId: Id<'gyms'>) {
    return outbound.value.find((r) => r.gymId === gymId)?.status ?? null
  }

  function trainerRequestStatus(trainerProfileId: Id<'personalTrainers'>) {
    return outbound.value.find((r) => r.trainerProfileId === trainerProfileId)?.status ?? null
  }

  return {
    myRequests,
    outbound,
    inbound,
    sendingTo,
    sendError,
    respondingTo,
    respondError,
    sendToGym,
    sendToTrainer,
    approveInbound,
    rejectInbound,
    gymRequestStatus,
    trainerRequestStatus,
  }
}
