import { ref, onUnmounted } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type {
  JoinRequest,
  EnrichedJoinRequest,
  FreeClientSummary,
  JoinRequestsService,
} from '../join-requests.service'

export class ConvexJoinRequestsService implements JoinRequestsService {
  private client: ConvexClient

  constructor(client: ConvexClient) {
    this.client = client
  }

  getMyRequests() {
    const requests = ref<JoinRequest[] | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.joinRequests.getMyRequests, {}, (data) => {
      requests.value = (data as JoinRequest[] | null) ?? null
    })
    onUnmounted(() => unsub())
    return requests
  }

  getMyPendingRequests() {
    const requests = ref<EnrichedJoinRequest[] | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.joinRequests.getMyPendingRequests, {}, (data) => {
      requests.value = (data as EnrichedJoinRequest[] | null) ?? null
    })
    onUnmounted(() => unsub())
    return requests
  }

  listFreeClients(city?: string) {
    const clients = ref<FreeClientSummary[] | null | undefined>(undefined)
    const unsub = this.client.onUpdate(
      api.joinRequests.listFreeClients,
      { city },
      (data) => {
        clients.value = (data as FreeClientSummary[] | null) ?? null
      },
    )
    onUnmounted(() => unsub())
    return clients
  }

  async sendRequest(
    target: { gymId?: Id<'gyms'>; trainerProfileId?: Id<'personalTrainers'> },
    message?: string,
  ): Promise<void> {
    await this.client.mutation(api.joinRequests.sendRequest, {
      gymId: target.gymId,
      trainerProfileId: target.trainerProfileId,
      message,
    })
  }

  async pingFreeClient(clientUserId: Id<'users'>, message?: string): Promise<void> {
    await this.client.mutation(api.joinRequests.pingFreeClient, { clientUserId, message })
  }

  async respondToRequest(requestId: Id<'joinRequests'>, accept: boolean): Promise<void> {
    await this.client.mutation(api.joinRequests.respondToRequest, { requestId, accept })
  }
}
