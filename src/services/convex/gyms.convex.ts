import { ref, onUnmounted } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { GymService, GymProfile, CreateGymInput } from '../gyms.service'

export class ConvexGymsService implements GymService {
  private client: ConvexClient

  constructor(client: ConvexClient) {
    this.client = client
  }

  getMyGym() {
    const gym = ref<GymProfile | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.gyms.getMyGym, {}, (data) => {
      gym.value = (data as GymProfile | null) ?? null
    })
    onUnmounted(() => unsub())
    return gym
  }

  async createGym(data: CreateGymInput): Promise<Id<'gyms'>> {
    return await this.client.mutation(api.gyms.createGym, data) as Id<'gyms'>
  }

  async generateUploadUrl(): Promise<string> {
    return await this.client.mutation(api.storage.generateUploadUrl, {}) as string
  }
}
