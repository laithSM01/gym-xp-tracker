import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.union(
      v.literal("trainer"),
      v.literal("client"),
      v.literal("nutritionist"),
    ),
    createdAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerkId", ["clerkId"]),

  clients: defineTable({
    userId: v.id("users"),
    trainerId: v.id("users"),
    age: v.number(),
    goal: v.string(),
    isEnrolled: v.boolean(),
    currentXP: v.number(),
    currentTier: v.union(
      v.literal("beginner"),
      v.literal("novice"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("elite"),
    ),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_trainerId", ["trainerId"])
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
    exercises: v.array(
      v.object({
        name: v.string(),
        sets: v.number(),
        reps: v.number(),
        notes: v.optional(v.string()),
      }),
    ),
    status: v.union(v.literal("active"), v.literal("completed")),
  })
    .index("by_clientId", ["clientId"])
    .index("by_trainerId", ["trainerId"])
    .index("by_clientId_and_status", ["clientId", "status"]),

  nutritionPlans: defineTable({
    clientId: v.id("clients"),
    nutritionistId: v.id("users"),
    tier: v.string(),
    meals: v.array(
      v.object({
        name: v.string(),
        foods: v.array(v.string()),
        calories: v.number(),
        time: v.optional(v.string()),
      }),
    ),
    calories: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_nutritionistId", ["nutritionistId"]),
});
