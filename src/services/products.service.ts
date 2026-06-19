import type { Ref } from 'vue'
import type { Id } from '../../convex/_generated/dataModel'

export type ProductCategory = 'supplement' | 'equipment' | 'food' | 'digital_program' | 'session'

export interface Product {
  _id: Id<'products'>
  name: string
  description: string
  priceJod: number
  category: ProductCategory
  isActive: boolean
  imageUrl: string | null
  createdAt: number
}

export interface CreateProductInput {
  name: string
  description: string
  priceJod: number
  category: ProductCategory
  imageStorageId?: Id<'_storage'>
}

export interface ProductsService {
  listMyProducts(): Ref<Product[] | null | undefined>
  generateUploadUrl(): Promise<string>
  createProduct(data: CreateProductInput): Promise<void>
  toggleProductActive(productId: Id<'products'>): Promise<void>
  deleteProduct(productId: Id<'products'>): Promise<void>
}
