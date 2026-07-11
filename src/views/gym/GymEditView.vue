<script setup lang="ts">
import { useGymEdit } from '@/composables/useGymEdit'

const {
  gym,
  name, city, location, bio,
  genderSections, classSchedules,
  facilities, pricingPlans, draftPlan, isDraftValid,
  logoPreview, coverPreview,
  isSubmitting, submitError, isFormValid,
  facilityOptions, durationOptions,
  toggleFacility,
  addPricingPlan, removePricingPlan,
  addGenderSection, removeGenderSection,
  addClassSchedule, removeClassSchedule,
  onLogoChange, onCoverChange, save,
} = useGymEdit()

const DURATION_LABELS: Record<string, string> = {
  '1_month': '1 Month',
  '3_months': '3 Months',
  '6_months': '6 Months',
  '8_months': '8 Months',
  '12_months': '12 Months',
}

const GENDER_OPTIONS = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'male', label: 'Male Only' },
  { value: 'female', label: 'Female Only' },
]
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-8">
      <h1 class="text-xl font-bold text-white">Edit gym profile</h1>
      <p class="text-ink-400 text-sm mt-1">Changes are visible immediately on your public page.</p>
    </div>

    <div v-if="gym === undefined" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-4 border-accent-500/20 border-t-accent-500 rounded-full animate-spin" />
    </div>

    <form v-else @submit.prevent="save" class="flex flex-col gap-6">

      <!-- Gym name -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-ink-400">Gym name <span class="text-red-400">*</span></label>
        <input
          v-model="name"
          type="text"
          placeholder="e.g. Iron House Gym"
          class="px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      <!-- City + Location -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-400">City <span class="text-red-400">*</span></label>
          <input
            v-model="city"
            type="text"
            placeholder="e.g. Amman"
            class="px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-400">Address <span class="text-red-400">*</span></label>
          <input
            v-model="location"
            type="text"
            placeholder="e.g. Sweifieh, 3rd Circle"
            class="px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
      </div>

      <!-- Bio -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-ink-400">About your gym <span class="text-ink-400/70">(optional)</span></label>
        <textarea
          v-model="bio"
          rows="3"
          placeholder="Tell clients what makes your gym special..."
          class="px-3 py-2 rounded-lg bg-ink-800 border border-white/10 text-sm text-white placeholder:text-ink-400 resize-none focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      <!-- Gender sections -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-ink-400">Gender & Hours</label>
            <p class="text-xs text-ink-400/70 mt-0.5">One section per area — e.g. Mixed floor + Ladies section</p>
          </div>
          <button
            type="button"
            @click="addGenderSection"
            class="text-xs px-3 py-1.5 rounded-lg border border-accent-500/30 text-accent-500 hover:bg-accent-500/10 transition-colors font-medium"
          >
            + Add section
          </button>
        </div>

        <div
          v-for="(section, idx) in genderSections"
          :key="idx"
          class="border border-white/5 rounded-xl p-4 flex flex-col gap-3 bg-ink-800"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-ink-400 uppercase tracking-wide">
              {{ genderSections.length > 1 ? `Section ${idx + 1}` : 'Gym hours' }}
            </span>
            <button
              v-if="genderSections.length > 1"
              type="button"
              @click="removeGenderSection(idx)"
              class="text-ink-400 hover:text-red-400 transition-colors text-lg leading-none"
            >
              &times;
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-ink-400">Gender</span>
              <select
                v-model="section.gender"
                class="px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option v-for="opt in GENDER_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-ink-400">Label <span class="text-ink-400/70">(optional)</span></span>
              <input
                v-model="section.label"
                type="text"
                placeholder="e.g. Ladies Floor, Main Area"
                class="px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-3">
              <span class="text-xs text-ink-400 w-20 shrink-0">Weekdays</span>
              <input
                v-model="section.weekdays"
                type="text"
                placeholder="e.g. 6:00 AM – 11:00 PM"
                class="flex-1 px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-ink-400 w-20 shrink-0">Weekends</span>
              <input
                v-model="section.weekends"
                type="text"
                placeholder="e.g. 8:00 AM – 10:00 PM"
                class="flex-1 px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-ink-400 w-20 shrink-0">Friday</span>
              <input
                v-model="section.friday"
                type="text"
                placeholder="e.g. 2:00 PM – 10:00 PM"
                class="flex-1 px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Facilities -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-ink-400">Facilities</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="f in facilityOptions"
            :key="f"
            type="button"
            @click="toggleFacility(f)"
            class="text-xs px-3 py-1.5 rounded-full border transition-colors capitalize"
            :class="facilities.includes(f)
              ? 'bg-accent-500 text-white border-accent-500'
              : 'bg-ink-800 text-ink-400 border-white/10 hover:border-accent-500/50'"
          >
            {{ f }}
          </button>
        </div>
      </div>

      <!-- Class schedules -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-ink-400">Class Schedules <span class="text-ink-400/70">(optional)</span></label>
            <p class="text-xs text-ink-400/70 mt-0.5">Cardio, boxing, swimming — days and times each class runs</p>
          </div>
          <button
            type="button"
            @click="addClassSchedule"
            class="text-xs px-3 py-1.5 rounded-lg border border-accent-500/30 text-accent-500 hover:bg-accent-500/10 transition-colors font-medium"
          >
            + Add class
          </button>
        </div>

        <div
          v-for="(cls, idx) in classSchedules"
          :key="idx"
          class="border border-white/5 rounded-xl p-4 flex flex-col gap-3 bg-ink-800"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-ink-400 uppercase tracking-wide">Class {{ idx + 1 }}</span>
            <button
              type="button"
              @click="removeClassSchedule(idx)"
              class="text-ink-400 hover:text-red-400 transition-colors text-lg leading-none"
            >
              &times;
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-ink-400">Activity</span>
              <input
                v-model="cls.activity"
                type="text"
                placeholder="e.g. Cardio, Boxing, Swimming"
                class="px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-ink-400">Instructor <span class="text-ink-400/70">(optional)</span></span>
              <input
                v-model="cls.instructor"
                type="text"
                placeholder="e.g. Coach Ahmed"
                class="px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs text-ink-400">Schedule</span>
            <input
              v-model="cls.schedule"
              type="text"
              placeholder="e.g. Mon, Wed, Fri · 7:00 AM – 8:00 AM"
              class="px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </div>
      </div>

      <!-- Pricing plans -->
      <div class="flex flex-col gap-3">
        <div>
          <label class="text-sm font-medium text-ink-400">Membership Prices</label>
          <p class="text-xs text-ink-400/70 mt-0.5">Add plans for each duration you offer. Use the package field for bundles like "Gym + Swimming".</p>
        </div>

        <!-- Draft plan row -->
        <div class="border border-white/5 rounded-xl p-4 flex flex-col gap-3 bg-ink-800">
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-ink-400">Duration</span>
              <select
                v-model="draftPlan.duration"
                class="px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-ink-400">Price (JOD)</span>
              <input
                v-model.number="draftPlan.priceJod"
                type="number"
                min="1"
                placeholder="e.g. 25"
                class="px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-xs text-ink-400">Package <span class="text-ink-400/70">(optional)</span></span>
              <input
                v-model="draftPlan.label"
                type="text"
                placeholder="e.g. Gym + Swimming, Gym + Boxing"
                class="px-2 py-1.5 rounded-lg bg-ink-900 border border-white/10 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          <div class="flex items-center gap-4 flex-wrap">
            <label class="flex items-center gap-2 cursor-pointer text-sm text-ink-400">
              <input v-model="draftPlan.isOffer" type="checkbox" class="rounded accent-accent-500" />
              Mark as offer
            </label>
            <div v-if="draftPlan.isOffer" class="flex items-center gap-2">
              <span class="text-xs text-ink-400">Offer expires</span>
              <input
                v-model="draftPlan.offerExpiresAt"
                type="date"
                class="px-2 py-1 rounded-lg bg-ink-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              :disabled="!isDraftValid"
              @click="addPricingPlan"
              class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Add plan
            </button>
            <span v-if="pricingPlans.length > 0 && !isDraftValid" class="text-xs text-ink-400/70">
              Enter a price above to add another plan
            </span>
          </div>
        </div>

        <!-- Added plans -->
        <div v-if="pricingPlans.length > 0" class="flex flex-col gap-2">
          <div
            v-for="(plan, i) in pricingPlans"
            :key="i"
            class="flex items-center justify-between px-4 py-2.5 rounded-lg border border-white/5 bg-ink-800 text-sm"
          >
            <div class="flex items-center gap-3 flex-wrap">
              <span class="font-medium text-white">{{ DURATION_LABELS[plan.duration] }}</span>
              <span class="text-accent-500 font-semibold">{{ plan.priceJod }} JOD</span>
              <span v-if="plan.label" class="text-xs text-ink-400 bg-white/5 px-2 py-0.5 rounded-full">{{ plan.label }}</span>
              <span v-if="plan.isOffer" class="text-xs px-1.5 py-0.5 rounded-full bg-accent-500/15 text-accent-500 font-medium">Offer</span>
            </div>
            <button
              type="button"
              @click="removePricingPlan(i)"
              class="text-ink-400 hover:text-red-400 transition-colors text-lg leading-none ml-2 shrink-0"
            >
              &times;
            </button>
          </div>
        </div>

        <p v-else class="text-xs text-ink-400/70">No plans yet — add your first membership plan above.</p>
      </div>

      <!-- Logo upload -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-ink-400">Logo <span class="text-ink-400/70">(change)</span></label>
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-ink-800">
            <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" />
            <span v-else class="text-2xl">🏋️</span>
          </div>
          <label class="cursor-pointer text-sm text-accent-500 font-medium hover:text-accent-600">
            Choose file
            <input type="file" accept="image/*" class="hidden" @change="onLogoChange" />
          </label>
        </div>
      </div>

      <!-- Cover photo -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-ink-400">Cover photo <span class="text-ink-400/70">(change)</span></label>
        <label class="relative w-full h-32 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden bg-ink-800 cursor-pointer group">
          <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover" />
          <span v-else class="text-sm text-accent-500 font-medium group-hover:text-accent-600">Choose cover photo</span>
          <span v-if="coverPreview" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">
            Change photo
          </span>
          <input type="file" accept="image/*" class="hidden" @change="onCoverChange" />
        </label>
      </div>

      <!-- Error -->
      <p v-if="submitError" class="text-sm text-red-400">{{ submitError }}</p>

      <!-- Actions -->
      <div class="flex gap-3">
        <RouterLink
          to="/gym/dashboard"
          class="px-5 py-2.5 rounded-lg border border-white/10 text-ink-400 text-sm font-medium hover:bg-white/5 transition-colors"
        >
          Cancel
        </RouterLink>
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="flex-1 py-2.5 px-6 rounded-lg bg-accent-500 text-white font-semibold text-sm transition-colors hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Saving...' : 'Save changes' }}
        </button>
      </div>

    </form>
  </div>
</template>
