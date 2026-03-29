<script setup lang="ts">
import { SignIn } from '@clerk/vue'
</script>

<template>
  <div class="auth-layout">
    <SignIn />
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
