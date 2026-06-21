import { ref, onUnmounted } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { GymTrainerService, GymTrainerDashboardData } from '../gym-trainer.service'

export class ConvexGymTrainerService implements GymTrainerService {
  private client: ConvexClient

  constructor(client: ConvexClient) {
    this.client = client
  }

  getMyDashboard() {
    const data = ref<GymTrainerDashboardData | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.gymTrainers.getMyGymTrainerDashboard, {}, (result) => {
      data.value = (result as GymTrainerDashboardData | null) ?? null
    })
    onUnmounted(() => unsub())
    return data
  }

  async claimClient(clientId: Id<'clients'>): Promise<void> {
    await this.client.mutation(api.gymTrainers.claimGymClient, { clientId })
  }

  async unassignClient(clientId: Id<'clients'>): Promise<void> {
    await this.client.mutation(api.gymTrainers.unassignGymClient, { clientId })
  }
}
