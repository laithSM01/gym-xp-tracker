import { ref, onUnmounted } from 'vue'
import type { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { StarterProgram, StarterProgramsService } from '../starterPrograms.service'

export class ConvexStarterProgramsService implements StarterProgramsService {
  private client: ConvexClient

  constructor(client: ConvexClient) {
    this.client = client
  }

  getStarterProgram() {
    const program = ref<StarterProgram | null | undefined>(undefined)
    const unsub = this.client.onUpdate(api.starterPrograms.getStarterProgram, {}, (data) => {
      program.value = (data as StarterProgram | null) ?? null
    })
    onUnmounted(() => unsub())
    return program
  }
}
