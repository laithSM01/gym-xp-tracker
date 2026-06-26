import { ref, computed, inject } from 'vue'
import type { GymService } from '@/services/gyms.service'
import type { TrainerService } from '@/services/trainers.service'

export function useLandingPage() {
  const gymsService = inject<GymService>('gymsService')!
  const trainersService = inject<TrainerService>('trainersService')!

  const allGyms = gymsService.listPublic()
  const allTrainers = trainersService.listPublic()

  const search = ref('')
  const selectedCity = ref('all')
  const activeTab = ref<'all' | 'gyms' | 'trainers'>('all')

  const filteredGyms = computed(() => {
    if (activeTab.value === 'trainers') return []
    const q = search.value.toLowerCase()
    return allGyms.value.filter((g) => {
      if (selectedCity.value !== 'all' && g.city !== selectedCity.value) return false
      if (q && !g.name.toLowerCase().includes(q) && !g.city.toLowerCase().includes(q)) return false
      return true
    })
  })

  const filteredTrainers = computed(() => {
    if (activeTab.value === 'gyms') return []
    const q = search.value.toLowerCase()
    return allTrainers.value.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q)) return false
      return true
    })
  })

  return { filteredGyms, filteredTrainers, search, selectedCity, activeTab }
}
