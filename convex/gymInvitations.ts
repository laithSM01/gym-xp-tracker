import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { LIMITS, type SubscriptionPlan } from "./subscriptionLimits";

export const createInvite = mutation({
  args: {
    invitedEmail: v.string(),
    invitedName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const owner = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!owner || owner.role !== "gym_owner") throw new Error("Only gym owners can send invites");

    const gym = await ctx.db
      .query("gyms")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", owner._id))
      .unique();
    if (!gym) throw new Error("Gym profile not found");

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
      .unique();
    if (!subscription || subscription.status !== "active") {
      throw new Error("An active subscription is required to invite trainers");
    }

    const limits = LIMITS[subscription.plan as SubscriptionPlan];
    const trainerLimit = limits.trainers as number;
    if (gym.trainersUsed >= trainerLimit) {
      throw new Error(
        trainerLimit === 0
          ? "Your plan does not support gym trainers. Please upgrade."
          : `Your ${subscription.plan} plan allows a maximum of ${trainerLimit} trainer${trainerLimit === 1 ? "" : "s"}. Upgrade to add more.`,
      );
    }

    // Check no pending invite already exists for this email + gym
    const pendingInvites = await ctx.db
      .query("gymInvitations")
      .withIndex("by_gymId_and_status", (q) =>
        q.eq("gymId", gym._id).eq("status", "pending"),
      )
      .take(100);
    const alreadyInvited = pendingInvites.some(
      (inv) => inv.invitedEmail.toLowerCase() === args.invitedEmail.toLowerCase(),
    );
    if (alreadyInvited) {
      throw new Error("A pending invite already exists for this email address");
    }

    const inviteToken = crypto.randomUUID();
    const now = Date.now();

    return await ctx.db.insert("gymInvitations", {
      gymId: gym._id,
      invitedEmail: args.invitedEmail.toLowerCase().trim(),
      invitedName: args.invitedName.trim(),
      inviteToken,
      status: "pending",
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  },
});

export const acceptInvite = mutation({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found — complete sign-up first");

    const invite = await ctx.db
      .query("gymInvitations")
      .withIndex("by_token", (q) => q.eq("inviteToken", args.inviteToken))
      .unique();
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error("This invite has already been used or expired");
    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch(invite._id, { status: "expired" });
      throw new Error("This invite link has expired");
    }

    const gym = await ctx.db.get(invite.gymId);
    if (!gym) throw new Error("Gym not found");

    // Set user role to gym_trainer (regardless of their current role)
    await ctx.db.patch(user._id, { role: "gym_trainer" });

    // Create affiliation record
    await ctx.db.insert("trainerGymAffiliation", {
      gymTrainerUserId: user._id,
      gymId: invite.gymId,
      affiliationRole: "trainer",
      inviteId: invite._id,
      joinedAt: Date.now(),
      isActive: true,
    });

    // Mark invite accepted
    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      acceptedByUserId: user._id,
    });

    // Increment gym trainer slot counter (permanent — slot is never freed)
    await ctx.db.patch(invite.gymId, {
      trainersUsed: gym.trainersUsed + 1,
    });

    return { gymId: invite.gymId, gymName: gym.name };
  },
});

export const getInviteDetails = query({
  args: { inviteToken: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("gymInvitations")
      .withIndex("by_token", (q) => q.eq("inviteToken", args.inviteToken))
      .unique();
    if (!invite) return null;

    const gym = await ctx.db.get(invite.gymId);
    return {
      status: invite.status,
      expiresAt: invite.expiresAt,
      isExpired: invite.expiresAt < Date.now(),
      invitedName: invite.invitedName,
      invitedEmail: invite.invitedEmail,
      gymId: invite.gymId,
      gymName: gym?.name ?? "Unknown Gym",
      gymCity: gym?.city,
    };
  },
});

export const listGymInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const owner = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!owner || owner.role !== "gym_owner") return null;

    const gym = await ctx.db
      .query("gyms")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", owner._id))
      .unique();
    if (!gym) return [];

    return await ctx.db
      .query("gymInvitations")
      .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
      .order("desc")
      .take(50);
  },
});

export const revokeInvite = mutation({
  args: { inviteId: v.id("gymInvitations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const owner = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!owner || owner.role !== "gym_owner") throw new Error("Only gym owners can revoke invites");

    const gym = await ctx.db
      .query("gyms")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", owner._id))
      .unique();
    if (!gym) throw new Error("Gym not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.gymId !== gym._id) throw new Error("Not authorized");
    if (invite.status !== "pending") throw new Error("Only pending invites can be revoked");

    await ctx.db.patch(args.inviteId, { status: "expired" });
  },
});
