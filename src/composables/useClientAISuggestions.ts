import { ref } from 'vue'

interface DaySchedule {
  day: number
  type: string
  exercises: { name: string; sets: number; reps: number; notes?: string }[]
}

export interface AISuggestion {
  title: string
  weeklySchedule: DaySchedule[]
}

interface ClientAIPayload {
  age: number
  goal: string
  height: number
  sportTypes: string[]
  injuryNotes: string
  trainerNotes: string
  currentXP: number
  currentTier: string
  measurements: object[]
  xpLogs: object[]
  currentExercises: string[]
  completedChallenges: string[]
  pastPrograms: { title: string; exercises: string[] }[]
}

export function useClientAISuggestions() {
  const suggestions = ref<AISuggestion | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSuggestions(payload: ClientAIPayload) {
    isLoading.value = true
    error.value = null
    suggestions.value = null

    try {
      const response = await fetch('http://localhost:8000/suggest/workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('AI service failed')
      }

      const data = await response.json()
      suggestions.value = data.suggestions as AISuggestion
    } catch (err) {
      error.value = 'Could not fetch suggestions. Make sure the AI service is running.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
  }
}
