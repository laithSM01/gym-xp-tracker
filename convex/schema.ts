import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Core tables ─────────────────────────────────────────────────────────────

  users: defineTable({
    tokenIdentifier: v.string(),
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.union(
      v.literal("trainer"),      // personal trainer — independent, marketplace listing
      v.literal("gym_trainer"),  // gym staff — invited by gym owner, works within one gym
      v.literal("client"),
      v.literal("nutritionist"),
      v.literal("gym_owner"),
    ),
    createdAt: v.optional(v.number()),
  }).index("by_token", ["tokenIdentifier"]),

  clients: defineTable({
    userId: v.id("users"),
    trainerId: v.optional(v.id("users")), // set when a personal trainer adds this client
    gymId: v.optional(v.id("gyms")),      // set when a gym adds this client
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    goal: v.string(),
    height: v.number(),
    city: v.string(),
    sportTypes: v.array(v.union(
      v.literal("gym"),
      v.literal("swimming"),
      v.literal("boxing"),
      v.literal("football"),
      v.literal("running"),
      v.literal("crossfit"),
    )),
    preferredTrainingDays: v.union(
      v.literal("2-3"),
      v.literal("3-4"),
      v.literal("4-5"),
      v.literal("5-6"),
    ),
    healthConditions: v.array(v.string()),
    injuryNotes: v.optional(v.string()),
    isEnrolled: v.boolean(),
    currentXP: v.number(),
    currentTier: v.union(
      v.literal("beginner"),
      v.literal("novice"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("elite"),
    ),
    nutritionistAccess: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_trainerId", ["trainerId"])
    .index("by_gymId", ["gymId"])
    .index("by_city", ["city"])
    .index("by_trainerId_and_isEnrolled", ["trainerId", "isEnrolled"]),

  challenges: defineTable({
    title: v.string(),
    description: v.string(),
    xpReward: v.number(),
    assignedTo: v.id("clients"),
    assignedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("completed")),
    completedAt: v.optional(v.number()),
  })
    .index("by_assignedTo", ["assignedTo"])
    .index("by_assignedBy", ["assignedBy"])
    .index("by_assignedTo_and_status", ["assignedTo", "status"]),

  xpLogs: defineTable({
    clientId: v.id("clients"),
    amount: v.number(),
    reason: v.string(),
    awardedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_awardedBy", ["awardedBy"]),

  programs: defineTable({
    clientId: v.id("clients"),
    trainerId: v.id("users"),
    title: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    weeklySchedule: v.array(
      v.object({
        day: v.number(),
        type: v.string(),
        exercises: v.array(
          v.object({
            name: v.string(),
            sets: v.number(),
            reps: v.number(),
            notes: v.optional(v.string()),
          }),
        ),
      }),
    ),
    status: v.union(v.literal("active"), v.literal("completed")),
  })
    .index("by_clientId", ["clientId"])
    .index("by_trainerId", ["trainerId"])
    .index("by_clientId_and_status", ["clientId", "status"]),

  bodyMeasurements: defineTable({
    clientId: v.id("clients"),
    trainerId: v.optional(v.id("users")), // optional — clients log their own initial measurement
    weight: v.number(),
    bodyFat: v.number(),
    muscleMass: v.number(),
    notes: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_clientId", ["clientId"]),

  nutritionPlans: defineTable({
    clientId: v.id("clients"),
    nutritionistId: v.id("users"),
    meals: v.array(
      v.object({
        name: v.string(),
        calories: v.number(),
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
      }),
    ),
    totalCalories: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_nutritionistId", ["nutritionistId"]),

  // ─── Marketplace tables ───────────────────────────────────────────────────────

  gyms: defineTable({
    ownerId: v.id("users"), // role === "gym_owner"
    name: v.string(),
    bio: v.optional(v.string()),
    location: v.string(),
    city: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
    coverPhotoStorageId: v.optional(v.id("_storage")),
    genderType: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("mixed"))),
    openingHours: v.optional(v.object({
      weekdays: v.string(),
      weekends: v.string(),
      friday: v.optional(v.string()),
    })),
    genderSections: v.optional(v.array(v.object({
      gender: v.union(v.literal("male"), v.literal("female"), v.literal("mixed")),
      label: v.optional(v.string()),
      weekdays: v.optional(v.string()),
      weekends: v.optional(v.string()),
      friday: v.optional(v.string()),
    }))),
    classSchedules: v.optional(v.array(v.object({
      activity: v.string(),
      schedule: v.string(),
      instructor: v.optional(v.string()),
    }))),
    facilities: v.array(v.string()),
    pricingPlans: v.array(v.object({
      duration: v.union(
        v.literal("1_month"),
        v.literal("3_months"),
        v.literal("6_months"),
        v.literal("8_months"),
        v.literal("12_months"),
      ),
      priceJod: v.number(),
      label: v.optional(v.string()),
      isOffer: v.boolean(),
      offerExpiresAt: v.optional(v.number()),
    })),
    isActive: v.boolean(),
    // Lifetime usage counters — never decrement
    trainersUsed: v.number(),
    clientsAdded: v.number(),
    productsListed: v.number(),
    createdAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_city", ["city"])
    .index("by_isActive", ["isActive"]),

  personalTrainers: defineTable({
    userId: v.id("users"), // role === "trainer"
    bio: v.optional(v.string()),
    certifications: v.array(v.string()),
    specializations: v.array(v.string()),
    yearsOfExperience: v.optional(v.number()),
    profilePhotoStorageId: v.optional(v.id("_storage")),
    coverPhotoStorageId: v.optional(v.id("_storage")),
    instagramHandle: v.optional(v.string()),
    isActive: v.boolean(),
    // Lifetime usage counters — never decrement
    clientsAdded: v.number(),
    productsListed: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_isActive", ["isActive"]),

  subscriptions: defineTable({
    gymId: v.optional(v.id("gyms")),
    trainerProfileId: v.optional(v.id("personalTrainers")),
    plan: v.union(
      v.literal("personal_trainer"),
      v.literal("gym_small"),
      v.literal("gym_medium"),
      v.literal("gym_large"),
    ),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
    ),
    currentPeriodEnd: v.number(),
    aiGenerationsUsed: v.number(),
    aiGenerationsLimit: v.number(), // -1 = unlimited
    pricePaidJod: v.number(),
    createdAt: v.number(),
  })
    .index("by_gymId", ["gymId"])
    .index("by_trainerProfileId", ["trainerProfileId"]),

  products: defineTable({
    sellerGymId: v.optional(v.id("gyms")),
    sellerTrainerProfileId: v.optional(v.id("personalTrainers")),
    name: v.string(),
    description: v.string(),
    priceJod: v.number(),
    category: v.union(
      v.literal("supplement"),
      v.literal("equipment"),
      v.literal("food"),
      v.literal("digital_program"),
      v.literal("session"),
    ),
    imageStorageId: v.optional(v.id("_storage")),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_sellerGymId", ["sellerGymId"])
    .index("by_sellerTrainerProfileId", ["sellerTrainerProfileId"])
    .index("by_category", ["category"]),

  orders: defineTable({
    productId: v.id("products"),
    buyerUserId: v.id("users"),
    amountJod: v.number(),
    platformCutJod: v.number(),
    sellerAmountJod: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
    ),
    paymentGateway: v.union(v.literal("myfatoorah"), v.literal("cliq")),
    paymentRef: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_buyerUserId", ["buyerUserId"])
    .index("by_productId", ["productId"]),

  joinRequests: defineTable({
    clientUserId: v.id("users"),
    gymId: v.optional(v.id("gyms")),
    trainerProfileId: v.optional(v.id("personalTrainers")),
    initiatedBy: v.union(
      v.literal("client"),
      v.literal("gym"),
      v.literal("personal_trainer"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    message: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_clientUserId", ["clientUserId"])
    .index("by_gymId", ["gymId"])
    .index("by_trainerProfileId", ["trainerProfileId"])
    .index("by_gymId_and_status", ["gymId", "status"])
    .index("by_trainerProfileId_and_status", ["trainerProfileId", "status"]),

  trainerGymAffiliation: defineTable({
    gymTrainerUserId: v.id("users"), // role === "gym_trainer"
    gymId: v.id("gyms"),
    affiliationRole: v.union(v.literal("trainer"), v.literal("head_trainer")),
    inviteId: v.id("gymInvitations"),
    joinedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_gymTrainerUserId", ["gymTrainerUserId"])
    .index("by_gymId", ["gymId"])
    .index("by_gymId_and_isActive", ["gymId", "isActive"]),

  gymInvitations: defineTable({
    gymId: v.id("gyms"),
    invitedEmail: v.string(),
    invitedName: v.string(),
    inviteToken: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    acceptedByUserId: v.optional(v.id("users")),
  })
    .index("by_token", ["inviteToken"])
    .index("by_gymId", ["gymId"])
    .index("by_gymId_and_status", ["gymId", "status"])
    .index("by_email", ["invitedEmail"]),
});
