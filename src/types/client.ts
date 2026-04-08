export type Tier = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'

export type Profile = {
  _id: string
  userName: string
  userEmail?: string
  age: number
  goal: string
  currentXP: number
  currentTier: Tier
  isEnrolled: boolean
}

export type Measurement = {
  _id: string
  weight: number
  bodyFat: number
  muscleMass: number
  notes?: string
  timestamp: number
}

export type Challenge = {
  _id: string
  title: string
  description: string
  xpReward: number
  status: 'pending' | 'completed'
  completedAt?: number
}

export type Challenges = {
  active: Challenge[]
  completed: Challenge[]
}

export type Meal = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type NutritionPlan = {
  _id: string
  meals: Meal[]
  totalCalories: number
  notes?: string
}
