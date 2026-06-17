import { inject, ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'
import type { JoinRequestsService } from '@/services/join-requests.service'

export function useIncomingRequests(city?: string) {
  const service = inject<JoinRequestsService>('joinRequestsService')!

  const pendingRequests = service.getMyPendingRequests()
  const freeClients = service.listFreeClients(city)

  const respondingTo = ref<string | null>(null)
  const respondError = ref<string | null>(null)

  async function approve(requestId: Id<'joinRequests'>) {
    respondingTo.value = requestId
    respondError.value = null
    try {
      await service.respondToRequest(requestId, true)
    } catch (err) {
      respondError.value = err instanceof Error ? err.message : 'Failed to approve'
    } finally {
      respondingTo.value = null
    }
  }

  async function reject(requestId: Id<'joinRequests'>) {
    respondingTo.value = requestId
    respondError.value = null
    try {
      await service.respondToRequest(requestId, false)
    } catch (err) {
      respondError.value = err instanceof Error ? err.message : 'Failed to reject'
    } finally {
      respondingTo.value = null
    }
  }

  const pingingClient = ref<string | null>(null)
  const pingError = ref<string | null>(null)

  async function ping(clientUserId: Id<'users'>, message?: string) {
    pingingClient.value = clientUserId
    pingError.value = null
    try {
      await service.pingFreeClient(clientUserId, message)
    } catch (err) {
      pingError.value = err instanceof Error ? err.message : 'Failed to send invite'
    } finally {
      pingingClient.value = null
    }
  }

  return {
    pendingRequests,
    freeClients,
    respondingTo,
    respondError,
    pingingClient,
    pingError,
    approve,
    reject,
    ping,
  }
}
