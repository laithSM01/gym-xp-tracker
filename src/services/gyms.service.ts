import type { Ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'

export type PricingPlanDuration = '1_month' | '3_months' | '6_months' | '8_months' | '12_months'

export interface PricingPlan {
  duration: PricingPlanDuration
  priceJod: number
  label?: string
  isOffer: boolean
  offerExpiresAt?: number
}

export interface ProductSummary {
  _id: Id<'products'>
  name: string
  description: string
  priceJod: number
  category: 'supplement' | 'equipment' | 'food' | 'digital_program' | 'session'
  imageUrl: string | null
}

export interface GymProfile {
  _id: Id<'gyms'>
  ownerId: Id<'users'>
  name: string
  bio?: string
  location: string
  city: string
  genderType?: GenderType
  openingHours?: OpeningHours
  genderSections?: GenderSection[]
  classSchedules?: ClassSchedule[]
  facilities: string[]
  pricingPlans: PricingPlan[]
  logoStorageId?: Id<'_storage'>
  coverPhotoStorageId?: Id<'_storage'>
  logoUrl?: string | null
  coverPhotoUrl?: string | null
  isActive: boolean
  trainersUsed: number
  clientsAdded: number
  productsListed: number
  createdAt: number
}

export type GenderType = 'male' | 'female' | 'mixed'

export interface OpeningHours {
  weekdays: string
  weekends: string
  friday?: string
}

export interface GenderSection {
  gender: GenderType
  label?: string
  weekdays?: string
  weekends?: string
  friday?: string
}

export interface ClassSchedule {
  activity: string
  schedule: string
  instructor?: string
}

export interface CreateGymInput {
  name: string
  bio?: string
  location: string
  city: string
  genderType?: GenderType
  openingHours?: OpeningHours
  genderSections?: GenderSection[]
  classSchedules?: ClassSchedule[]
  facilities: string[]
  pricingPlans: PricingPlan[]
  logoStorageId?: Id<'_storage'>
  coverPhotoStorageId?: Id<'_storage'>
}

export interface UpdateGymInput {
  name?: string
  bio?: string
  location?: string
  city?: string
  genderType?: GenderType
  openingHours?: OpeningHours
  genderSections?: GenderSection[]
  classSchedules?: ClassSchedule[]
  facilities?: string[]
  pricingPlans?: PricingPlan[]
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

export interface GymPublicTrainer {
  userId: Id<'users'>
  name: string
  email: string | null
  affiliationRole: 'trainer' | 'head_trainer'
}

export interface GymPublicInfo {
  _id: Id<'gyms'>
  name: string
  bio?: string
  location: string
  city: string
  genderType?: GenderType
  openingHours?: OpeningHours
  genderSections?: GenderSection[]
  classSchedules?: ClassSchedule[]
  facilities: string[]
  pricingPlans: PricingPlan[]
  logoUrl: string | null
  coverPhotoUrl: string | null
  isActive: boolean
  createdAt: number
}

export interface GymPublicPageData {
  gym: GymPublicInfo
  trainers: GymPublicTrainer[]
  products: ProductSummary[]
}

export interface GymService {
  getMyGym(): Ref<GymProfile | null | undefined>
  getGymDashboard(): Ref<GymDashboardData | null | undefined>
  listPublic(): Ref<GymProfile[]>
  getGymPublicPage(gymId: Id<'gyms'>): Ref<GymPublicPageData | null | undefined>
  createGym(data: CreateGymInput): Promise<Id<'gyms'>>
  updateGym(data: UpdateGymInput): Promise<void>
  generateUploadUrl(): Promise<string>
}
