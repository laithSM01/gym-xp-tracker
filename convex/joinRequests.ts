import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";
import { LIMITS, type SubscriptionPlan } from "./subscriptionLimits";

export const sendRequest = mutation({
  args: {
    gymId: v.optional(v.id("gyms")),
    trainerProfileId: v.optional(v.id("personalTrainers")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.gymId && !args.trainerProfileId) {
      throw new Error("Must specify a gym or trainer to request joining");
    }
    if (args.gymId && args.trainerProfileId) {
      throw new Error("Cannot send a request to both a gym and a trainer at once");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "client") throw new Error("Only clients can send join requests");

    const existing = await ctx.db
      .query("joinRequests")
      .withIndex("by_clientUserId", (q) => q.eq("clientUserId", user._id))
      .take(50);
    const alreadyPending = existing.some(
      (r) =>
        r.status === "pending" &&
        ((args.gymId && r.gymId !== undefined) ||
          (args.trainerProfileId && r.trainerProfileId !== undefined)),
    );
    if (alreadyPending)
      throw new Error(
        args.gymId
          ? "You already have a pending gym request. Cancel it first before requesting another gym."
          : "You already have a pending trainer request. Cancel it first before requesting another trainer.",
      );

    await ctx.db.insert("joinRequests", {
      clientUserId: user._id,
      gymId: args.gymId,
      trainerProfileId: args.trainerProfileId,
      initiatedBy: "client",
      status: "pending",
      message: args.message,
      createdAt: Date.now(),
    });
  },
});

export const pingFreeClient = mutation({
  args: {
    clientUserId: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const caller = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!caller) throw new Error("User not found");
    if (caller.role !== "gym_owner" && caller.role !== "trainer") {
      throw new Error("Only gym owners and personal trainers can ping free clients");
    }

    let gymId: Id<"gyms"> | undefined;
    let trainerProfileId: Id<"personalTrainers"> | undefined;

    if (caller.role === "gym_owner") {
      const gym = await ctx.db
        .query("gyms")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", caller._id))
        .unique();
      if (!gym) throw new Error("Gym profile not found");
      gymId = gym._id;

      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
        .unique();
      if (!subscription || subscription.status !== "active") {
        throw new Error("An active subscription is required to reach out to free clients");
      }
    } else {
      const trainerProfile = await ctx.db
        .query("personalTrainers")
        .withIndex("by_userId", (q) => q.eq("userId", caller._id))
        .unique();
      if (!trainerProfile) throw new Error("Trainer profile not found");
      trainerProfileId = trainerProfile._id;

      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_trainerProfileId", (q) => q.eq("trainerProfileId", trainerProfile._id))
        .unique();
      if (!subscription || subscription.status !== "active") {
        throw new Error("An active subscription is required to reach out to free clients");
      }
    }

    const clientRecord = await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", args.clientUserId))
      .unique();
    if (!clientRecord) throw new Error("Client profile not found");
    if (clientRecord.gymId !== undefined || clientRecord.trainerId !== undefined) {
      throw new Error("This client is already assigned to a gym or trainer");
    }

    const existing = await ctx.db
      .query("joinRequests")
      .withIndex("by_clientUserId", (q) => q.eq("clientUserId", args.clientUserId))
      .take(50);
    const alreadyPending = existing.some(
      (r) =>
        r.status === "pending" &&
        ((gymId && r.gymId === gymId) || (trainerProfileId && r.trainerProfileId === trainerProfileId)),
    );
    if (alreadyPending) throw new Error("You already have a pending request for this client");

    await ctx.db.insert("joinRequests", {
      clientUserId: args.clientUserId,
      gymId,
      trainerProfileId,
      initiatedBy: caller.role === "gym_owner" ? "gym" : "personal_trainer",
      status: "pending",
      message: args.message,
      createdAt: Date.now(),
    });
  },
});

