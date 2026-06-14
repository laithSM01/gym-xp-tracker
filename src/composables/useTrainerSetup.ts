import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { TrainerService } from '@/services/trainers.service'
import type { Id } from '../../convex/_generated/dataModel'

export function useTrainerSetup() {
  const trainersService = inject<TrainerService>('trainersService')!
  const router = useRouter()

  const bio = ref('')
  const certifications = ref<string[]>([])
  const certInput = ref('')
  const specializations = ref<string[]>([])
  const specInput = ref('')
  const yearsOfExperience = ref<number | ''>('')
  const instagramHandle = ref('')
  const profileFile = ref<File | null>(null)
  const coverFile = ref<File | null>(null)
  const profilePreview = ref<string | null>(null)
  const coverPreview = ref<string | null>(null)

  const isSubmitting = ref(false)
  const submitError = ref('')

  const isFormValid = computed(() => specializations.value.length > 0)

  function addCertification() {
    const val = certInput.value.trim()
    if (val && !certifications.value.includes(val)) certifications.value.push(val)
    certInput.value = ''
  }

  function removeCertification(cert: string) {
    certifications.value = certifications.value.filter((c) => c !== cert)
  }

  function addSpecialization() {
    const val = specInput.value.trim()
    if (val && !specializations.value.includes(val)) specializations.value.push(val)
    specInput.value = ''
  }

  function removeSpecialization(spec: string) {
    specializations.value = specializations.value.filter((s) => s !== spec)
  }

  function onProfileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    profileFile.value = file
    profilePreview.value = URL.createObjectURL(file)
  }

  function onCoverChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    coverFile.value = file
    coverPreview.value = URL.createObjectURL(file)
  }

  async function uploadFile(file: File): Promise<Id<'_storage'>> {
    const uploadUrl = await trainersService.generateUploadUrl()
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
      let profilePhotoStorageId: Id<'_storage'> | undefined
      let coverPhotoStorageId: Id<'_storage'> | undefined

      if (profileFile.value) profilePhotoStorageId = await uploadFile(profileFile.value)
      if (coverFile.value) coverPhotoStorageId = await uploadFile(coverFile.value)

      await trainersService.createTrainerProfile({
        bio: bio.value.trim() || undefined,
        certifications: certifications.value,
        specializations: specializations.value,
        yearsOfExperience: yearsOfExperience.value !== '' ? yearsOfExperience.value : undefined,
        instagramHandle: instagramHandle.value.trim() || undefined,
        profilePhotoStorageId,
        coverPhotoStorageId,
      })

      router.push('/trainer/dashboard')
    } catch (e: unknown) {
      submitError.value = e instanceof Error ? e.message : 'Something went wrong'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    bio, certifications, certInput, specializations, specInput,
    yearsOfExperience, instagramHandle,
    profilePreview, coverPreview,
    isSubmitting, submitError, isFormValid,
    addCertification, removeCertification,
    addSpecialization, removeSpecialization,
    onProfileChange, onCoverChange, submit,
  }
}
