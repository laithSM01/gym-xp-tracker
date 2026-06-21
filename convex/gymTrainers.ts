import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMyGymTrainerDashboard = query({
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
    if (!user || user.role !== "gym_trainer") return null;

    const affiliation = await ctx.db
      .query("trainerGymAffiliation")
      .withIndex("by_gymTrainerUserId", (q) =>
        q.eq("gymTrainerUserId", user._id),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (!affiliation) return null;

    const gym = await ctx.db.get(affiliation.gymId);
    if (!gym) return null;

    // All clients enrolled in this gym
    const allGymClients = await ctx.db
      .query("clients")
      .withIndex("by_gymId", (q) => q.eq("gymId", affiliation.gymId))
      .take(200);

    const enriched = await Promise.all(
      allGymClients.map(async (client) => {
        const clientUser = await ctx.db.get(client.userId);
        return {
          clientId: client._id,
          userId: client.userId,
          name: clientUser?.name ?? clientUser?.email ?? "Unknown",
          goal: client.goal,
          city: client.city,
          currentXP: client.currentXP,
          currentTier: client.currentTier,
          trainerId: client.trainerId ?? null,
        };
      }),
    );

    const myClients = enriched.filter((c) => c.trainerId === user._id);
    const availableClients = enriched.filter((c) => c.trainerId !== user._id);

    return {
      gym: { name: gym.name, city: gym.city },
      myClients,
      availableClients,
    };
  },
});

export const claimGymClient = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user || user.role !== "gym_trainer") throw new Error("Not authorized");

    const affiliation = await ctx.db
      .query("trainerGymAffiliation")
      .withIndex("by_gymTrainerUserId", (q) =>
        q.eq("gymTrainerUserId", user._id),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (!affiliation) throw new Error("No active gym affiliation");

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");
    if (client.gymId !== affiliation.gymId) throw new Error("Client is not in your gym");

    await ctx.db.patch(args.clientId, { trainerId: user._id });
  },
});

export const unassignGymClient = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user || user.role !== "gym_trainer") throw new Error("Not authorized");

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");
    if (client.trainerId !== user._id) throw new Error("You are not assigned to this client");

    await ctx.db.patch(args.clientId, { trainerId: undefined });
  },
});
