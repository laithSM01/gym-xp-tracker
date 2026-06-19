import { ref, onUnmounted } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { Product, CreateProductInput, ProductsService } from '../products.service'

export class ConvexProductsService implements ProductsService {
  private client: ConvexClient

  constructor(client: ConvexClient) {
    this.client = client
  }

  listMyProducts() {
    const products = ref<Product[] | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.products.listMyProducts, {}, (data) => {
      products.value = (data as Product[] | null) ?? null
    })
    onUnmounted(() => unsub())
    return products
  }

  async generateUploadUrl(): Promise<string> {
    return await this.client.mutation(api.products.generateUploadUrl, {}) as string
  }

  async createProduct(data: CreateProductInput): Promise<void> {
    await this.client.mutation(api.products.createProduct, data)
  }

  async toggleProductActive(productId: Id<'products'>): Promise<void> {
    await this.client.mutation(api.products.toggleProductActive, { productId })
  }

  async deleteProduct(productId: Id<'products'>): Promise<void> {
    await this.client.mutation(api.products.deleteProduct, { productId })
  }
}
