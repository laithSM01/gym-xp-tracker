<script setup lang="ts">
import { inject, ref } from 'vue'
import type { ProductsService, ProductCategory } from '@/services/products.service'
import type { Id } from '../../../convex/_generated/dataModel'

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
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-xl font-bold text-white">Products</h1>

    <section class="bg-ink-800 rounded-2xl border border-white/5 p-6 flex flex-col gap-5">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-white">All Products</h2>
        <button
          class="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          :class="showProductForm ? 'bg-white/5 text-ink-400 hover:bg-white/10' : 'bg-accent-500 text-white hover:bg-accent-600'"
          @click="showProductForm = !showProductForm; addProductError = ''"
        >
          {{ showProductForm ? 'Cancel' : 'Add Product' }}
        </button>
      </div>

      <!-- Inline add form -->
      <form v-if="showProductForm" class="flex flex-col gap-3 p-4 bg-ink-900 rounded-xl border border-white/5" @submit.prevent="submitProduct">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            v-model="productName"
            type="text"
            placeholder="Product name"
            required
            class="px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <select
            v-model="productCategory"
            class="px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <option v-for="(label, val) in CATEGORY_LABELS" :key="val" :value="val">{{ label }}</option>
          </select>
        </div>
        <textarea
          v-model="productDescription"
          placeholder="Description"
          rows="2"
          required
          class="px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
        />
        <div class="flex gap-3 items-center">
          <div class="relative flex-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">JOD</span>
            <input
              v-model.number="productPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
              class="w-full pl-12 pr-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <!-- Image upload -->
          <label class="flex-shrink-0 cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/10 hover:border-accent-500/50 transition-colors text-sm text-ink-400">
            <img v-if="productImagePreview" :src="productImagePreview" class="w-7 h-7 rounded object-cover" alt="preview" />
            <span v-else class="text-ink-400">📷</span>
            <span>{{ productImagePreview ? 'Change' : 'Add image' }}</span>
            <input type="file" accept="image/*" class="sr-only" @change="onProductImageChange" />
          </label>
        </div>
        <p v-if="addProductError" class="text-sm text-red-400">{{ addProductError }}</p>
        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="isAddingProduct || !productName.trim() || !productDescription.trim() || productPrice === ''"
            class="py-2 px-5 rounded-lg bg-accent-500 text-white font-semibold text-sm hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isAddingProduct ? 'Saving...' : 'Save Product' }}
          </button>
        </div>
      </form>

      <!-- Product list -->
      <div v-if="products === undefined" class="py-4 flex justify-center">
        <div class="w-5 h-5 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
      </div>

      <p v-else-if="!products?.length" class="text-sm text-ink-400 text-center py-4">
        No products yet.
      </p>

      <ul v-else class="flex flex-col divide-y divide-white/5">
        <li
          v-for="product in products"
          :key="product._id"
          class="flex items-center gap-3 py-3"
        >
          <!-- Thumbnail -->
          <div class="w-10 h-10 rounded-lg overflow-hidden bg-ink-900 flex-shrink-0 flex items-center justify-center text-lg">
            <img v-if="product.imageUrl" :src="product.imageUrl" class="w-full h-full object-cover" alt="" />
            <span v-else>📦</span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ product.name }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-ink-400 bg-white/5 px-1.5 py-0.5 rounded">{{ CATEGORY_LABELS[product.category] }}</span>
              <span class="text-xs font-semibold text-white/80">{{ product.priceJod.toFixed(2) }} JOD</span>
            </div>
          </div>

          <!-- Active toggle -->
          <button
            :disabled="togglingProduct === product._id"
            class="shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40"
            :class="product.isActive ? 'bg-accent-500' : 'bg-white/10'"
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
            class="shrink-0 text-xs px-2 py-1 rounded-lg text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors disabled:opacity-40"
            @click="confirmDeleteProduct(product._id, product.name)"
          >
            {{ deletingProduct === product._id ? '...' : 'Delete' }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
