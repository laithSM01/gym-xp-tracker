import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getNutritionPlan = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const caller = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!caller) return null;

    const client = await ctx.db.get(args.clientId);
    if (!client) return null;

    const isClient = client.userId === caller._id;
    const isTrainer = client.trainerId === caller._id;
    const isNutritionist =
      caller.role === "nutritionist" && client.nutritionistAccess === true;

    if (!isClient && !isTrainer && !isNutritionist) return null;

    return await ctx.db
      .query("nutritionPlans")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .first();
  },
});

export const upsertNutritionPlan = mutation({
  args: {
    clientId: v.id("clients"),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const nutritionist = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!nutritionist) throw new Error("User not found");
    if (nutritionist.role !== "nutritionist")
      throw new Error("Only nutritionists can save nutrition plans");

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");
    if (!client.nutritionistAccess)
      throw new Error("Nutritionist access not granted for this client");

    const existing = await ctx.db
      .query("nutritionPlans")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        nutritionistId: nutritionist._id,
        meals: args.meals,
        totalCalories: args.totalCalories,
        notes: args.notes,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("nutritionPlans", {
        clientId: args.clientId,
        nutritionistId: nutritionist._id,
        meals: args.meals,
        totalCalories: args.totalCalories,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
