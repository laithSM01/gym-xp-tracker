<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useClerk } from '@clerk/vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const clerk = useClerk()
const authStore = useAuthStore()

const user = computed(() => authStore.convexUser)

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/gym/dashboard',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
  },
  {
    label: 'Trainers',
    to: '/gym/trainers',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  },
  {
    label: 'Clients',
    to: '/gym/clients',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
  },
  {
    label: 'Products',
    to: '/gym/products',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  },
  {
    label: 'Requests',
    to: '/gym/requests',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  },
  {
    label: 'Billing',
    to: '/gym/billing',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>',
  },
  {
    label: 'Reports',
    to: '/gym/reports',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>',
  },
  {
    label: 'Settings',
    to: '/gym/edit',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
  },
]

function isActive(path: string): boolean {
  return route.path === path
}

async function handleLogout() {
  await clerk.value?.signOut()
  router.push('/')
}
</script>

<template>
  <div class="flex min-h-screen bg-ink-950 text-white">
    <!-- Sidebar -->
    <aside class="w-60 shrink-0 bg-ink-900 border-r border-white/5 flex flex-col py-6 px-4">
      <div class="px-2 mb-8 flex items-center gap-2">
        <div class="h-8 w-8 rounded-lg bg-accent-500 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="text-lg font-black tracking-tight">Gym<span class="text-accent-500">XP</span></span>
      </div>

      <nav class="flex flex-col gap-1 flex-1 overflow-y-auto">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="isActive(item.to) ? 'bg-accent-500 text-white' : 'text-ink-400 hover:bg-ink-800 hover:text-white'"
        >
          <span v-html="item.icon" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <button
        type="button"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-400 hover:bg-ink-800 hover:text-white transition-colors"
        @click="handleLogout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Log Out
      </button>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header class="h-16 shrink-0 px-6 flex items-center gap-4 border-b border-white/5">
        <div class="flex-1 max-w-md">
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Find something here..."
              class="w-full bg-ink-800 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </div>

        <button type="button" class="h-9 w-9 rounded-xl bg-ink-800 flex items-center justify-center text-ink-400 hover:text-white transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>

        <button type="button" class="relative h-9 w-9 rounded-xl bg-ink-800 flex items-center justify-center text-ink-400 hover:text-white transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span class="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent-500" />
        </button>

        <div class="flex items-center gap-2.5 pl-2 border-l border-white/5 shrink-0">
          <div class="h-9 w-9 rounded-full bg-accent-500/20 text-accent-500 flex items-center justify-center text-sm font-bold">
            {{ (user?.name ?? user?.email ?? 'G').charAt(0).toUpperCase() }}
          </div>
          <div class="hidden sm:block leading-tight">
            <p class="text-sm font-semibold text-white">{{ user?.name ?? 'Gym Owner' }}</p>
            <p class="text-xs text-ink-400">Gym Owner</p>
          </div>
        </div>
      </header>

      <main class="flex-1 p-6 lg:p-8 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
