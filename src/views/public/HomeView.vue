<script setup lang="ts">
import { RouterLink } from 'vue-router'

const AUDIENCES = [
  {
    icon: '🏋️',
    title: "I'm a personal trainer",
    description: 'Track every client in one place, show them their progress, and keep them training with you longer.',
  },
  {
    icon: '🥋',
    title: 'I run an academy',
    description: 'Track each group and every kid, and keep parents updated on attendance, levels and progress.',
  },
]

const STEPS = [
  { title: 'Set up in minutes', description: 'Add your groups, your clients and what you want to track.' },
  { title: 'Log each session', description: 'Attendance and progress in a few taps, right after training.' },
  { title: 'Show the results', description: 'Clients and parents see the progress, and stay because of it.' },
]
</script>

<template>
  <!-- Hero -->
  <section class="bg-gradient-to-br from-gray-900 to-purple-950 text-white px-6 py-16">
    <div class="max-w-3xl mx-auto text-center">
      <h1 class="text-4xl sm:text-5xl font-black tracking-tight mb-3">
        Keep your clients longer. Show them their progress.
      </h1>
      <p class="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
        Progress tracking for personal trainers and sports academies in Jordan.
      </p>
      <RouterLink
        to="/sign-in"
        class="inline-block text-sm font-semibold px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
      >
        Get started
      </RouterLink>
    </div>
  </section>

  <div class="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12">
    <!-- Who it's for -->
    <section class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <RouterLink
        v-for="audience in AUDIENCES"
        :key="audience.title"
        to="/sign-in"
        class="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 hover:border-purple-400 transition-colors"
      >
        <span class="text-3xl">{{ audience.icon }}</span>
        <h2 class="mt-3 text-lg font-bold text-gray-900">{{ audience.title }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ audience.description }}</p>
      </RouterLink>
    </section>

    <!-- How it works -->
    <section>
      <h2 class="text-xl font-bold text-gray-900 mb-6">How it works</h2>
      <ol class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <li v-for="(step, i) in STEPS" :key="step.title" class="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
          <span class="text-sm font-bold text-purple-600">{{ i + 1 }}</span>
          <h3 class="mt-1 font-semibold text-gray-900">{{ step.title }}</h3>
          <p class="mt-1 text-sm text-gray-500">{{ step.description }}</p>
        </li>
      </ol>
    </section>

    <p class="text-center text-sm text-gray-500">
      Training with a coach who uses the app? Ask them for an invite, then
      <RouterLink to="/sign-in" class="font-semibold text-purple-600 hover:text-purple-700">sign in</RouterLink>.
    </p>
  </div>
</template>
