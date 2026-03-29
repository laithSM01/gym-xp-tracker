import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type UserRole = 'trainer' | 'client' | 'nutritionist'

export interface ConvexUser {
  _id: string
  role: UserRole
  name?: string
  email?: string
}

export const useAuthStore = defineStore('auth', () => {
  const isLoaded = ref(false)
  const isSignedIn = ref(false)
  // undefined = not yet fetched, null = fetched but no record
  const convexUser = ref<ConvexUser | null | undefined>(undefined)

  const isUserLoaded = ref(false)

  function setLoaded(loaded: boolean, signedIn: boolean) {
    isLoaded.value = loaded
    isSignedIn.value = signedIn
    // When signed out, there is no user to fetch
    if (loaded && !signedIn) {
      convexUser.value = null
      isUserLoaded.value = true
    }
  }

  function setConvexUser(user: ConvexUser | null) {
    convexUser.value = user
    isUserLoaded.value = true
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

  function waitForUser(): Promise<void> {
    return new Promise((resolve) => {
      if (isUserLoaded.value) {
        resolve()
        return
      }
      const stop = watch(isUserLoaded, (loaded) => {
        if (loaded) {
          stop()
          resolve()
        }
      })
    })
  }

  return {
    isLoaded,
    isSignedIn,
    convexUser,
    isUserLoaded,
    setLoaded,
    setConvexUser,
    waitForLoad,
    waitForUser,
  }
})
