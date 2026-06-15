import { ref, onUnmounted } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { GymInvite, GymInvitesService } from '../gym-invites.service'

export class ConvexGymInvitesService implements GymInvitesService {
  private client: ConvexClient

  constructor(client: ConvexClient) {
    this.client = client
  }

  listGymInvites() {
    const invites = ref<GymInvite[] | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.gymInvitations.listGymInvites, {}, (data) => {
      invites.value = (data as GymInvite[] | null) ?? null
    })
    onUnmounted(() => unsub())
    return invites
  }

  async createInvite(invitedName: string, invitedEmail: string): Promise<Id<'gymInvitations'>> {
    return (await this.client.mutation(api.gymInvitations.createInvite, {
      invitedName,
      invitedEmail,
    })) as Id<'gymInvitations'>
  }

  async revokeInvite(inviteId: Id<'gymInvitations'>): Promise<void> {
    await this.client.mutation(api.gymInvitations.revokeInvite, { inviteId })
  }
}
