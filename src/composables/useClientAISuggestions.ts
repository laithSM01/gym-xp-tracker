import { ref } from 'vue'

interface Suggestion {
  raw: string
}

interface ClientAIPayload {
  age: number
  goal: string
  currentXP: number
  currentTier: string
  measurements: object[]
  xpLogs: object[]
  currentExercises: string[]
  completedChallenges: number
}

export function useClientAISuggestions() {
  const suggestions = ref<string>('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSuggestions(payload: ClientAIPayload) {
    isLoading.value = true
    error.value = null
    suggestions.value = ''

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
      suggestions.value = data.suggestions
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
