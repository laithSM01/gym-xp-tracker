import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
        return { ...profile, name: user?.name ?? "Trainer" };
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
