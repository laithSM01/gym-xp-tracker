import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { LIMITS, type SubscriptionPlan } from "./subscriptionLimits";

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("personalTrainers")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .take(20);

    return await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          name: user?.name ?? "Trainer",
          profilePhotoUrl: profile.profilePhotoStorageId
            ? await ctx.storage.getUrl(profile.profilePhotoStorageId)
            : null,
        };
      }),
    );
  },
});

export const getMyTrainerProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "trainer") return null;

    return await ctx.db
      .query("personalTrainers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const getTrainerDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "trainer") return null;

    const trainerProfile = await ctx.db
      .query("personalTrainers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!trainerProfile) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_trainerProfileId", (q) => q.eq("trainerProfileId", trainerProfile._id))
      .unique();

    const clientRows = await ctx.db
      .query("clients")
      .withIndex("by_trainerId", (q) => q.eq("trainerId", user._id))
      .take(100);

    const clients = await Promise.all(
      clientRows.map(async (client) => {
        const clientUser = await ctx.db.get(client.userId);
        return {
          _id: client._id,
          name: clientUser?.name ?? clientUser?.email ?? "Unknown",
          goal: client.goal,
          city: client.city,
          currentXP: client.currentXP,
          currentTier: client.currentTier,
          isEnrolled: client.isEnrolled,
        };
      }),
    );

    clients.sort((a, b) => b.currentXP - a.currentXP);

    const limits = subscription
      ? LIMITS[subscription.plan as SubscriptionPlan]
      : null;

    return {
      trainerProfile,
      trainerName: user.name ?? user.email ?? "Trainer",
      subscription,
      clients,
      limits,
    };
  },
});

export const createTrainerProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    certifications: v.array(v.string()),
    specializations: v.array(v.string()),
    yearsOfExperience: v.optional(v.number()),
    instagramHandle: v.optional(v.string()),
    profilePhotoStorageId: v.optional(v.id("_storage")),
    coverPhotoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");
    if (user.role !== "trainer") throw new Error("Only trainers can create a trainer profile");

    const existing = await ctx.db
      .query("personalTrainers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) throw new Error("You already have a trainer profile");

    const handle = args.instagramHandle?.trim().replace(/^@/, "") || undefined;

    return await ctx.db.insert("personalTrainers", {
      userId: user._id,
      bio: args.bio?.trim(),
      certifications: args.certifications,
      specializations: args.specializations,
      yearsOfExperience: args.yearsOfExperience,
      instagramHandle: handle,
      profilePhotoStorageId: args.profilePhotoStorageId,
      coverPhotoStorageId: args.coverPhotoStorageId,
      isActive: true,
      clientsAdded: 0,
      productsListed: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateTrainerProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    certifications: v.optional(v.array(v.string())),
    specializations: v.optional(v.array(v.string())),
    yearsOfExperience: v.optional(v.number()),
    instagramHandle: v.optional(v.string()),
    profilePhotoStorageId: v.optional(v.id("_storage")),
    coverPhotoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "trainer") throw new Error("Not authorized");

    const profile = await ctx.db
      .query("personalTrainers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!profile) throw new Error("Trainer profile not found");

    const patch: Record<string, unknown> = {};
    if (args.bio !== undefined) patch.bio = args.bio.trim();
    if (args.certifications !== undefined) patch.certifications = args.certifications;
    if (args.specializations !== undefined) patch.specializations = args.specializations;
    if (args.yearsOfExperience !== undefined) patch.yearsOfExperience = args.yearsOfExperience;
    if (args.instagramHandle !== undefined) patch.instagramHandle = args.instagramHandle.trim().replace(/^@/, "");
    if (args.profilePhotoStorageId !== undefined) patch.profilePhotoStorageId = args.profilePhotoStorageId;
    if (args.coverPhotoStorageId !== undefined) patch.coverPhotoStorageId = args.coverPhotoStorageId;

    await ctx.db.patch(profile._id, patch);
  },
});

export const getTrainerPublicPage = query({
  args: { trainerProfileId: v.id("personalTrainers") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.trainerProfileId);
    if (!profile || !profile.isActive) return null;

    const user = await ctx.db.get(profile.userId);
    const name = user?.name ?? user?.email ?? "Trainer";

    const profilePhotoUrl = profile.profilePhotoStorageId
      ? await ctx.storage.getUrl(profile.profilePhotoStorageId)
      : null;
    const coverPhotoUrl = profile.coverPhotoStorageId
      ? await ctx.storage.getUrl(profile.coverPhotoStorageId)
      : null;

    const allProducts = await ctx.db
      .query("products")
      .withIndex("by_sellerTrainerProfileId", (q) =>
        q.eq("sellerTrainerProfileId", args.trainerProfileId),
      )
      .take(100);

    const products = await Promise.all(
      allProducts
        .filter((p) => p.isActive)
        .slice(0, 50)
        .map(async (p) => {
          const imageUrl = p.imageStorageId
            ? await ctx.storage.getUrl(p.imageStorageId)
            : null;
          return {
            _id: p._id,
            name: p.name,
            description: p.description,
            priceJod: p.priceJod,
            category: p.category,
            imageUrl,
          };
        }),
    );

    return {
      trainerProfile: {
        _id: profile._id,
        userId: profile.userId,
        bio: profile.bio,
        certifications: profile.certifications,
        specializations: profile.specializations,
        yearsOfExperience: profile.yearsOfExperience,
        instagramHandle: profile.instagramHandle,
        profilePhotoUrl,
        coverPhotoUrl,
        isActive: profile.isActive,
        createdAt: profile.createdAt,
      },
      name,
      products,
    };
  },
});
