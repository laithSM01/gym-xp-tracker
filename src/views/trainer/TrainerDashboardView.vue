<script setup lang="ts">
import { computed, ref, watch, inject } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { tierConfig, tierMax, xpProgress } from '@/utils/xp'
import type { TrainerService } from '@/services/trainers.service'
import type { ProductsService, ProductCategory } from '@/services/products.service'
import type { Id } from '../../../convex/_generated/dataModel'
import { useIncomingRequests } from '@/composables/useIncomingRequests'
import { GOAL_OPTIONS } from '@/composables/useNewClient'
import BaseCard from '@/components/ui/BaseCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Badge from '@/components/ui/Badge.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import FormField from '@/components/ui/FormField.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { inputClass, selectClass, textareaClass } from '@/components/ui/formStyles'

const trainersService = inject<TrainerService>('trainersService')!
const router = useRouter()
const dashboard = trainersService.getTrainerDashboard()

// Quick-action tiles
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Training board — active programs grouped by client goal
const programsBoard = trainersService.getProgramsBoard()

const COLUMN_CHIP_CLASSES = [
  'bg-brand-100 text-brand-600',
  'bg-violet-100 text-violet-500',
  'bg-emerald-100 text-emerald-500',
  'bg-pink-100 text-pink-500',
  'bg-amber-100 text-amber-500',
]

function programDurationWeeks(startDate: number, endDate: number): number {
  return Math.max(1, Math.round((endDate - startDate) / (7 * 24 * 60 * 60 * 1000)))
}

const trainingColumns = computed(() => {
  const entries = programsBoard.value ?? []
  const knownGoals = GOAL_OPTIONS as readonly string[]
  const goalsPresent = [...new Set(entries.map((e) => e.goal))]
  const orderedGoals = [
    ...knownGoals.filter((g) => goalsPresent.includes(g)),
    ...goalsPresent.filter((g) => !knownGoals.includes(g)),
  ]
  return orderedGoals.map((goal, i) => ({
    goal,
    chipClass: COLUMN_CHIP_CLASSES[i % COLUMN_CHIP_CLASSES.length],
    entries: entries.filter((e) => e.goal === goal),
  }))
})

watch(
  dashboard,
  (val) => {
    if (val === null) router.replace('/trainer/setup')
  },
  { immediate: true },
)

const enrolledCount = computed(
  () => dashboard.value?.clients.filter((c) => c.isEnrolled).length ?? 0,
)

const subStatusClass = computed(() => {
  const status = dashboard.value?.subscription?.status
  if (status === 'active') return 'bg-green-100 text-green-700 ring-1 ring-green-200'
  if (status === 'past_due') return 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200'
  if (status === 'canceled') return 'bg-red-100 text-red-700 ring-1 ring-red-200'
  return 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
})

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

function usagePct(used: number, limit: number) {
  if (limit <= 0) return 100
  return Math.min(100, Math.round((used / limit) * 100))
}

const productsService = inject<ProductsService>('productsService')!
const products = productsService.listMyProducts()

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  supplement: 'Supplement',
  equipment: 'Equipment',
  food: 'Food',
  digital_program: 'Digital Program',
  session: 'Session',
}

const showProductForm = ref(false)
const productName = ref('')
const productDescription = ref('')
const productPrice = ref<number | ''>('')
const productCategory = ref<ProductCategory>('supplement')
const productImageFile = ref<File | null>(null)
const productImagePreview = ref<string | null>(null)
const isAddingProduct = ref(false)
const addProductError = ref('')
const togglingProduct = ref<string | null>(null)
const deletingProduct = ref<string | null>(null)

function onProductImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  productImageFile.value = file
  productImagePreview.value = URL.createObjectURL(file)
}

async function submitProduct() {
  if (!productName.value.trim() || !productDescription.value.trim() || productPrice.value === '') return
  isAddingProduct.value = true
  addProductError.value = ''
  try {
    let imageStorageId: Id<'_storage'> | undefined
    if (productImageFile.value) {
      const uploadUrl = await productsService.generateUploadUrl()
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': productImageFile.value.type },
        body: productImageFile.value,
      })
      if (!res.ok) throw new Error('Image upload failed')
      const { storageId } = await res.json() as { storageId: Id<'_storage'> }
      imageStorageId = storageId
    }
    await productsService.createProduct({
      name: productName.value.trim(),
      description: productDescription.value.trim(),
      priceJod: productPrice.value as number,
      category: productCategory.value,
      imageStorageId,
    })
    showProductForm.value = false
    productName.value = ''
    productDescription.value = ''
    productPrice.value = ''
    productCategory.value = 'supplement'
    productImageFile.value = null
    productImagePreview.value = null
  } catch (e) {
    addProductError.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    isAddingProduct.value = false
  }
}

