import { ref, onUnmounted } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type {
  TrainerService,
  TrainerProfile,
  TrainerPublicProfile,
  CreateTrainerInput,
  TrainerDashboardData,
  TrainerPublicPageData,
} from '../trainers.service'

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

  getTrainerDashboard() {
    const dashboard = ref<TrainerDashboardData | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.personalTrainers.getTrainerDashboard, {}, (data) => {
      dashboard.value = (data as TrainerDashboardData | null) ?? null
    })
    onUnmounted(() => unsub())
    return dashboard
  }

  listPublic() {
    const trainers = ref<TrainerPublicProfile[]>([])
    const unsub = this.client.onUpdate(api.personalTrainers.listPublic, {}, (data) => {
      trainers.value = (data as TrainerPublicProfile[]) ?? []
    })
    onUnmounted(() => unsub())
    return trainers
  }

  getTrainerPublicPage(trainerProfileId: Id<'personalTrainers'>) {
    const page = ref<TrainerPublicPageData | null | undefined>(undefined)
    const unsub = this.client.onUpdate(
      api.personalTrainers.getTrainerPublicPage,
      { trainerProfileId },
      (data) => {
        page.value = (data as TrainerPublicPageData | null) ?? null
      },
    )
    onUnmounted(() => unsub())
    return page
  }

  async createTrainerProfile(data: CreateTrainerInput): Promise<Id<'personalTrainers'>> {
    return await this.client.mutation(api.personalTrainers.createTrainerProfile, data) as Id<'personalTrainers'>
  }

  async generateUploadUrl(): Promise<string> {
    return await this.client.mutation(api.storage.generateUploadUrl, {}) as string
  }
}
