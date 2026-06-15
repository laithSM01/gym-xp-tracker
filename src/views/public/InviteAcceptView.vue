<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const convex = inject<ConvexClient>('convex')!
const authStore = useAuthStore()

const token = computed(() => route.query.token as string | undefined)

interface InviteDetails {
  status: string
  expiresAt: number
  isExpired: boolean
  invitedName: string
  invitedEmail: string
  gymName: string
  gymCity?: string
}

const inviteDetails = ref<InviteDetails | null | undefined>(undefined)
const isAccepting = ref(false)
const acceptError = ref('')
const accepted = ref(false)

onMounted(() => {
  if (!token.value) {
    inviteDetails.value = null
    return
  }
  // Subscribe to invite details
  convex.onUpdate(
    api.gymInvitations.getInviteDetails,
    { inviteToken: token.value },
    (val) => {
      inviteDetails.value = val as InviteDetails | null
    },
  )
})

async function acceptInvite() {
  if (!token.value || isAccepting.value) return
  isAccepting.value = true
  acceptError.value = ''

  try {
    await convex.mutation(api.gymInvitations.acceptInvite, { inviteToken: token.value })
    // Set role immediately so the router guard doesn't redirect to /onboarding
    // before the Convex real-time subscription catches up
    authStore.setConvexUser({ _id: '', role: 'gym_trainer' })
    accepted.value = true
    setTimeout(() => router.replace('/gym-trainer/dashboard'), 1500)
  } catch (e: unknown) {
    acceptError.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    isAccepting.value = false
  }
}

function goToSignIn() {
  const callbackUrl = encodeURIComponent(route.fullPath)
  router.push(`/sign-in?redirect_url=${callbackUrl}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <span class="text-2xl font-black tracking-tight text-gray-900">Gym<span class="text-purple-600">XP</span></span>
      </div>

      <!-- Loading -->
      <div v-if="inviteDetails === undefined"
        class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div class="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
        <p class="text-gray-500 text-sm">Loading invite details...</p>
      </div>

      <!-- Invalid / not found -->
      <div v-else-if="!inviteDetails || !token"
        class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div class="text-4xl mb-4">🔗</div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">Invalid invite link</h1>
        <p class="text-gray-500 text-sm">This invite link is not valid or has already been used.</p>
      </div>

      <!-- Expired -->
      <div v-else-if="inviteDetails.isExpired || inviteDetails.status === 'expired'"
        class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div class="text-4xl mb-4">⏰</div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">Invite expired</h1>
        <p class="text-gray-500 text-sm">This invite link expired. Ask your gym owner to send a new one.</p>
      </div>

      <!-- Already accepted -->
      <div v-else-if="inviteDetails.status === 'accepted'"
        class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div class="text-4xl mb-4">✅</div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">Already accepted</h1>
        <p class="text-gray-500 text-sm">This invite has already been accepted.</p>
      </div>

      <!-- Success state -->
      <div v-else-if="accepted" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div class="text-4xl mb-4">🎉</div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">Welcome to {{ inviteDetails.gymName }}!</h1>
        <p class="text-gray-500 text-sm">Redirecting to your dashboard...</p>
      </div>

      <!-- Valid invite -->
      <div v-else class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl mx-auto mb-4">
            🏢
          </div>
          <h1 class="text-xl font-bold text-gray-900">You're invited!</h1>
          <p class="text-gray-500 text-sm mt-1">
            <strong>{{ inviteDetails.gymName }}</strong>
            <template v-if="inviteDetails.gymCity"> · {{ inviteDetails.gymCity }}</template>
            has invited you to join as a gym trainer.
          </p>
        </div>

        <div class="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
          <p><span class="font-medium">Invited as:</span> {{ inviteDetails.invitedName }}</p>
          <p class="mt-1"><span class="font-medium">Email:</span> {{ inviteDetails.invitedEmail }}</p>
          <p class="mt-1 text-xs text-gray-400">
            Expires {{ new Date(inviteDetails.expiresAt).toLocaleDateString() }}
          </p>
        </div>

        <!-- Not signed in -->
        <template v-if="!authStore.isSignedIn">
          <p class="text-sm text-gray-500 text-center mb-4">Sign in or create an account to accept this invitation.</p>
          <button
            class="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            @click="goToSignIn">
            Sign in to accept
          </button>
        </template>

        <!-- Signed in -->
        <template v-else>
          <div v-if="acceptError"
            class="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
            <span class="text-red-500 text-base leading-none mt-0.5">✕</span>
            <p class="text-sm text-red-700">Gym owners cannot accept their own trainer invites</p>
          </div>
          <button :disabled="isAccepting"
            class="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="acceptInvite">
            {{ isAccepting ? 'Accepting...' : 'Accept invitation' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