export const respondToRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const caller = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!caller) throw new Error("User not found");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "pending") throw new Error("This request has already been resolved");

    const now = Date.now();

    if (request.initiatedBy === "client") {
      // Gym or trainer is the responder
      if (caller.role === "gym_owner") {
        if (!request.gymId) throw new Error("This request is not for a gym");
        const gym = await ctx.db
          .query("gyms")
          .withIndex("by_ownerId", (q) => q.eq("ownerId", caller._id))
          .unique();
        if (!gym || gym._id !== request.gymId) throw new Error("Not authorized");

        if (args.accept) {
          const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
            .unique();
          if (subscription) {
            const limit = LIMITS[subscription.plan as SubscriptionPlan].clients;
            if (gym.clientsAdded >= limit) {
              throw new Error(
                `Your plan allows a maximum of ${limit} clients. Upgrade to accept more.`,
              );
            }
          }

          const clientRecord = await ctx.db
            .query("clients")
            .withIndex("by_userId", (q) => q.eq("userId", request.clientUserId))
            .unique();
          if (!clientRecord) throw new Error("Client profile not found");
          await ctx.db.patch(clientRecord._id, { gymId: gym._id });
          await ctx.db.patch(gym._id, { clientsAdded: gym.clientsAdded + 1 });
        }
      } else if (caller.role === "trainer") {
        if (!request.trainerProfileId) throw new Error("This request is not for a personal trainer");
        const trainerProfile = await ctx.db
          .query("personalTrainers")
          .withIndex("by_userId", (q) => q.eq("userId", caller._id))
          .unique();
        if (!trainerProfile || trainerProfile._id !== request.trainerProfileId) {
          throw new Error("Not authorized");
        }

        if (args.accept) {
          const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_trainerProfileId", (q) => q.eq("trainerProfileId", trainerProfile._id))
            .unique();
          if (subscription) {
            const limit = LIMITS[subscription.plan as SubscriptionPlan].clients;
            if (trainerProfile.clientsAdded >= limit) {
              throw new Error(
                `Your plan allows a maximum of ${limit} clients. Upgrade to accept more.`,
              );
            }
          }

          const clientRecord = await ctx.db
            .query("clients")
            .withIndex("by_userId", (q) => q.eq("userId", request.clientUserId))
            .unique();
          if (!clientRecord) throw new Error("Client profile not found");
          await ctx.db.patch(clientRecord._id, { trainerId: caller._id });
          await ctx.db.patch(trainerProfile._id, { clientsAdded: trainerProfile.clientsAdded + 1 });
        }
      } else {
        throw new Error("Not authorized to respond to this request");
      }
    } else {
      // initiatedBy === "gym" or "personal_trainer" — client is the responder
      if (caller.role !== "client") throw new Error("Only clients can respond to gym/trainer invites");
      if (request.clientUserId !== caller._id) throw new Error("Not authorized");

      if (args.accept) {
        const clientRecord = await ctx.db
          .query("clients")
          .withIndex("by_userId", (q) => q.eq("userId", caller._id))
          .unique();
        if (!clientRecord) throw new Error("Client profile not found");

        if (request.initiatedBy === "gym" && request.gymId) {
          const gym = await ctx.db.get(request.gymId);
          if (!gym) throw new Error("Gym not found");

          const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
            .unique();
          if (subscription) {
            const limit = LIMITS[subscription.plan as SubscriptionPlan].clients;
            if (gym.clientsAdded >= limit) {
              throw new Error("This gym has reached its client limit");
            }
          }

          await ctx.db.patch(clientRecord._id, { gymId: gym._id });
          await ctx.db.patch(gym._id, { clientsAdded: gym.clientsAdded + 1 });
        } else if (request.initiatedBy === "personal_trainer" && request.trainerProfileId) {
          const trainerProfile = await ctx.db.get(request.trainerProfileId);
          if (!trainerProfile) throw new Error("Trainer profile not found");

          const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_trainerProfileId", (q) =>
              q.eq("trainerProfileId", trainerProfile._id),
            )
            .unique();
          if (subscription) {
            const limit = LIMITS[subscription.plan as SubscriptionPlan].clients;
            if (trainerProfile.clientsAdded >= limit) {
              throw new Error("This trainer has reached their client limit");
            }
          }

          await ctx.db.patch(clientRecord._id, { trainerId: trainerProfile.userId });
          await ctx.db.patch(trainerProfile._id, {
            clientsAdded: trainerProfile.clientsAdded + 1,
          });
        }
      }
    }

    await ctx.db.patch(args.requestId, {
      status: args.accept ? "approved" : "rejected",
      resolvedAt: now,
    });
  },
});

