<script setup lang="ts">
import { computed } from 'vue'
import { UserButton } from '@clerk/vue'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/stores/auth'

const authStore = useAuthStore()

const user = computed(() => authStore.convexUser)

const roleLabel: Record<UserRole, string> = {
  trainer: 'Trainer',
  client: 'Client',
  nutritionist: 'Nutritionist',
}

const roleBadgeClass: Record<UserRole, string> = {
  trainer: 'bg-purple-100 text-purple-700 ring-purple-200',
  client: 'bg-teal-100 text-teal-700 ring-teal-200',
  nutritionist: 'bg-amber-100 text-amber-700 ring-amber-200',
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <header class="h-16 bg-white border-b border-gray-200 px-6 flex items-center">
      <!-- Left: logo -->
      <div class="flex items-center gap-2 w-48">
        <span class="text-xl font-black tracking-tight text-gray-900">Gym<span class="text-purple-600">XP</span></span>
      </div>

      <!-- Center: user name + role badge -->
      <div class="flex-1 flex items-center justify-center gap-3">
        <template v-if="user">
          <span class="text-sm font-medium text-gray-700">{{ user.name ?? user.email ?? 'User' }}</span>
          <span
            class="text-xs font-semibold px-2.5 py-0.5 rounded-full ring-1"
            :class="roleBadgeClass[user.role]"
          >
            {{ roleLabel[user.role] }}
          </span>
        </template>
      </div>

      <!-- Right: Clerk user button -->
      <div class="flex items-center justify-end w-48">
        <UserButton />
      </div>
    </header>

    <main class="flex-1 p-6">
      <RouterView />
    </main>
  </div>
</template>
