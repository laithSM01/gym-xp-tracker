import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

type Tier = "beginner" | "novice" | "intermediate" | "advanced" | "elite";

function tierFromXP(xp: number): Tier {
  if (xp >= 3000) return "elite";
  if (xp >= 2000) return "advanced";
  if (xp >= 1000) return "intermediate";
  if (xp >= 500) return "novice";
  return "beginner";
}

export const getMyClients = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const trainer = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!trainer) return null;

    let clients = await ctx.db
      .query("clients")
      .withIndex("by_trainerId", (q) => q.eq("trainerId", trainer._id))
      .take(100);

    // Demo fallback: if no clients assigned to this trainer, use the first
    // seeded trainer's clients so real data shows on screen during development.
    if (clients.length === 0) {
      const firstClient = await ctx.db.query("clients").first();
      if (firstClient) {
        clients = await ctx.db
          .query("clients")
          .withIndex("by_trainerId", (q) =>
            q.eq("trainerId", firstClient.trainerId),
          )
          .take(100);
      }
    }

    const enriched = await Promise.all(
      clients.map(async (client) => {
        const user = await ctx.db.get(client.userId);
        return {
          ...client,
          userName: user?.name ?? user?.email ?? "Unknown",
        };
      }),
    );

    return enriched.sort((a, b) => b.currentXP - a.currentXP);
  },
});

export const getClientById = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const client = await ctx.db.get(args.clientId);
    if (!client) return null;

    const user = await ctx.db.get(client.userId);

    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_assignedTo", (q) => q.eq("assignedTo", args.clientId))
      .take(20);

    const xpLogs = await ctx.db
      .query("xpLogs")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(10);

    return {
      ...client,
      userName: user?.name ?? user?.email ?? "Unknown",
      userEmail: user?.email,
      challenges,
      xpLogs,
    };
  },
});

export const awardXP = mutation({
  args: {
    clientId: v.id("clients"),
    amount: v.number(),
    reason: v.string(),
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
    if (client.trainerId !== trainer._id) throw new Error("Not authorized");

    const newXP = client.currentXP + args.amount;
    const newTier = tierFromXP(newXP);

    await ctx.db.patch(args.clientId, {
      currentXP: newXP,
      currentTier: newTier,
    });

    await ctx.db.insert("xpLogs", {
      clientId: args.clientId,
      amount: args.amount,
      reason: args.reason,
      awardedBy: trainer._id,
      createdAt: Date.now(),
    });

    return { newXP, newTier };
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.log("[getMyProfile] no identity");
      return null;
    }

    console.log("[getMyProfile] tokenIdentifier:", identity.tokenIdentifier);

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    console.log("[getMyProfile] user found:", user ? `${user._id} role=${user.role}` : "null");
    if (!user) return null;

    const client = await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    console.log("[getMyProfile] client found:", client ? client._id : "null");
    if (!client) return null;

    return {
      ...client,
      userName: user.name ?? user.email ?? "Unknown",
      userEmail: user.email,
    };
  },
});

export const getUnassignedClients = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const allUsers = await ctx.db.query("users").take(200);
    const clientUsers = allUsers.filter((u) => u.role === "client");

    const unassigned = [];
    for (const user of clientUsers) {
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      if (!existing) {
        unassigned.push({
          _id: user._id,
          name: user.name,
          email: user.email,
        });
      }
    }

    return unassigned;
  },
});

export const createClient = mutation({
  args: {
    userId: v.id("users"),
    age: v.number(),
    goal: v.string(),
    initialWeight: v.number(),
    initialBodyFat: v.number(),
    initialMuscleMass: v.number(),
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

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");
    if (targetUser.role !== "client") throw new Error("User is not a client");

    // Create the client record
    const clientId: Id<"clients"> = await ctx.db.insert("clients", {
      userId: args.userId,
      trainerId: trainer._id,
      age: args.age,
      goal: args.goal,
      isEnrolled: true,
      currentXP: 0,
      currentTier: "beginner",
      nutritionistAccess: false,
      createdAt: Date.now(),
    });

    // Save baseline measurement (no XP — this is just intake data)
    await ctx.db.insert("bodyMeasurements", {
      clientId,
      trainerId: trainer._id,
      weight: args.initialWeight,
      bodyFat: args.initialBodyFat,
      muscleMass: args.initialMuscleMass,
      timestamp: Date.now(),
    });

    return clientId;
  },
});

export const toggleNutritionistAccess = mutation({
  args: { clientId: v.id("clients") },
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
    if (client.trainerId !== trainer._id) throw new Error("Not authorized");

    await ctx.db.patch(args.clientId, {
      nutritionistAccess: !client.nutritionistAccess,
    });
  },
});
