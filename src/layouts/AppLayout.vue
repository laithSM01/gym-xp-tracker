<script setup lang="ts">
import { UserButton } from '@clerk/vue'
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <span class="app-title">Gym XP Tracker</span>
      <UserButton />
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 60px;
  border-bottom: 1px solid #e5e7eb;
}

.app-title {
  font-weight: 600;
  font-size: 1.125rem;
}

.app-main {
  flex: 1;
  padding: 1.5rem;
}
</style>
