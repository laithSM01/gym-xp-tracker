import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { ClientService, ClientProfile, CreateClientProfileInput } from '../clients.service'
import type { Id } from '../../../convex/_generated/dataModel'

export class ConvexClientsService implements ClientService {
  private client: ConvexClient

  constructor(client: ConvexClient) {
    this.client = client
  }

  getMyProfile(): Ref<ClientProfile | null | undefined> {
    const profile = ref<ClientProfile | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.clients.getMyProfile, {}, (val) => {
      profile.value = val as ClientProfile | null
    })
    onUnmounted(unsub)
    return profile
  }

  async createMyProfile(data: CreateClientProfileInput): Promise<Id<'clients'>> {
    return await this.client.mutation(api.clients.createMyProfile, data)
  }
}
