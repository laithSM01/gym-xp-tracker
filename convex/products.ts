import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { LIMITS, type SubscriptionPlan } from "./subscriptionLimits";

const CATEGORY_VALIDATOR = v.union(
  v.literal("supplement"),
  v.literal("equipment"),
  v.literal("food"),
  v.literal("digital_program"),
  v.literal("session"),
);

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || (user.role !== "gym_owner" && user.role !== "trainer")) {
      throw new Error("Only gym owners and trainers can upload product images");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const listMyProducts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    let rawProducts;

    if (user.role === "gym_owner") {
      const gym = await ctx.db
        .query("gyms")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
        .unique();
      if (!gym) return null;

      rawProducts = await ctx.db
        .query("products")
        .withIndex("by_sellerGymId", (q) => q.eq("sellerGymId", gym._id))
        .order("desc")
        .take(50);
    } else if (user.role === "trainer") {
      const trainerProfile = await ctx.db
        .query("personalTrainers")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (!trainerProfile) return null;

      rawProducts = await ctx.db
        .query("products")
        .withIndex("by_sellerTrainerProfileId", (q) =>
          q.eq("sellerTrainerProfileId", trainerProfile._id),
        )
        .order("desc")
        .take(50);
    } else {
      return null;
    }

    return await Promise.all(
      rawProducts.map(async (product) => {
        const imageUrl = product.imageStorageId
          ? await ctx.storage.getUrl(product.imageStorageId)
          : null;
        return {
          _id: product._id,
          name: product.name,
          description: product.description,
          priceJod: product.priceJod,
          category: product.category,
          isActive: product.isActive,
          imageUrl,
          createdAt: product.createdAt,
        };
      }),
    );
  },
});

export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    priceJod: v.number(),
    category: CATEGORY_VALIDATOR,
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    if (user.role === "gym_owner") {
      const gym = await ctx.db
        .query("gyms")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
        .unique();
      if (!gym) throw new Error("Gym profile not found");

      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
        .unique();
      const limits = subscription ? LIMITS[subscription.plan as SubscriptionPlan] : null;
      if (limits && gym.productsListed >= limits.products) {
        throw new Error(
          `Your plan allows a maximum of ${limits.products} products. Upgrade to add more.`,
        );
      }

      await ctx.db.insert("products", {
        sellerGymId: gym._id,
        name: args.name.trim(),
        description: args.description.trim(),
        priceJod: args.priceJod,
        category: args.category,
        imageStorageId: args.imageStorageId,
        isActive: true,
        createdAt: Date.now(),
      });

      await ctx.db.patch(gym._id, { productsListed: gym.productsListed + 1 });
    } else if (user.role === "trainer") {
      const trainerProfile = await ctx.db
        .query("personalTrainers")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();
      if (!trainerProfile) throw new Error("Trainer profile not found");

      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_trainerProfileId", (q) => q.eq("trainerProfileId", trainerProfile._id))
        .unique();
      const limits = subscription ? LIMITS[subscription.plan as SubscriptionPlan] : null;
      if (limits && trainerProfile.productsListed >= limits.products) {
        throw new Error(
          `Your plan allows a maximum of ${limits.products} products. Upgrade to add more.`,
        );
      }

      await ctx.db.insert("products", {
        sellerTrainerProfileId: trainerProfile._id,
        name: args.name.trim(),
        description: args.description.trim(),
        priceJod: args.priceJod,
        category: args.category,
        imageStorageId: args.imageStorageId,
        isActive: true,
        createdAt: Date.now(),
      });

      await ctx.db.patch(trainerProfile._id, {
        productsListed: trainerProfile.productsListed + 1,
      });
    } else {
      throw new Error("Only gym owners and trainers can create products");
    }
  },
});

export const toggleProductActive = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    await assertOwnership(ctx, user._id, user.role, product.sellerGymId, product.sellerTrainerProfileId);

    await ctx.db.patch(args.productId, { isActive: !product.isActive });
  },
});

export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    await assertOwnership(ctx, user._id, user.role, product.sellerGymId, product.sellerTrainerProfileId);

    await ctx.db.delete(args.productId);
  },
});

async function assertOwnership(
  ctx: MutationCtx,
  userId: Id<"users">,
  role: string,
  sellerGymId: Id<"gyms"> | undefined,
  sellerTrainerProfileId: Id<"personalTrainers"> | undefined,
) {
  if (role === "gym_owner") {
    const gym = await ctx.db
      .query("gyms")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", userId))
      .unique();
    if (!gym || sellerGymId !== gym._id) throw new Error("Not authorized");
  } else if (role === "trainer") {
    const trainerProfile = await ctx.db
      .query("personalTrainers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!trainerProfile || sellerTrainerProfileId !== trainerProfile._id) {
      throw new Error("Not authorized");
    }
  } else {
    throw new Error("Not authorized");
  }
}
