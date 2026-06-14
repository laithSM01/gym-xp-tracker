import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Existing tables ────────────────────────────────────────────────────────

  users: defineTable({
    tokenIdentifier: v.string(),
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.union(
      v.literal("trainer"),
      v.literal("client"),
      v.literal("nutritionist"),
      v.literal("gym_owner"),
    ),
    createdAt: v.optional(v.number()),
  }).index("by_token", ["tokenIdentifier"]),

  clients: defineTable({
    userId: v.id("users"),
    trainerId: v.optional(v.id("users")), // optional — gym-assigned clients may not have a trainer yet
    gymId: v.optional(v.id("gyms")),
    age: v.number(),
    goal: v.string(),
    height: v.number(),
    sportTypes: v.array(v.union(v.literal("gym"), v.literal("swimming"), v.literal("boxing"))),
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
    trainerId: v.id("users"),
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

  // ─── Marketplace tables ──────────────────────────────────────────────────────

  gyms: defineTable({
    ownerId: v.id("users"), // role === "gym_owner"
    name: v.string(),
    bio: v.optional(v.string()),
    location: v.string(),
    city: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
    coverPhotoStorageId: v.optional(v.id("_storage")),
    facilities: v.array(v.string()),
    priceRange: v.object({ min: v.number(), max: v.number() }),
    isActive: v.boolean(),
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
    isIndependent: v.boolean(),
    profilePhotoStorageId: v.optional(v.id("_storage")),
    coverPhotoStorageId: v.optional(v.id("_storage")),
    instagramHandle: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_isActive", ["isActive"]),

  subscriptions: defineTable({
    gymId: v.optional(v.id("gyms")),
    trainerProfileId: v.optional(v.id("personalTrainers")),
    plan: v.union(
      v.literal("trainer_solo"),
      v.literal("gym_starter"),
      v.literal("gym_pro"),
    ),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
    ),
    currentPeriodEnd: v.number(),
    aiGenerationsUsed: v.number(),
    aiGenerationsLimit: v.number(), // 50 | 200 | -1 = unlimited
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
    trainerProfileId: v.id("personalTrainers"),
    gymId: v.id("gyms"),
    affiliationRole: v.union(v.literal("trainer"), v.literal("head_trainer")),
    joinedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_trainerProfileId", ["trainerProfileId"])
    .index("by_gymId", ["gymId"])
    .index("by_gymId_and_isActive", ["gymId", "isActive"]),
});
