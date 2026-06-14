import type { Ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'

export interface ClientProfile {
  _id: Id<'clients'>
  userId: Id<'users'>
  age: number
  gender: 'male' | 'female'
  goal: string
  height: number
  city: string
  currentXP: number
  currentTier: 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'
  isEnrolled: boolean
  userName: string
  userEmail?: string
}

export type SportType = 'gym' | 'swimming' | 'boxing' | 'football' | 'running' | 'crossfit'
export type TrainingExperience = 'beginner' | 'some_experience' | 'intermediate' | 'advanced'
export type PreferredTrainingDays = '2-3' | '3-4' | '4-5' | '5-6'

export interface CreateClientProfileInput {
  age: number
  gender: 'male' | 'female'
  goal: string
  height: number
  weight: number
  city: string
  sportTypes: SportType[]
  trainingExperience: TrainingExperience
  preferredTrainingDays: PreferredTrainingDays
  healthConditions: string[]
  injuryNotes?: string
}

export interface ClientService {
  getMyProfile(): Ref<ClientProfile | null | undefined>
  createMyProfile(data: CreateClientProfileInput): Promise<Id<'clients'>>
}
