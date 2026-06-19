<script setup lang="ts">
import { computed, ref, watch, inject } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { tierConfig, tierMax, xpProgress } from '@/utils/xp'
import type { TrainerService } from '@/services/trainers.service'
import type { ProductsService, ProductCategory } from '@/services/products.service'
import type { Id } from '../../../convex/_generated/dataModel'
import { useIncomingRequests } from '@/composables/useIncomingRequests'

const trainersService = inject<TrainerService>('trainersService')!
const router = useRouter()
const dashboard = trainersService.getTrainerDashboard()

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
  if (status === 'active') return 'bg-green-100 text-green-700 ring-green-200'
  if (status === 'past_due') return 'bg-yellow-100 text-yellow-700 ring-yellow-200'
  if (status === 'canceled') return 'bg-red-100 text-red-700 ring-red-200'
  return 'bg-gray-100 text-gray-500 ring-gray-200'
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
      <div class="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>

    <template v-else-if="dashboard">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Welcome back, {{ dashboard.trainerName }}</h1>
          <p class="mt-1 text-gray-500">
            You have
            <span class="font-semibold text-gray-700">{{ enrolledCount }}</span>
            active client{{ enrolledCount !== 1 ? 's' : '' }}
          </p>
        </div>
        <RouterLink
          to="/trainer/new-client"
          class="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </RouterLink>
      </div>

      <!-- Overview bar -->
      <section class="mb-6 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
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

        <div v-if="dashboard.subscription && dashboard.limits" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Clients meter -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-gray-700">Clients</span>
              <span class="text-gray-500">{{ dashboard.trainerProfile.clientsAdded }} / {{ dashboard.limits.clients }}</span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                class="h-full rounded-full bg-purple-500 transition-all"
                :style="{ width: usagePct(dashboard.trainerProfile.clientsAdded, dashboard.limits.clients) + '%' }"
              />
            </div>
          </div>

          <!-- Products meter -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-gray-700">Products</span>
              <span class="text-gray-500">{{ dashboard.trainerProfile.productsListed }} / {{ dashboard.limits.products }}</span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                class="h-full rounded-full bg-purple-500 transition-all"
                :style="{ width: usagePct(dashboard.trainerProfile.productsListed, dashboard.limits.products) + '%' }"
              />
            </div>
          </div>
        </div>

        <p v-else-if="!dashboard.subscription" class="text-sm text-gray-400">
          Upgrade to a plan to unlock client capacity and product listings.
        </p>
      </section>

      <!-- Clients section -->
      <div v-if="dashboard.clients.length === 0" class="text-center py-24 text-gray-400">
        <p class="text-lg font-medium">No clients yet</p>
        <p class="text-sm mt-1">Clients will appear here once they're assigned to you.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <RouterLink
          v-for="client in dashboard.clients"
          :key="client._id"
          :to="`/trainer/client/${client._id}`"
          class="block text-left bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150"
        >
          <!-- Name + tier badge -->
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-semibold text-gray-900 truncate">{{ client.name }}</span>
            <span
              class="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ring-1"
              :class="tierConfig[client.currentTier].badge"
            >
              {{ tierConfig[client.currentTier].label }}
            </span>
          </div>

          <!-- City -->
          <p class="text-xs text-gray-400 mb-2">{{ client.city }}</p>

          <!-- Goal -->
          <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ client.goal }}</p>

          <!-- XP bar -->
          <div>
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <span>{{ client.currentXP.toLocaleString() }} XP</span>
              <span v-if="client.currentTier !== 'elite'">
                {{ tierMax[client.currentTier].toLocaleString() }}
              </span>
              <span v-else class="text-green-500 font-semibold">MAX</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="tierConfig[client.currentTier].bar"
                :style="{ width: xpProgress(client.currentXP, client.currentTier) + '%' }"
              />
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- Products panel -->
      <section class="mt-8 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">Products</h2>
          <button
            class="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            :class="showProductForm ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-purple-600 text-white hover:bg-purple-700'"
            @click="showProductForm = !showProductForm; addProductError = ''"
          >
            {{ showProductForm ? 'Cancel' : 'Add Product' }}
          </button>
        </div>

        <!-- Inline add form -->
        <form v-if="showProductForm" class="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200" @submit.prevent="submitProduct">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              v-model="productName"
              type="text"
              placeholder="Product name"
              required
              class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              v-model="productCategory"
              class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option v-for="(label, val) in CATEGORY_LABELS" :key="val" :value="val">{{ label }}</option>
            </select>
          </div>
          <textarea
            v-model="productDescription"
            placeholder="Description"
            rows="2"
            required
            class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div class="flex gap-3 items-center">
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">JOD</span>
              <input
                v-model.number="productPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                class="w-full pl-12 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <!-- Image upload -->
            <label class="flex-shrink-0 cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-purple-400 transition-colors text-sm text-gray-500">
              <img v-if="productImagePreview" :src="productImagePreview" class="w-7 h-7 rounded object-cover" alt="preview" />
              <span v-else class="text-gray-400">📷</span>
              <span>{{ productImagePreview ? 'Change' : 'Add image' }}</span>
              <input type="file" accept="image/*" class="sr-only" @change="onProductImageChange" />
            </label>
          </div>
          <p v-if="addProductError" class="text-sm text-red-600">{{ addProductError }}</p>
          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="isAddingProduct || !productName.trim() || !productDescription.trim() || productPrice === ''"
              class="py-2 px-5 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isAddingProduct ? 'Saving...' : 'Save Product' }}
            </button>
          </div>
        </form>

        <!-- Product list -->
        <div v-if="products === undefined" class="py-4 flex justify-center">
          <div class="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        </div>

        <p v-else-if="!products?.length" class="text-sm text-gray-400 text-center py-4">
          No products yet.
        </p>

        <ul v-else class="flex flex-col divide-y divide-gray-100">
          <li
            v-for="product in products"
            :key="product._id"
            class="flex items-center gap-3 py-3"
          >
            <!-- Thumbnail -->
            <div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-lg">
              <img v-if="product.imageUrl" :src="product.imageUrl" class="w-full h-full object-cover" alt="" />
              <span v-else>📦</span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{{ CATEGORY_LABELS[product.category] }}</span>
                <span class="text-xs font-semibold text-gray-700">{{ product.priceJod.toFixed(2) }} JOD</span>
              </div>
            </div>

            <!-- Active toggle -->
            <button
              :disabled="togglingProduct === product._id"
              class="shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40"
              :class="product.isActive ? 'bg-purple-600' : 'bg-gray-300'"
              :title="product.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'"
              @click="toggleProduct(product._id)"
            >
              <span
                class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                :class="product.isActive ? 'translate-x-4' : 'translate-x-1'"
              />
            </button>

            <!-- Delete -->
            <button
              :disabled="deletingProduct === product._id"
              class="shrink-0 text-xs px-2 py-1 rounded-lg text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
              @click="confirmDeleteProduct(product._id, product.name)"
            >
              {{ deletingProduct === product._id ? '...' : 'Delete' }}
            </button>
          </li>
        </ul>
      </section>

      <!-- Client Requests panel -->
      <section class="mt-8 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
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
      <section class="mt-4 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
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
          No free clients found.
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
    </template>
  </div>
</template>
