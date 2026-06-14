import { ref, onUnmounted } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { TrainerService, TrainerProfile, CreateTrainerInput } from '../trainers.service'

export class ConvexTrainersService implements TrainerService {
  private client: ConvexClient

  constructor(client: ConvexClient) {
    this.client = client
  }

  getMyTrainerProfile() {
    const profile = ref<TrainerProfile | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.personalTrainers.getMyTrainerProfile, {}, (data) => {
      profile.value = (data as TrainerProfile | null) ?? null
    })
    onUnmounted(() => unsub())
    return profile
  }

  async createTrainerProfile(data: CreateTrainerInput): Promise<Id<'personalTrainers'>> {
    return await this.client.mutation(api.personalTrainers.createTrainerProfile, data) as Id<'personalTrainers'>
  }

  async generateUploadUrl(): Promise<string> {
    return await this.client.mutation(api.storage.generateUploadUrl, {}) as string
  }
}
