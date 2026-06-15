import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Dev-only helper — creates a test subscription for a gym.
// Run from the Convex dashboard: Functions → devHelpers:seedGymSubscription
export const seedGymSubscription = mutation({
  args: {
    gymId: v.id("gyms"),
    plan: v.optional(
      v.union(
        v.literal("gym_small"),
        v.literal("gym_medium"),
        v.literal("gym_large"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_gymId", (q) => q.eq("gymId", args.gymId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { status: "active" });
      return { action: "reactivated", subscriptionId: existing._id };
    }

    const now = Date.now();
    const id = await ctx.db.insert("subscriptions", {
      gymId: args.gymId,
      plan: args.plan ?? "gym_small",
      status: "active",
      currentPeriodEnd: now + 365 * 24 * 60 * 60 * 1000, // 1 year
      aiGenerationsUsed: 0,
      aiGenerationsLimit: -1,
      pricePaidJod: 0,
      createdAt: now,
    });

    return { action: "created", subscriptionId: id };
  },
});
