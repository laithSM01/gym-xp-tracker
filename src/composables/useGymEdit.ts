import { ref, computed, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import type { GymService, PricingPlan, PricingPlanDuration, GenderSection, ClassSchedule } from '@/services/gyms.service'
import type { Id } from '../../convex/_generated/dataModel'
import { FACILITY_OPTIONS, DURATION_OPTIONS } from './useGymSetup'

function blankSection(): GenderSection & { weekdays: string; weekends: string; friday: string } {
  return { gender: 'mixed', label: '', weekdays: '', weekends: '', friday: '' }
}

function blankSchedule(): ClassSchedule & { instructor: string } {
  return { activity: '', schedule: '', instructor: '' }
}

export function useGymEdit() {
  const gymsService = inject<GymService>('gymsService')!
  const router = useRouter()

  const gym = gymsService.getMyGym()

  const name = ref('')
  const city = ref('')
  const location = ref('')
  const bio = ref('')
  const genderSections = ref([blankSection()])
  const classSchedules = ref<Array<ClassSchedule & { instructor: string }>>([])
  const facilities = ref<string[]>([])
  const pricingPlans = ref<PricingPlan[]>([])
  const draftPlan = ref({
    duration: '1_month' as PricingPlanDuration,
    priceJod: '' as number | '',
    label: '',
    isOffer: false,
    offerExpiresAt: '',
  })
  const isDraftValid = computed(
    () => typeof draftPlan.value.priceJod === 'number' && draftPlan.value.priceJod > 0,
  )
  const logoFile = ref<File | null>(null)
  const coverFile = ref<File | null>(null)
  const logoPreview = ref<string | null>(null)
  const coverPreview = ref<string | null>(null)
  const isSubmitting = ref(false)
  const submitError = ref('')
  const populated = ref(false)

  watch(
    gym,
    (g) => {
      if (!g || populated.value) return
      populated.value = true
      name.value = g.name
      city.value = g.city
      location.value = g.location
      bio.value = g.bio ?? ''
      facilities.value = [...g.facilities]
      pricingPlans.value = [...g.pricingPlans]

      if (g.genderSections && g.genderSections.length > 0) {
        genderSections.value = g.genderSections.map((s) => ({
          gender: s.gender,
          label: s.label ?? '',
          weekdays: s.weekdays ?? '',
          weekends: s.weekends ?? '',
          friday: s.friday ?? '',
        }))
      } else {
        // Migrate from old simple genderType + openingHours format
        genderSections.value = [{
          gender: g.genderType ?? 'mixed',
          label: '',
          weekdays: g.openingHours?.weekdays ?? '',
          weekends: g.openingHours?.weekends ?? '',
          friday: g.openingHours?.friday ?? '',
        }]
      }

      classSchedules.value = (g.classSchedules ?? []).map((c) => ({
        activity: c.activity,
        schedule: c.schedule,
        instructor: c.instructor ?? '',
      }))
    },
    { immediate: true },
  )

  const isFormValid = computed(
    () =>
      name.value.trim().length > 0 &&
      city.value.trim().length > 0 &&
      location.value.trim().length > 0,
  )

  function toggleFacility(facility: string) {
    const idx = facilities.value.indexOf(facility)
    if (idx === -1) facilities.value.push(facility)
    else facilities.value.splice(idx, 1)
  }

  function addPricingPlan() {
    if (!isDraftValid.value) return
    pricingPlans.value.push({
      duration: draftPlan.value.duration,
      priceJod: draftPlan.value.priceJod as number,
      label: draftPlan.value.label.trim() || undefined,
      isOffer: draftPlan.value.isOffer,
      offerExpiresAt:
        draftPlan.value.isOffer && draftPlan.value.offerExpiresAt
          ? new Date(draftPlan.value.offerExpiresAt).getTime()
          : undefined,
    })
    draftPlan.value = { duration: '1_month', priceJod: '', label: '', isOffer: false, offerExpiresAt: '' }
  }

  function removePricingPlan(index: number) {
    pricingPlans.value.splice(index, 1)
  }

  function addGenderSection() {
    genderSections.value.push(blankSection())
  }

  function removeGenderSection(idx: number) {
    if (genderSections.value.length > 1) genderSections.value.splice(idx, 1)
  }

  function addClassSchedule() {
    classSchedules.value.push(blankSchedule())
  }

  function removeClassSchedule(idx: number) {
    classSchedules.value.splice(idx, 1)
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
    const { storageId } = (await res.json()) as { storageId: Id<'_storage'> }
    return storageId
  }

  async function save() {
    if (!isFormValid.value) return
    isSubmitting.value = true
    submitError.value = ''
    try {
      let logoStorageId: Id<'_storage'> | undefined
      let coverStorageId: Id<'_storage'> | undefined

      if (logoFile.value) logoStorageId = await uploadFile(logoFile.value)
      if (coverFile.value) coverStorageId = await uploadFile(coverFile.value)

      const sections: GenderSection[] = genderSections.value.map((s) => ({
        gender: s.gender,
        label: s.label?.trim() || undefined,
        weekdays: s.weekdays?.trim() || undefined,
        weekends: s.weekends?.trim() || undefined,
        friday: s.friday?.trim() || undefined,
      }))

      const schedules: ClassSchedule[] = classSchedules.value
        .filter((c) => c.activity.trim() && c.schedule.trim())
        .map((c) => ({
          activity: c.activity.trim(),
          schedule: c.schedule.trim(),
          instructor: c.instructor?.trim() || undefined,
        }))

      await gymsService.updateGym({
        name: name.value.trim(),
        bio: bio.value.trim() || undefined,
        location: location.value.trim(),
        city: city.value.trim(),
        genderSections: sections,
        classSchedules: schedules.length ? schedules : undefined,
        facilities: facilities.value,
        pricingPlans: pricingPlans.value,
        ...(logoStorageId ? { logoStorageId } : {}),
        ...(coverStorageId ? { coverPhotoStorageId: coverStorageId } : {}),
      })

      router.push('/gym/dashboard')
    } catch (e: unknown) {
      submitError.value = e instanceof Error ? e.message : 'Something went wrong'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    gym,
    name, city, location, bio,
    genderSections, classSchedules,
    facilities, pricingPlans, draftPlan, isDraftValid,
    logoPreview, coverPreview,
    isSubmitting, submitError, isFormValid,
    facilityOptions: FACILITY_OPTIONS,
    durationOptions: DURATION_OPTIONS,
    toggleFacility,
    addPricingPlan, removePricingPlan,
    addGenderSection, removeGenderSection,
    addClassSchedule, removeClassSchedule,
    onLogoChange, onCoverChange, save,
  }
}
