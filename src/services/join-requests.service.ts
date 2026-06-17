import type { Ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'
export type JoinRequestInitiator = 'client' | 'gym' | 'personal_trainer'

export interface JoinRequest {
  _id: Id<'joinRequests'>
  clientUserId: Id<'users'>
  gymId?: Id<'gyms'>
  trainerProfileId?: Id<'personalTrainers'>
  initiatedBy: JoinRequestInitiator
  status: JoinRequestStatus
  message?: string
  createdAt: number
  resolvedAt?: number
}

export interface EnrichedJoinRequest extends JoinRequest {
  clientName: string
  clientCity: string
  clientGoal: string
  clientAge?: number
}

export interface FreeClientSummary {
  _id: Id<'clients'>
  userId: Id<'users'>
  name: string
  city: string
  goal: string
  age: number
  sportTypes: string[]
}

export interface JoinRequestsService {
  getMyRequests(): Ref<JoinRequest[] | null | undefined>
  getMyPendingRequests(): Ref<EnrichedJoinRequest[] | null | undefined>
  listFreeClients(city?: string): Ref<FreeClientSummary[] | null | undefined>
  sendRequest(
    target: { gymId?: Id<'gyms'>; trainerProfileId?: Id<'personalTrainers'> },
    message?: string,
  ): Promise<void>
  pingFreeClient(clientUserId: Id<'users'>, message?: string): Promise<void>
  respondToRequest(requestId: Id<'joinRequests'>, accept: boolean): Promise<void>
}
