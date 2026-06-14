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

export interface GymService {
  getMyGym(): Ref<GymProfile | null | undefined>
  createGym(data: CreateGymInput): Promise<Id<'gyms'>>
  generateUploadUrl(): Promise<string>
}