async function toggleProduct(productId: Id<'products'>) {
  togglingProduct.value = productId
  try {
    await productsService.toggleProductActive(productId)
  } finally {
    togglingProduct.value = null
  }
}

async function confirmDeleteProduct(productId: Id<'products'>, name: string) {
  if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
  deletingProduct.value = productId
  try {
    await productsService.deleteProduct(productId)
  } finally {
    deletingProduct.value = null
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
  <div class="max-w-7xl mx-auto">
    <!-- Loading -->
    <div v-if="dashboard === undefined" class="flex items-center justify-center py-24">
      <div class="w-8 h-8 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
    </div>

    <template v-else-if="dashboard">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Welcome back, {{ dashboard.trainerName }}</h1>
          <p class="mt-1 text-slate-400">
            You have
            <span class="font-semibold text-slate-600">{{ enrolledCount }}</span>
            active client{{ enrolledCount !== 1 ? 's' : '' }}
          </p>
        </div>
        <RouterLink to="/trainer/new-client">
          <AppButton>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Client
          </AppButton>
        </RouterLink>
      </div>

      <!-- Quick-action tiles -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <RouterLink to="/trainer/new-client">
          <BaseCard padding="p-4" class="h-full hover:shadow-md transition-shadow duration-150">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span class="text-sm font-semibold text-slate-800">New Client</span>
            </div>
          </BaseCard>
        </RouterLink>
        <button type="button" class="text-left" @click="scrollToSection('clients-section')">
          <BaseCard padding="p-4" class="h-full hover:shadow-md transition-shadow duration-150">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-violet-100 text-violet-500 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span class="text-sm font-semibold text-slate-800">Clients</span>
            </div>
          </BaseCard>
        </button>
        <button type="button" class="text-left" @click="scrollToSection('training-section')">
          <BaseCard padding="p-4" class="h-full hover:shadow-md transition-shadow duration-150">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span class="text-sm font-semibold text-slate-800">Training</span>
            </div>
          </BaseCard>
        </button>
        <button type="button" class="text-left" @click="scrollToSection('products-section')">
          <BaseCard padding="p-4" class="h-full hover:shadow-md transition-shadow duration-150">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span class="text-sm font-semibold text-slate-800">Products</span>
            </div>
          </BaseCard>
        </button>
      </div>

      <!-- Subscription -->
      <BaseCard class="mb-6">
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <h2 class="text-base font-semibold text-slate-800">Subscription</h2>
            <div v-if="dashboard.subscription" class="flex items-center gap-3">
              <Badge :badge-class="subStatusClass">{{ planLabel }}</Badge>
              <span class="text-xs text-slate-400">
                Renews {{ new Date(dashboard.subscription.currentPeriodEnd).toLocaleDateString() }}
              </span>
            </div>
            <span v-else class="text-sm text-slate-400">No active subscription</span>
          </div>

          <div v-if="dashboard.subscription && dashboard.limits" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-600">Clients</span>
                <span class="text-slate-400">{{ dashboard.trainerProfile.clientsAdded }} / {{ dashboard.limits.clients }}</span>
              </div>
              <ProgressBar :percent="usagePct(dashboard.trainerProfile.clientsAdded, dashboard.limits.clients)" />
            </div>

            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-600">Products</span>
                <span class="text-slate-400">{{ dashboard.trainerProfile.productsListed }} / {{ dashboard.limits.products }}</span>
              </div>
              <ProgressBar :percent="usagePct(dashboard.trainerProfile.productsListed, dashboard.limits.products)" />
            </div>
          </div>

          <p v-else-if="!dashboard.subscription" class="text-sm text-slate-400">
            Upgrade to a plan to unlock client capacity and product listings.
          </p>
        </div>
      </BaseCard>

      <!-- Clients section -->
      <div id="clients-section" class="mb-8">
        <h2 class="text-base font-semibold text-slate-800 mb-4">Clients</h2>

        <EmptyState
          v-if="dashboard.clients.length === 0"
          message="No clients yet — clients will appear here once they're assigned to you."
        />

        <div v-else class="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          <RouterLink
            v-for="client in dashboard.clients"
            :key="client._id"
            :to="`/trainer/client/${client._id}`"
            class="block shrink-0 w-64"
          >
            <BaseCard padding="p-5" class="h-full hover:shadow-md transition-shadow duration-150">
              <!-- Name + tier badge -->
              <div class="flex items-start justify-between gap-2 mb-1">
                <span class="font-semibold text-slate-800 truncate">{{ client.name }}</span>
                <Badge :badge-class="tierConfig[client.currentTier].badge">
                  {{ tierConfig[client.currentTier].label }}
                </Badge>
              </div>

              <!-- City -->
              <p class="text-xs text-slate-400 mb-2">{{ client.city }}</p>

              <!-- Goal -->
              <p class="text-sm text-slate-500 mb-4 line-clamp-2">{{ client.goal }}</p>

              <!-- XP bar -->
              <div>
                <div class="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{{ client.currentXP.toLocaleString() }} XP</span>
                  <span v-if="client.currentTier !== 'elite'">
                    {{ tierMax[client.currentTier].toLocaleString() }}
                  </span>
                  <span v-else class="text-green-500 font-semibold">MAX</span>
                </div>
                <ProgressBar
                  :percent="xpProgress(client.currentXP, client.currentTier)"
                  :bar-class="tierConfig[client.currentTier].bar"
                />
              </div>
            </BaseCard>
          </RouterLink>
        </div>
      </div>

      <!-- Training board -->
      <div id="training-section" class="mb-8">
        <h2 class="text-base font-semibold text-slate-800 mb-4">Training</h2>

        <EmptyState
          v-if="trainingColumns.length === 0"
          message="No active programs yet. Approve a program from a client's page to see it here, grouped by goal."
        />

        <div v-else class="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          <div v-for="column in trainingColumns" :key="column.goal" class="shrink-0 w-72">
            <div class="flex items-center gap-2 mb-3">
              <div class="h-6 w-6 rounded-lg flex items-center justify-center shrink-0" :class="column.chipClass">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span class="text-sm font-semibold text-slate-800 truncate">{{ column.goal }}</span>
              <Badge tone="brand">{{ column.entries.length }}</Badge>
            </div>

            <div class="flex flex-col gap-3">
              <BaseCard v-for="entry in column.entries" :key="entry.program._id" padding="p-4">
                <p class="text-sm font-semibold text-slate-800 truncate mb-2">{{ entry.program.title }}</p>
                <Badge tone="neutral" class="mb-3">{{ entry.clientName }}</Badge>
                <div class="flex items-center justify-between text-xs text-slate-400">
                  <span>Duration: {{ programDurationWeeks(entry.program.startDate, entry.program.endDate) }} weeks</span>
                  <span>{{ entry.program.sessionsPerWeek }} sessions/week</span>
                </div>
              </BaseCard>
            </div>
          </div>
        </div>
      </div>

      <!-- Products panel -->
      <BaseCard id="products-section" class="mt-8">
        <div class="flex flex-col gap-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-800">Products</h2>
            <AppButton
              :variant="showProductForm ? 'ghost' : 'primary'"
              size="sm"
              @click="showProductForm = !showProductForm; addProductError = ''"
            >
              {{ showProductForm ? 'Cancel' : 'Add Product' }}
            </AppButton>
          </div>

          <!-- Inline add form -->
          <form v-if="showProductForm" class="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl" @submit.prevent="submitProduct">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <input v-model="productName" type="text" placeholder="Product name" required :class="inputClass" />
              </FormField>
              <FormField>
                <select v-model="productCategory" :class="selectClass">
                  <option v-for="(label, val) in CATEGORY_LABELS" :key="val" :value="val">{{ label }}</option>
                </select>
              </FormField>
            </div>
            <FormField>
              <textarea v-model="productDescription" placeholder="Description" rows="2" required :class="textareaClass" />
            </FormField>
            <div class="flex gap-3 items-center">
              <div class="relative flex-1">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">JOD</span>
                <input
                  v-model.number="productPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                  class="pl-12"
                  :class="inputClass"
                />
              </div>
              <!-- Image upload -->
              <label class="flex-shrink-0 cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-brand-400 transition-colors text-sm text-slate-500">
                <img v-if="productImagePreview" :src="productImagePreview" class="w-7 h-7 rounded object-cover" alt="preview" />
                <span v-else class="text-slate-400">📷</span>
                <span>{{ productImagePreview ? 'Change' : 'Add image' }}</span>
                <input type="file" accept="image/*" class="sr-only" @change="onProductImageChange" />
              </label>
            </div>
            <p v-if="addProductError" class="text-sm text-red-600">{{ addProductError }}</p>
            <div class="flex gap-2">
              <AppButton
                type="submit"
                :loading="isAddingProduct"
                :disabled="!productName.trim() || !productDescription.trim() || productPrice === ''"
              >
                {{ isAddingProduct ? 'Saving...' : 'Save Product' }}
              </AppButton>
            </div>
          </form>

          <!-- Product list -->
          <div v-if="products === undefined" class="py-4 flex justify-center">
            <div class="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>

          <EmptyState v-else-if="!products?.length" message="No products yet." />

          <ul v-else class="flex flex-col divide-y divide-slate-100">
            <li v-for="product in products" :key="product._id" class="flex items-center gap-3 py-3">
              <!-- Thumbnail -->
              <div class="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center text-lg">
                <img v-if="product.imageUrl" :src="product.imageUrl" class="w-full h-full object-cover" alt="" />
                <span v-else>📦</span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">{{ product.name }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{{ CATEGORY_LABELS[product.category] }}</span>
                  <span class="text-xs font-semibold text-slate-700">{{ product.priceJod.toFixed(2) }} JOD</span>
                </div>
              </div>

              <!-- Active toggle -->
              <ToggleSwitch
                :model-value="product.isActive"
                :disabled="togglingProduct === product._id"
                @update:model-value="toggleProduct(product._id)"
              />

              <!-- Delete -->
              <AppButton
                variant="danger"
                size="sm"
                :loading="deletingProduct === product._id"
                @click="confirmDeleteProduct(product._id, product.name)"
              >
                Delete
              </AppButton>
            </li>
          </ul>
        </div>
      </BaseCard>

      <!-- Requests + Discover -->
      <div id="requests-section" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <!-- Client Requests panel -->
        <BaseCard>
          <div class="flex flex-col gap-4">
            <h2 class="text-base font-semibold text-slate-800">Client Join Requests</h2>

            <p v-if="respondError" class="text-sm text-red-600">{{ respondError }}</p>

            <div v-if="pendingRequests === undefined" class="py-6 flex justify-center">
              <div class="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            </div>

            <EmptyState v-else-if="pendingRequests?.length === 0" message="No pending requests from clients." />

            <ul v-else class="flex flex-col divide-y divide-slate-100">
              <li v-for="r in pendingRequests" :key="r._id" class="flex items-center gap-4 py-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800 truncate">{{ r.clientName }}</p>
                  <p class="text-xs text-slate-500">{{ r.clientCity }} · {{ r.clientGoal }}</p>
                  <p v-if="r.message" class="text-xs text-slate-400 mt-0.5 truncate">{{ r.message }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <AppButton size="sm" :loading="respondingTo === r._id" @click="approve(r._id)">Approve</AppButton>
                  <AppButton size="sm" variant="secondary" :disabled="respondingTo === r._id" @click="reject(r._id)">Decline</AppButton>
                </div>
              </li>
            </ul>
          </div>
        </BaseCard>

        <!-- Discover Free Clients panel -->
        <BaseCard>
          <div class="flex flex-col gap-4">
            <div>
              <h2 class="text-base font-semibold text-slate-800">Discover Free Clients</h2>
              <p class="text-xs text-slate-400">Unassigned clients with no gym or trainer yet</p>
            </div>

            <p v-if="pingError" class="text-sm text-red-600">{{ pingError }}</p>

            <div v-if="freeClients === undefined" class="py-6 flex justify-center">
              <div class="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            </div>

            <EmptyState v-else-if="freeClients === null" message="An active subscription is required to discover free clients." />
            <EmptyState v-else-if="freeClients.length === 0" message="No free clients found." />

            <ul v-else class="flex flex-col divide-y divide-slate-100">
              <li v-for="client in freeClients" :key="client.userId" class="flex items-center gap-4 py-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800 truncate">{{ client.name }}</p>
                  <p class="text-xs text-slate-500">{{ client.city }} · Age {{ client.age }}</p>
                  <p class="text-xs text-slate-400 truncate">{{ client.goal }}</p>
                </div>
                <AppButton size="sm" :loading="pingingClient === client.userId" @click="ping(client.userId)">
                  Invite
                </AppButton>
              </li>
            </ul>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
