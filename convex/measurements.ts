import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

type Tier = "beginner" | "novice" | "intermediate" | "advanced" | "elite";

function tierFromXP(xp: number): Tier {
  if (xp >= 3000) return "elite";
  if (xp >= 2000) return "advanced";
  if (xp >= 1000) return "intermediate";
  if (xp >= 500) return "novice";
  return "beginner";
}

export const logMeasurement = mutation({
  args: {
    clientId: v.id("clients"),
    weight: v.number(),
    bodyFat: v.number(),
    muscleMass: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const trainer = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!trainer) throw new Error("Trainer not found");

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Get last measurement for comparison
    const lastMeasurement = await ctx.db
      .query("bodyMeasurements")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .first();

    let xpEarned = 0;
    const reasons: string[] = [];

    if (lastMeasurement) {
      // Body fat: -50 XP per 0.1% increase, +50 XP per 0.1% decrease
      const fatDiff = lastMeasurement.bodyFat - args.bodyFat;
      if (fatDiff !== 0) {
        const fatXP = Math.round((fatDiff / 0.1) * 50);
        xpEarned += fatXP;
        reasons.push(
          fatXP >= 0
            ? `Body fat ↓${fatDiff.toFixed(1)}% +${fatXP} XP`
            : `Body fat ↑${(-fatDiff).toFixed(1)}% ${fatXP} XP`,
        );
      }

      // Muscle mass: -40 XP per 0.1kg decrease, +40 XP per 0.1kg increase
      const muscleDiff = args.muscleMass - lastMeasurement.muscleMass;
      if (muscleDiff !== 0) {
        const muscleXP = Math.round((muscleDiff / 0.1) * 40);
        xpEarned += muscleXP;
        reasons.push(
          muscleXP >= 0
            ? `Muscle ↑${muscleDiff.toFixed(1)}kg +${muscleXP} XP`
            : `Muscle ↓${(-muscleDiff).toFixed(1)}kg ${muscleXP} XP`,
        );
      }
    }

    // Save measurement
    await ctx.db.insert("bodyMeasurements", {
      clientId: args.clientId,
      trainerId: trainer._id,
      weight: args.weight,
      bodyFat: args.bodyFat,
      muscleMass: args.muscleMass,
      notes: args.notes,
      timestamp: Date.now(),
    });

    // Total XP floors at 0
    const newXP = Math.max(0, client.currentXP + xpEarned);
    const newTier = tierFromXP(newXP);
    await ctx.db.patch(args.clientId, { currentXP: newXP, currentTier: newTier });

    // Create XP log entry
    await ctx.db.insert("xpLogs", {
      clientId: args.clientId,
      amount: xpEarned,
      reason: reasons.join(" | "),
      awardedBy: trainer._id,
      createdAt: Date.now(),
    });

    return { xpEarned, reasons };
  },
});

export const getMyMeasurements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return null;

    const client = await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!client) return null;

    return await ctx.db
      .query("bodyMeasurements")
      .withIndex("by_clientId", (q) => q.eq("clientId", client._id))
      .order("desc")
      .take(10);
  },
});

export const getClientMeasurements = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("bodyMeasurements")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(20);
  },
});
