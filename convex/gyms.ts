import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("gyms")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .take(20);
  },
});

export const getMyGym = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "gym_owner") return null;

    return await ctx.db
      .query("gyms")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .unique();
  },
});

export const createGym = mutation({
  args: {
    name: v.string(),
    bio: v.optional(v.string()),
    location: v.string(),
    city: v.string(),
    facilities: v.array(v.string()),
    priceRange: v.object({ min: v.number(), max: v.number() }),
    logoStorageId: v.optional(v.id("_storage")),
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
    if (user.role !== "gym_owner") throw new Error("Only gym owners can create a gym");

    const existing = await ctx.db
      .query("gyms")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .unique();
    if (existing) throw new Error("You already have a gym profile");

    return await ctx.db.insert("gyms", {
      ownerId: user._id,
      name: args.name.trim(),
      bio: args.bio?.trim(),
      location: args.location.trim(),
      city: args.city.trim(),
      facilities: args.facilities,
      priceRange: args.priceRange,
      logoStorageId: args.logoStorageId,
      coverPhotoStorageId: args.coverPhotoStorageId,
      isActive: true,
      trainersUsed: 0,
      clientsAdded: 0,
      productsListed: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateGym = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    city: v.optional(v.string()),
    facilities: v.optional(v.array(v.string())),
    priceRange: v.optional(v.object({ min: v.number(), max: v.number() })),
    logoStorageId: v.optional(v.id("_storage")),
    coverPhotoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "gym_owner") throw new Error("Not authorized");

    const gym = await ctx.db
      .query("gyms")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .unique();
    if (!gym) throw new Error("Gym not found");

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.bio !== undefined) patch.bio = args.bio.trim();
    if (args.location !== undefined) patch.location = args.location.trim();
    if (args.city !== undefined) patch.city = args.city.trim();
    if (args.facilities !== undefined) patch.facilities = args.facilities;
    if (args.priceRange !== undefined) patch.priceRange = args.priceRange;
    if (args.logoStorageId !== undefined) patch.logoStorageId = args.logoStorageId;
    if (args.coverPhotoStorageId !== undefined) patch.coverPhotoStorageId = args.coverPhotoStorageId;

    await ctx.db.patch(gym._id, patch);
  },
});
