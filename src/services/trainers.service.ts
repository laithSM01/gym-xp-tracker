import type { Ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'

export interface TrainerProfile {
  _id: Id<'personalTrainers'>
  userId: Id<'users'>
  bio?: string
  certifications: string[]
  specializations: string[]
  yearsOfExperience?: number
  instagramHandle?: string
  profilePhotoStorageId?: Id<'_storage'>
  coverPhotoStorageId?: Id<'_storage'>
  isActive: boolean
  clientsAdded: number
  createdAt: number
}

export interface CreateTrainerInput {
  bio?: string
  certifications: string[]
  specializations: string[]
  yearsOfExperience?: number
  instagramHandle?: string
  profilePhotoStorageId?: Id<'_storage'>
  coverPhotoStorageId?: Id<'_storage'>
}

export interface TrainerDashboardClient {
  _id: Id<'clients'>
  name: string
  goal: string
  city: string
  currentXP: number
  currentTier: 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'
  isEnrolled: boolean
}

export interface TrainerSubscriptionSummary {
  plan: 'personal_trainer' | 'gym_small' | 'gym_medium' | 'gym_large'
  status: 'active' | 'past_due' | 'canceled'
  currentPeriodEnd: number
}

export interface TrainerDashboardLimits {
  clients: number
}

export interface TrainerDashboardData {
  trainerProfile: TrainerProfile
  trainerName: string
  subscription: TrainerSubscriptionSummary | null
  clients: TrainerDashboardClient[]
  limits: TrainerDashboardLimits | null
}

export interface TrainerProgramsBoardEntry {
  clientId: Id<'clients'>
  clientName: string
  goal: string
  program: {
    _id: Id<'programs'>
    title: string
    startDate: number
    endDate: number
    sessionsPerWeek: number
  }
}

export interface TrainerService {
  getMyTrainerProfile(): Ref<TrainerProfile | null | undefined>
  getTrainerDashboard(): Ref<TrainerDashboardData | null | undefined>
  getProgramsBoard(): Ref<TrainerProgramsBoardEntry[] | null | undefined>
  createTrainerProfile(data: CreateTrainerInput): Promise<Id<'personalTrainers'>>
  generateUploadUrl(): Promise<string>
}
