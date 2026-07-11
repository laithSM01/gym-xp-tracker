<script setup lang="ts">
import { inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { GymService } from '@/services/gyms.service'
import { useGymInvites } from '@/composables/useGymInvites'

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
</script>

<template>
  <div v-if="dashboard" class="flex flex-col gap-6">
    <h1 class="text-xl font-bold text-white">Trainers</h1>

    <!-- Trainers panel -->
    <section class="bg-ink-800 rounded-2xl border border-white/5 p-6 flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <p v-if="dashboard.trainers.length === 0" class="text-sm text-ink-400 text-center py-4">
          No trainers yet.
        </p>

        <ul v-else class="flex flex-col divide-y divide-white/5">
          <li
            v-for="trainer in dashboard.trainers"
            :key="trainer.userId"
            class="flex items-center gap-4 py-3"
          >
            <div
              class="w-8 h-8 rounded-full bg-cyan-400/15 flex items-center justify-center text-sm font-semibold text-cyan-400 flex-shrink-0"
            >
              {{ trainer.name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ trainer.name }}</p>
            </div>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="
                trainer.affiliationRole === 'head_trainer'
                  ? 'bg-accent-500/15 text-accent-500'
                  : 'bg-white/5 text-ink-400'
              "
            >
              {{ trainer.affiliationRole === 'head_trainer' ? 'Head Trainer' : 'Trainer' }}
            </span>
            <span class="text-xs text-ink-400 shrink-0">
              {{ trainer.clientCountCapped ? '100+' : trainer.clientCount }} client{{ trainer.clientCount === 1 && !trainer.clientCountCapped ? '' : 's' }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Invite form -->
      <div class="border-t border-white/5 pt-5 flex flex-col gap-3">
        <h3 class="text-sm font-semibold text-white">Invite a Trainer</h3>

        <form class="flex flex-col gap-3" @submit.prevent="generateInvite">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              v-model="inviteeName"
              type="text"
              placeholder="Trainer name"
              class="px-3 py-2 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <input
              v-model="inviteeEmail"
              type="email"
              placeholder="trainer@email.com"
              class="px-3 py-2 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <p v-if="submitError" class="text-sm text-red-400">{{ submitError }}</p>
          <div>
            <button
              type="submit"
              :disabled="!isFormValid || isSubmitting"
              class="py-2.5 px-5 rounded-lg bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Generating...' : 'Generate Invite Link' }}
            </button>
          </div>
        </form>

        <div
          v-if="inviteUrl"
          class="flex items-center gap-3 p-4 bg-accent-500/10 rounded-xl border border-accent-500/20"
        >
          <span class="flex-1 text-sm font-mono text-accent-500 break-all">{{ inviteUrl }}</span>
          <button
            class="shrink-0 text-sm font-semibold text-accent-500 hover:text-accent-600 transition-colors"
            @click="copyInviteUrl"
          >
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>

        <!-- Sent invites -->
        <div class="flex flex-col gap-2">
          <h4 class="text-xs font-semibold text-ink-400 uppercase tracking-wide">Sent Invites</h4>

          <div v-if="invites === undefined" class="py-4 flex justify-center">
            <div class="w-5 h-5 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
          </div>

          <p v-else-if="!invites?.length" class="text-sm text-ink-400 py-2 text-center">
            No invites sent yet.
          </p>

          <ul v-else class="flex flex-col divide-y divide-white/5">
            <li
              v-for="invite in invites"
              :key="invite._id"
              class="flex items-center gap-4 py-3"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ invite.invitedName }}</p>
                <p class="text-xs text-ink-400 truncate">{{ invite.invitedEmail }}</p>
              </div>
              <div class="flex flex-col items-end gap-1 shrink-0">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-yellow-400/15 text-yellow-400': invite.status === 'pending',
                    'bg-emerald-400/15 text-emerald-400': invite.status === 'accepted',
                    'bg-white/5 text-ink-400': invite.status === 'expired',
                  }"
                >
                  {{ invite.status }}
                </span>
                <span class="text-xs text-ink-400">
                  {{ new Date(invite.createdAt).toLocaleDateString() }}
                </span>
              </div>
              <button
                v-if="invite.status === 'pending'"
                :disabled="revokingId === invite._id"
                class="text-xs px-3 py-1 rounded-lg text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                @click="confirmRevoke(invite._id, invite.invitedName)"
              >
                {{ revokingId === invite._id ? 'Revoking...' : 'Revoke' }}
              </button>
              <div v-else class="w-16" />
            </li>
          </ul>

          <p v-if="revokeError" class="text-sm text-red-400">{{ revokeError }}</p>
        </div>
      </div>
    </section>
  </div>

  <div v-else-if="dashboard === undefined" class="text-center py-16 text-ink-400 text-sm">
    Loading...
  </div>
</template>
