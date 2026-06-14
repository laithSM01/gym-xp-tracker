import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { GymService } from '@/services/gyms.service'
import type { Id } from '../../convex/_generated/dataModel'

const FACILITY_OPTIONS = [
  'weights', 'cardio', 'pool', 'sauna', 'boxing',
  'crossfit', 'yoga', 'parking', 'locker rooms', 'personal training',
]

export function useGymSetup() {
  const gymsService = inject<GymService>('gymsService')!
  const router = useRouter()

  const name = ref('')
  const city = ref('')
  const location = ref('')
  const bio = ref('')
  const facilities = ref<string[]>([])
  const priceMin = ref<number | ''>('')
  const priceMax = ref<number | ''>('')
  const logoFile = ref<File | null>(null)
  const coverFile = ref<File | null>(null)
  const logoPreview = ref<string | null>(null)
  const coverPreview = ref<string | null>(null)

  const isSubmitting = ref(false)
  const submitError = ref('')

  const isFormValid = computed(() =>
    name.value.trim().length > 0 &&
    city.value.trim().length > 0 &&
    location.value.trim().length > 0 &&
    typeof priceMin.value === 'number' &&
    typeof priceMax.value === 'number' &&
    priceMin.value >= 0 &&
    priceMax.value >= priceMin.value
  )

  function toggleFacility(facility: string) {
    const idx = facilities.value.indexOf(facility)
    if (idx === -1) facilities.value.push(facility)
    else facilities.value.splice(idx, 1)
  }

  function onLogoChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    logoFile.value = file
    logoPreview.value = URL.createObjectURL(file)
  }

  function onCoverChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    coverFile.value = file
    coverPreview.value = URL.createObjectURL(file)
  }

  async function uploadFile(file: File): Promise<Id<'_storage'>> {
    const uploadUrl = await gymsService.generateUploadUrl()
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!res.ok) throw new Error('File upload failed')
    const { storageId } = await res.json() as { storageId: Id<'_storage'> }
    return storageId
  }

  async function submit() {
    if (!isFormValid.value) return
    isSubmitting.value = true
    submitError.value = ''
    try {
      let logoStorageId: Id<'_storage'> | undefined
      let coverStorageId: Id<'_storage'> | undefined

      if (logoFile.value) logoStorageId = await uploadFile(logoFile.value)
      if (coverFile.value) coverStorageId = await uploadFile(coverFile.value)

      await gymsService.createGym({
        name: name.value.trim(),
        bio: bio.value.trim() || undefined,
        location: location.value.trim(),
        city: city.value.trim(),
        facilities: facilities.value,
        priceRange: { min: priceMin.value as number, max: priceMax.value as number },
        logoStorageId,
        coverPhotoStorageId: coverStorageId,
      })

      router.push('/gym/dashboard')
    } catch (e: unknown) {
      submitError.value = e instanceof Error ? e.message : 'Something went wrong'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    name, city, location, bio, facilities, priceMin, priceMax,
    logoPreview, coverPreview,
    isSubmitting, submitError, isFormValid,
    facilityOptions: FACILITY_OPTIONS,
    toggleFacility, onLogoChange, onCoverChange, submit,
  }
}
