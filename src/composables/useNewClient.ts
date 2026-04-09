import { ref, computed, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { ConvexClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { UnassignedUser } from '@/types/client'

export function useNewClient() {
  const convex = inject<ConvexClient>('convex')!
  const router = useRouter()

  const unassignedClients = ref<UnassignedUser[] | null>(null)

  const { unsubscribe } = convex.onUpdate(api.clients.getUnassignedClients, {}, (data) => {
    unassignedClients.value = data as UnassignedUser[] | null
  })

  onUnmounted(() => unsubscribe())

  const selectedUserId = ref<string>('')
  const search = ref('')

  const filteredClients = computed(() => {
    const list = unassignedClients.value ?? []
    const q = search.value.trim().toLowerCase()
    if (!q) return list
    return list.filter((u) => {
      const name = (u.name ?? '').toLowerCase()
      const email = (u.email ?? '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  })

  function displayName(u: UnassignedUser): string {
    return u.name ?? u.email ?? u._id
  }

  const age = ref('')
  const goal = ref('')
  const weight = ref('')
  const bodyFat = ref('')
  const muscleMass = ref('')

  const isSubmitting = ref(false)
  const submitError = ref('')

  const isFormValid = computed(() =>
    selectedUserId.value &&
    age.value &&
    parseInt(age.value) > 0 &&
    goal.value.trim() &&
    weight.value &&
    parseFloat(weight.value) > 0 &&
    bodyFat.value &&
    parseFloat(bodyFat.value) > 0 &&
    muscleMass.value &&
    parseFloat(muscleMass.value) > 0,
  )

  async function submit() {
    if (!isFormValid.value) return
    isSubmitting.value = true
    submitError.value = ''
    try {
      const clientId = await convex.mutation(api.clients.createClient, {
        userId: selectedUserId.value as Id<'users'>,
        age: parseInt(age.value),
        goal: goal.value.trim(),
        initialWeight: parseFloat(weight.value),
        initialBodyFat: parseFloat(bodyFat.value),
        initialMuscleMass: parseFloat(muscleMass.value),
      })
      router.push(`/trainer/client/${clientId as Id<'clients'>}`)
    } catch (e: unknown) {
      submitError.value = e instanceof Error ? e.message : 'Failed to create client'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    data: {
      unassignedClients,
      filteredClients,
      selectedUserId,
      search,
      age,
      goal,
      weight,
      bodyFat,
      muscleMass,
      isFormValid,
      isSubmitting,
      submitError,
    },
    loading: computed(() => unassignedClients.value === null),
    error: null,
    actions: {
      submit,
      displayName,
    },
  }
}
