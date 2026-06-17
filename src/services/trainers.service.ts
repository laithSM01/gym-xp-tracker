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
  productsListed: number
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

export interface TrainerPublicProfile extends TrainerProfile {
  name: string
}

export interface TrainerService {
  getMyTrainerProfile(): Ref<TrainerProfile | null | undefined>
  listPublic(): Ref<TrainerPublicProfile[]>
  createTrainerProfile(data: CreateTrainerInput): Promise<Id<'personalTrainers'>>
  generateUploadUrl(): Promise<string>
}
