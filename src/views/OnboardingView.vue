<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const convex = inject<ConvexClient>('convex')!
const authStore = useAuthStore()

const isSubmitting = ref(false)

type SelectableRole = 'gym_owner' | 'trainer' | 'client'

type ColorKey = 'blue' | 'purple' | 'teal'

const roles: { value: SelectableRole; label: string; description: string; color: ColorKey; icon: string }[] = [
  {
    value: 'gym_owner',
    label: 'Gym Owner',
    description: 'I manage a gym and its staff',
    color: 'blue',
    icon: '🏢',
  },
  {
    value: 'trainer',
    label: 'Personal Trainer',
    description: 'I train clients independently',
    color: 'purple',
    icon: '🏋️',
  },
  {
    value: 'client',
    label: 'Client',
    description: 'I am here to train and improve',
    color: 'teal',
    icon: '💪',
  },
]

const colorMap: Record<ColorKey, { border: string; bg: string; icon: string; button: string }> = {
  blue: {
    border: 'border-blue-200 hover:border-blue-400',
    bg: 'bg-blue-50 hover:bg-blue-100',
    icon: 'bg-blue-100 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  purple: {
    border: 'border-purple-200 hover:border-purple-400',
    bg: 'bg-purple-50 hover:bg-purple-100',
    icon: 'bg-purple-100 text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
  teal: {
    border: 'border-teal-200 hover:border-teal-400',
    bg: 'bg-teal-50 hover:bg-teal-100',
    icon: 'bg-teal-100 text-teal-600',
    button: 'bg-teal-600 hover:bg-teal-700',
  },
}

const destinations: Record<SelectableRole, string> = {
  gym_owner: '/gym/dashboard',
  trainer: '/trainer/dashboard',
  client: '/client/setup',
}

async function selectRole(role: SelectableRole) {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    await convex.mutation(api.users.upsertUser, { role })
    authStore.setConvexUser({ _id: '', role })
    router.push(destinations[role])
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-3xl">
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-gray-900">Welcome to Gym<span class="text-purple-600">XP</span></h1>
        <p class="mt-2 text-gray-500">Choose your role to get started</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button
          v-for="role in roles"
          :key="role.value"
          :disabled="isSubmitting"
          class="flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :class="[colorMap[role.color].border, colorMap[role.color].bg]"
          @click="selectRole(role.value)"
        >
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
            :class="colorMap[role.color].icon"
          >
            {{ role.icon }}
          </div>
          <h2 class="text-lg font-semibold text-gray-900">{{ role.label }}</h2>
          <p class="mt-1 text-sm text-gray-500">{{ role.description }}</p>
        </button>
      </div>

      <p class="text-center text-xs text-gray-400 mt-8">
        Gym trainers join via an invitation link from their gym owner.
      </p>
    </div>
  </div>
</template>
