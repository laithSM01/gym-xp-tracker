import type { Ref } from 'vue'

export interface StarterProgramExercise {
  name: string
  sets: number
  reps: string
}

export interface StarterProgramDay {
  day: string
  type: string
  exercises: StarterProgramExercise[]
}

export interface StarterProgram {
  title: string
  description: string
  weeklySchedule: StarterProgramDay[]
}

export interface StarterProgramsService {
  getStarterProgram(): Ref<StarterProgram | null | undefined>
}
