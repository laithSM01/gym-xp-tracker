<script setup lang="ts">
import { inject, watch } from 'vue'
import { useAuth } from '@clerk/vue'
import type { ConvexClient } from 'convex/browser'
import { useAuthStore } from './stores/auth'

const { isLoaded, isSignedIn, getToken } = useAuth()
const convex = inject<ConvexClient>('convex')!
const authStore = useAuthStore()

watch(
  [isLoaded, isSignedIn],
  ([loaded, signedIn]) => {
    authStore.setLoaded(!!loaded, !!signedIn)

    if (loaded && signedIn) {
      convex.setAuth(
        async ({ forceRefreshToken }) => {
          return await getToken({ template: 'convex', skipCache: forceRefreshToken })
        },
        () => {
          authStore.setLoaded(true, false)
        },
      )
    } else if (loaded && !signedIn) {
      convex.client.clearAuth()
    }
  },
  { immediate: true },
)
</script>

<template>
  <RouterView />
</template>