export const getMyPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    let rawRequests: Doc<"joinRequests">[] = [];

    if (user.role === "gym_owner") {
      const gym = await ctx.db
        .query("gyms")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
        .unique();
      if (!gym) return [];

      const all = await ctx.db
        .query("joinRequests")
        .withIndex("by_gymId_and_status", (q) =>
          q.eq("gymId", gym._id).eq("status", "pending"),
        )
        .take(50);
      rawRequests = all.filter((r) => r.initiatedBy === "client");
    } else if (user.role === "trainer") {
      const trainerProfile = await ctx.db
        .query("personalTrainers")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (!trainerProfile) return [];

      const all = await ctx.db
        .query("joinRequests")
        .withIndex("by_trainerProfileId_and_status", (q) =>
          q.eq("trainerProfileId", trainerProfile._id).eq("status", "pending"),
        )
        .take(50);
      rawRequests = all.filter((r) => r.initiatedBy === "client");
    } else {
      return null;
    }

    const enriched = await Promise.all(
      rawRequests.map(async (r) => {
        const clientUser = await ctx.db.get(r.clientUserId);
        const clientRecord = await ctx.db
          .query("clients")
          .withIndex("by_userId", (q) => q.eq("userId", r.clientUserId))
          .unique();
        return {
          ...r,
          clientName: clientUser?.name ?? clientUser?.email ?? "Unknown",
          clientCity: clientRecord?.city ?? "",
          clientGoal: clientRecord?.goal ?? "",
          clientAge: clientRecord?.age,
        };
      }),
    );

    return enriched;
  },
});

export const getMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "client") return null;

    return await ctx.db
      .query("joinRequests")
      .withIndex("by_clientUserId", (q) => q.eq("clientUserId", user._id))
      .order("desc")
      .take(50);
  },
});

export const listFreeClients = query({
  args: { city: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;
    if (user.role !== "gym_owner" && user.role !== "trainer") return null;

    if (user.role === "gym_owner") {
      const gym = await ctx.db
        .query("gyms")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
        .unique();
      if (!gym) return [];
      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
        .unique();
      if (!subscription || subscription.status !== "active") return [];
    } else {
      const trainerProfile = await ctx.db
        .query("personalTrainers")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (!trainerProfile) return [];
      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_trainerProfileId", (q) => q.eq("trainerProfileId", trainerProfile._id))
        .unique();
      if (!subscription || subscription.status !== "active") return [];
    }

    let candidates;
    if (args.city) {
      candidates = await ctx.db
        .query("clients")
        .withIndex("by_city", (q) => q.eq("city", args.city!))
        .take(50);
    } else {
      candidates = await ctx.db.query("clients").order("desc").take(100);
    }

    const freePool = candidates.filter(
      (c) => c.gymId === undefined && c.trainerId === undefined,
    );

    return await Promise.all(
      freePool.map(async (c) => {
        const u = await ctx.db.get(c.userId);
        return {
          _id: c._id,
          userId: c.userId as Id<"users">,
          name: u?.name ?? u?.email ?? "Unknown",
          city: c.city,
          goal: c.goal,
          age: c.age,
          sportTypes: c.sportTypes,
        };
      }),
    );
  },
});
