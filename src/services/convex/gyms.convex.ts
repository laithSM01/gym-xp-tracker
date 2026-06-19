import { ref, onUnmounted } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { GymService, GymProfile, CreateGymInput, GymDashboardData } from '../gyms.service'

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

  getGymDashboard() {
    const dashboard = ref<GymDashboardData | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.gyms.getGymDashboard, {}, (data) => {
      dashboard.value = (data as GymDashboardData | null) ?? null
    })
    onUnmounted(() => unsub())
    return dashboard
  }

  listPublic() {
    const gyms = ref<GymProfile[]>([])
    const unsub = this.client.onUpdate(api.gyms.listPublic, {}, (data) => {
      gyms.value = (data as GymProfile[]) ?? []
    })
    onUnmounted(() => unsub())
    return gyms
  }

  async createGym(data: CreateGymInput): Promise<Id<'gyms'>> {
    return await this.client.mutation(api.gyms.createGym, data) as Id<'gyms'>
  }

  async generateUploadUrl(): Promise<string> {
    return await this.client.mutation(api.storage.generateUploadUrl, {}) as string
  }
}
