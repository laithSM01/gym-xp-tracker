import type { Ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'

export type GymTrainerTier = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'

export interface GymTrainerClient {
  clientId: Id<'clients'>
  userId: Id<'users'>
  name: string
  goal: string
  city: string
  currentXP: number
  currentTier: GymTrainerTier
  trainerId: Id<'users'> | null
}

export interface GymTrainerDashboardData {
  gym: { name: string; city: string }
  myClients: GymTrainerClient[]
  availableClients: GymTrainerClient[]
}

export interface GymTrainerService {
  getMyDashboard(): Ref<GymTrainerDashboardData | null | undefined>
  claimClient(clientId: Id<'clients'>): Promise<void>
  unassignClient(clientId: Id<'clients'>): Promise<void>
}
