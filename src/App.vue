<script setup lang="ts">
import { inject, watch } from 'vue'
import { useAuth } from '@clerk/vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import { useAuthStore } from './stores/auth'
import type { ConvexUser } from './stores/auth'

const { isLoaded, isSignedIn, getToken } = useAuth()
const convex = inject<ConvexClient>('convex')!
const authStore = useAuthStore()

let unsubscribeUser: (() => void) | null = null
// Debounce sign-out so a brief false from Clerk (e.g. during Google OAuth
// session establishment) doesn't clear auth state and break navigation.
let signOutTimer: ReturnType<typeof setTimeout> | null = null

function handleSignedIn() {
  if (signOutTimer) {
    clearTimeout(signOutTimer)
    signOutTimer = null
  }

  authStore.setLoaded(true, true)

  convex.setAuth(
    async ({ forceRefreshToken }) => {
      return await getToken.value({ template: 'convex', skipCache: forceRefreshToken })
    },
    () => {
      authStore.setLoaded(true, false)
    },
  )

  unsubscribeUser?.()
  const { unsubscribe } = convex.onUpdate(
    api.users.getCurrentUser,
    {},
    (user) => {
      authStore.setConvexUser(user as ConvexUser | null)
    },
  )
  unsubscribeUser = unsubscribe
}

function handleSignedOut() {
  unsubscribeUser?.()
  unsubscribeUser = null
  authStore.setLoaded(true, false)
  convex.client.clearAuth()
}

watch(
  [isLoaded, isSignedIn],
  ([loaded, signedIn]) => {
    // Ignore states before Clerk has finished loading or during mid-refresh
    // (signedIn === undefined). !!undefined === false would incorrectly clear auth.
    if (!loaded || signedIn === undefined) return

    if (signedIn) {
      handleSignedIn()
    } else {
      // Debounce: only treat as signed out after 600 ms of sustained false.
      // This absorbs the brief false Clerk emits during Google/OAuth flows
      // before the session token is confirmed.
      if (!signOutTimer) {
        signOutTimer = setTimeout(handleSignedOut, 600)
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <RouterView />
</template>
