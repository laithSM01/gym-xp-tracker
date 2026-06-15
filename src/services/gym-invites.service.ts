import type { Ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'

export type InviteStatus = 'pending' | 'accepted' | 'expired'

export interface GymInvite {
  _id: Id<'gymInvitations'>
  gymId: Id<'gyms'>
  invitedEmail: string
  invitedName: string
  inviteToken: string
  status: InviteStatus
  createdAt: number
  expiresAt: number
  acceptedAt?: number
  acceptedByUserId?: Id<'users'>
}

export interface GymInvitesService {
  listGymInvites(): Ref<GymInvite[] | null | undefined>
  createInvite(invitedName: string, invitedEmail: string): Promise<Id<'gymInvitations'>>
  revokeInvite(inviteId: Id<'gymInvitations'>): Promise<void>
}
