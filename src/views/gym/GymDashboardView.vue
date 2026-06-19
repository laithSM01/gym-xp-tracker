<script setup lang="ts">
import { computed, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { GymService } from '@/services/gyms.service'
import { useGymInvites } from '@/composables/useGymInvites'
import { useIncomingRequests } from '@/composables/useIncomingRequests'

const gymsService = inject<GymService>('gymsService')!
const router = useRouter()
const dashboard = gymsService.getGymDashboard()

watch(
  dashboard,
  (val) => {
    if (val === null) router.replace('/gym/setup')
  },
  { immediate: true },
)

const planLabel = computed(() => {
  const plan = dashboard.value?.subscription?.plan
  if (!plan) return null
  const labels: Record<string, string> = {
    personal_trainer: 'Personal Trainer',
    gym_small: 'Gym Small',
    gym_medium: 'Gym Medium',
    gym_large: 'Gym Large',
  }
  return labels[plan] ?? plan
})

const subStatusClass = computed(() => {
  const status = dashboard.value?.subscription?.status
  if (status === 'active') return 'bg-green-100 text-green-700 ring-green-200'
  if (status === 'past_due') return 'bg-yellow-100 text-yellow-700 ring-yellow-200'
  if (status === 'canceled') return 'bg-red-100 text-red-700 ring-red-200'
  return 'bg-gray-100 text-gray-500 ring-gray-200'
})

function usagePct(used: number, limit: number) {
  if (limit <= 0) return 100
  return Math.min(100, Math.round((used / limit) * 100))
}

const {
  invites,
  inviteeName,
  inviteeEmail,
  isFormValid,
  isSubmitting,
  submitError,
  inviteUrl,
  copied,
  revokingId,
  revokeError,
  generateInvite,
  revokeInvite,
  copyInviteUrl,
} = useGymInvites()

function confirmRevoke(inviteId: string, name: string) {
  if (window.confirm(`Revoke invite for ${name}?`)) {
    revokeInvite(inviteId as Parameters<typeof revokeInvite>[0])
  }
}

const {
  pendingRequests,
  freeClients,
  respondingTo,
  respondError,
  pingingClient,
  pingError,
  approve,
  reject,
  ping,
} = useIncomingRequests()
</script>

<template>
  <div v-if="dashboard" class="flex flex-col gap-6">
    <!-- Gym header -->
    <div class="flex items-center gap-4">
      <div
        class="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-2xl flex-shrink-0"
      >
        🏋️
      </div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">{{ dashboard.gym.name }}</h1>
        <p class="text-sm text-gray-500">{{ dashboard.gym.city }} · {{ dashboard.gym.location }}</p>
      </div>
    </div>

    <!-- Overview bar -->
    <section class="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h2 class="text-base font-semibold text-gray-900">Subscription</h2>
        <div v-if="dashboard.subscription" class="flex items-center gap-3">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1"
            :class="subStatusClass"
          >
            {{ planLabel }}
          </span>
          <span class="text-xs text-gray-400">
            Renews {{ new Date(dashboard.subscription.currentPeriodEnd).toLocaleDateString() }}
          </span>
        </div>
        <span v-else class="text-sm text-gray-400">No active subscription</span>
      </div>

      <div v-if="dashboard.subscription && dashboard.limits" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Trainers meter -->
        <div v-if="dashboard.limits.trainers > 0" class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-gray-700">Trainers</span>
            <span class="text-gray-500">{{ dashboard.gym.trainersUsed }} / {{ dashboard.limits.trainers }}</span>
          </div>
          <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              class="h-full rounded-full bg-purple-500 transition-all"
              :style="{ width: usagePct(dashboard.gym.trainersUsed, dashboard.limits.trainers) + '%' }"
            />
          </div>
        </div>

        <!-- Clients meter -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-gray-700">Clients</span>
            <span class="text-gray-500">{{ dashboard.gym.clientsAdded }} / {{ dashboard.limits.clients }}</span>
          </div>
          <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              class="h-full rounded-full bg-purple-500 transition-all"
              :style="{ width: usagePct(dashboard.gym.clientsAdded, dashboard.limits.clients) + '%' }"
            />
          </div>
        </div>

        <!-- Products meter -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-gray-700">Products</span>
            <span class="text-gray-500">{{ dashboard.gym.productsListed }} / {{ dashboard.limits.products }}</span>
          </div>
          <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              class="h-full rounded-full bg-purple-500 transition-all"
              :style="{ width: usagePct(dashboard.gym.productsListed, dashboard.limits.products) + '%' }"
            />
          </div>
        </div>
      </div>

      <p v-else-if="!dashboard.subscription" class="text-sm text-gray-400">
        Upgrade to a plan to unlock trainer slots, client capacity, and product listings.
      </p>
    </section>

    <!-- Trainers panel -->
    <section class="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
      <h2 class="text-base font-semibold text-gray-900">Trainers</h2>

      <!-- Trainer list -->
      <div class="flex flex-col gap-2">
        <p v-if="dashboard.trainers.length === 0" class="text-sm text-gray-400 text-center py-4">
          No trainers yet.
        </p>

        <ul v-else class="flex flex-col divide-y divide-gray-100">
          <li
            v-for="trainer in dashboard.trainers"
            :key="trainer.userId"
            class="flex items-center gap-4 py-3"
          >
            <div
              class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 flex-shrink-0"
            >
              {{ trainer.name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ trainer.name }}</p>
            </div>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1"
              :class="
                trainer.affiliationRole === 'head_trainer'
                  ? 'bg-purple-100 text-purple-700 ring-purple-200'
                  : 'bg-gray-100 text-gray-500 ring-gray-200'
              "
            >
              {{ trainer.affiliationRole === 'head_trainer' ? 'Head Trainer' : 'Trainer' }}
            </span>
            <span class="text-xs text-gray-500 shrink-0">
              {{ trainer.clientCountCapped ? '100+' : trainer.clientCount }} client{{ trainer.clientCount === 1 && !trainer.clientCountCapped ? '' : 's' }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Invite form -->
      <div class="border-t border-gray-100 pt-5 flex flex-col gap-3">
        <h3 class="text-sm font-semibold text-gray-700">Invite a Trainer</h3>

        <form class="flex flex-col gap-3" @submit.prevent="generateInvite">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              v-model="inviteeName"
              type="text"
              placeholder="Trainer name"
              class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              v-model="inviteeEmail"
              type="email"
              placeholder="trainer@email.com"
              class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
          <div>
            <button
              type="submit"
              :disabled="!isFormValid || isSubmitting"
              class="py-2.5 px-5 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Generating...' : 'Generate Invite Link' }}
            </button>
          </div>
        </form>

        <div
          v-if="inviteUrl"
          class="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200"
        >
          <span class="flex-1 text-sm font-mono text-purple-800 break-all">{{ inviteUrl }}</span>
          <button
            class="shrink-0 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
            @click="copyInviteUrl"
          >
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>

        <!-- Sent invites -->
        <div class="flex flex-col gap-2">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent Invites</h4>

          <div v-if="invites === undefined" class="py-4 flex justify-center">
            <div class="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          </div>

          <p v-else-if="!invites?.length" class="text-sm text-gray-400 py-2 text-center">
            No invites sent yet.
          </p>

          <ul v-else class="flex flex-col divide-y divide-gray-100">
            <li
              v-for="invite in invites"
              :key="invite._id"
              class="flex items-center gap-4 py-3"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ invite.invitedName }}</p>
                <p class="text-xs text-gray-500 truncate">{{ invite.invitedEmail }}</p>
              </div>
              <div class="flex flex-col items-end gap-1 shrink-0">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1"
                  :class="{
                    'bg-yellow-100 text-yellow-700 ring-yellow-200': invite.status === 'pending',
                    'bg-green-100 text-green-700 ring-green-200': invite.status === 'accepted',
                    'bg-gray-100 text-gray-500 ring-gray-200': invite.status === 'expired',
                  }"
                >
                  {{ invite.status }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ new Date(invite.createdAt).toLocaleDateString() }}
                </span>
              </div>
              <button
                v-if="invite.status === 'pending'"
                :disabled="revokingId === invite._id"
                class="text-xs px-3 py-1 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
                @click="confirmRevoke(invite._id, invite.invitedName)"
              >
                {{ revokingId === invite._id ? 'Revoking...' : 'Revoke' }}
              </button>
              <div v-else class="w-16" />
            </li>
          </ul>

          <p v-if="revokeError" class="text-sm text-red-600">{{ revokeError }}</p>
        </div>
      </div>
    </section>

    <!-- Clients panel -->
    <section class="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
      <h2 class="text-base font-semibold text-gray-900">Clients</h2>

      <p v-if="dashboard.clients.length === 0" class="text-sm text-gray-400 text-center py-4">
        No clients yet.
      </p>

      <ul v-else class="flex flex-col divide-y divide-gray-100">
        <li
          v-for="client in dashboard.clients"
          :key="client.clientId"
          class="flex items-center gap-4 py-3"
        >
          <div
            class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-semibold text-purple-700 flex-shrink-0"
          >
            {{ client.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ client.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ client.city }} · {{ client.goal }}</p>
          </div>
          <span
            class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1"
            :class="
              client.trainerName
                ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                : 'bg-gray-100 text-gray-400 ring-gray-200'
            "
          >
            {{ client.trainerName ?? 'Unassigned' }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Client Requests panel -->
    <section class="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
      <h2 class="text-base font-semibold text-gray-900">Client Join Requests</h2>

      <p v-if="respondError" class="text-sm text-red-600">{{ respondError }}</p>

      <div v-if="pendingRequests === undefined" class="py-6 flex justify-center">
        <div class="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>

      <p v-else-if="pendingRequests?.length === 0" class="text-sm text-gray-400 text-center py-4">
        No pending requests from clients.
      </p>

      <ul v-else class="flex flex-col divide-y divide-gray-100">
        <li
          v-for="r in pendingRequests"
          :key="r._id"
          class="flex items-center gap-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">{{ r.clientName }}</p>
            <p class="text-xs text-gray-500">{{ r.clientCity }} · {{ r.clientGoal }}</p>
            <p v-if="r.message" class="text-xs text-gray-400 mt-0.5 truncate">{{ r.message }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              :disabled="respondingTo === r._id"
              class="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-40"
              @click="approve(r._id)"
            >
              {{ respondingTo === r._id ? '...' : 'Approve' }}
            </button>
            <button
              :disabled="respondingTo === r._id"
              class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
              @click="reject(r._id)"
            >
              Decline
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- Discover Free Clients panel -->
    <section class="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
      <h2 class="text-base font-semibold text-gray-900">Discover Free Clients</h2>
      <p class="text-xs text-gray-400 -mt-2">Unassigned clients with no gym or trainer yet</p>

      <p v-if="pingError" class="text-sm text-red-600">{{ pingError }}</p>

      <div v-if="freeClients === undefined" class="py-6 flex justify-center">
        <div class="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>

      <p v-else-if="freeClients === null" class="text-sm text-gray-400 text-center py-4">
        An active subscription is required to discover free clients.
      </p>

      <p v-else-if="freeClients.length === 0" class="text-sm text-gray-400 text-center py-4">
        No free clients found in this area.
      </p>

      <ul v-else class="flex flex-col divide-y divide-gray-100">
        <li
          v-for="client in freeClients"
          :key="client._id"
          class="flex items-center gap-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">{{ client.name }}</p>
            <p class="text-xs text-gray-500">{{ client.city }} · Age {{ client.age }}</p>
            <p class="text-xs text-gray-400 truncate">{{ client.goal }}</p>
          </div>
          <button
            :disabled="pingingClient === client.userId"
            class="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-40"
            @click="ping(client.userId)"
          >
            {{ pingingClient === client.userId ? 'Sending...' : 'Invite' }}
          </button>
        </li>
      </ul>
    </section>
  </div>

  <div v-else-if="dashboard === undefined" class="text-center py-16 text-gray-400 text-sm">
    Loading...
  </div>
</template>
