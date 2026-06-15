import { ref, computed, inject } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'
import type { GymInvitesService } from '@/services/gym-invites.service'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function useGymInvites() {
  const gymInvitesService = inject<GymInvitesService>('gymInvitesService')!

  const invites = gymInvitesService.listGymInvites()

  const inviteeName = ref('')
  const inviteeEmail = ref('')

  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)
  const lastCreatedId = ref<Id<'gymInvitations'> | null>(null)

  const revokingId = ref<Id<'gymInvitations'> | null>(null)
  const revokeError = ref<string | null>(null)

  const copied = ref(false)

  const isFormValid = computed(
    () =>
      inviteeName.value.trim().length > 0 && isValidEmail(inviteeEmail.value.trim()),
  )

  const generatedToken = computed(() => {
    if (!lastCreatedId.value || !invites.value) return null
    return invites.value.find((i) => i._id === lastCreatedId.value)?.inviteToken ?? null
  })

  const inviteUrl = computed(() =>
    generatedToken.value
      ? `${window.location.origin}/invite/gym?token=${generatedToken.value}`
      : null,
  )

  async function generateInvite() {
    if (!isFormValid.value || isSubmitting.value) return
    isSubmitting.value = true
    submitError.value = null
    lastCreatedId.value = null
    try {
      lastCreatedId.value = await gymInvitesService.createInvite(
        inviteeName.value.trim(),
        inviteeEmail.value.trim(),
      )
      inviteeName.value = ''
      inviteeEmail.value = ''
    } catch (e: unknown) {
      submitError.value = e instanceof Error ? e.message : 'Failed to generate invite'
    } finally {
      isSubmitting.value = false
    }
  }

  async function revokeInvite(inviteId: Id<'gymInvitations'>) {
    if (revokingId.value) return
    revokingId.value = inviteId
    revokeError.value = null
    try {
      await gymInvitesService.revokeInvite(inviteId)
    } catch (e: unknown) {
      revokeError.value = e instanceof Error ? e.message : 'Failed to revoke invite'
    } finally {
      revokingId.value = null
    }
  }

  async function copyInviteUrl() {
    if (!inviteUrl.value) return
    await navigator.clipboard.writeText(inviteUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }

  return {
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
  }
}
