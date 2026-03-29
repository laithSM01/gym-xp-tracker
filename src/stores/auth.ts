import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type UserRole = 'trainer' | 'client' | 'nutritionist'

export const useAuthStore = defineStore('auth', () => {
  const isLoaded = ref(false)
  const isSignedIn = ref(false)
  const role = ref<UserRole | null>(null)

  function setLoaded(loaded: boolean, signedIn: boolean) {
    isLoaded.value = loaded
    isSignedIn.value = signedIn
  }

  function setRole(r: UserRole | null) {
    role.value = r
  }

  function waitForLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (isLoaded.value) {
        resolve()
        return
      }
      const stop = watch(isLoaded, (loaded) => {
        if (loaded) {
          stop()
          resolve()
        }
      })
    })
  }

  return { isLoaded, isSignedIn, role, setLoaded, setRole, waitForLoad }
})
