<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <header class="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <RouterLink to="/" class="text-xl font-black tracking-tight text-gray-900">
        Gym<span class="text-purple-600">XP</span>
      </RouterLink>

      <nav class="flex items-center gap-3">
        <RouterLink
          to="/sign-in"
          class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign in
        </RouterLink>
        <RouterLink
          to="/sign-in"
          class="text-sm font-semibold px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Get started
        </RouterLink>
      </nav>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
