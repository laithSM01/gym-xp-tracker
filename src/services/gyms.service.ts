import type { Ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'

export interface GymProfile {
  _id: Id<'gyms'>
  ownerId: Id<'users'>
  name: string
  bio?: string
  location: string
  city: string
  facilities: string[]
  priceRange: { min: number; max: number }
  logoStorageId?: Id<'_storage'>
  coverPhotoStorageId?: Id<'_storage'>
  isActive: boolean
  trainersUsed: number
  clientsAdded: number
  productsListed: number
  createdAt: number
}

export interface CreateGymInput {
  name: string
  bio?: string
  location: string
  city: string
  facilities: string[]
  priceRange: { min: number; max: number }
  logoStorageId?: Id<'_storage'>
  coverPhotoStorageId?: Id<'_storage'>
}

export interface GymDashboardTrainer {
  userId: Id<'users'>
  name: string
  affiliationRole: 'trainer' | 'head_trainer'
  clientCount: number
  clientCountCapped: boolean
}

export interface GymDashboardClient {
  clientId: Id<'clients'>
  name: string
  goal: string
  city: string
  trainerId: Id<'users'> | null
  trainerName: string | null
}

export interface GymDashboardLimits {
  trainers: number
  clients: number
  products: number
}

export interface GymSubscriptionSummary {
  plan: 'personal_trainer' | 'gym_small' | 'gym_medium' | 'gym_large'
  status: 'active' | 'past_due' | 'canceled'
  currentPeriodEnd: number
}

export interface GymDashboardData {
  gym: GymProfile
  subscription: GymSubscriptionSummary | null
  trainers: GymDashboardTrainer[]
  clients: GymDashboardClient[]
  limits: GymDashboardLimits | null
}

export interface GymService {
  getMyGym(): Ref<GymProfile | null | undefined>
  getGymDashboard(): Ref<GymDashboardData | null | undefined>
  listPublic(): Ref<GymProfile[]>
  createGym(data: CreateGymInput): Promise<Id<'gyms'>>
  generateUploadUrl(): Promise<string>
}
