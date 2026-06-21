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

export const completeChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("User not found");
    if (user.role !== "client") throw new Error("Only clients can complete challenges");

    const client = await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!client) throw new Error("Client not found");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.assignedTo !== client._id) throw new Error("Challenge not assigned to this client");
    if (challenge.status === "completed") throw new Error("Challenge already completed");

    await ctx.db.patch(args.challengeId, {
      status: "completed",
      completedAt: Date.now(),
    });

    const newXP = client.currentXP + challenge.xpReward;
    const newTier = tierFromXP(newXP);

    await ctx.db.patch(client._id, {
      currentXP: newXP,
      currentTier: newTier,
    });

    await ctx.db.insert("xpLogs", {
      clientId: client._id,
      amount: challenge.xpReward,
      reason: `Completed challenge: ${challenge.title}`,
      awardedBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const addChallenge = mutation({
  args: {
    assignedTo: v.id("clients"),
    title: v.string(),
    description: v.string(),
    xpReward: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("User not found");
    if (user.role !== "trainer" && user.role !== "gym_trainer") throw new Error("Only trainers can assign challenges");

    const client = await ctx.db.get(args.assignedTo);
    if (!client || client.trainerId !== user._id) {
      throw new Error("Client not found or access denied");
    }

    await ctx.db.insert("challenges", {
      title: args.title,
      description: args.description,
      xpReward: args.xpReward,
      assignedTo: args.assignedTo,
      assignedBy: user._id,
      status: "pending",
    });
  },
});

export const getMyChallenges = query({
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

    const all = await ctx.db
      .query("challenges")
      .withIndex("by_assignedTo", (q) => q.eq("assignedTo", client._id))
      .take(50);

    return {
      active: all.filter((c) => c.status === "pending"),
      completed: all.filter((c) => c.status === "completed"),
    };
  },
});
