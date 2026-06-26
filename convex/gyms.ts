import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { LIMITS, type SubscriptionPlan } from "./subscriptionLimits";

const pricingPlanValidator = v.object({
  duration: v.union(
    v.literal("1_month"),
    v.literal("3_months"),
    v.literal("6_months"),
    v.literal("8_months"),
    v.literal("12_months"),
  ),
  priceJod: v.number(),
  label: v.optional(v.string()),
  isOffer: v.boolean(),
  offerExpiresAt: v.optional(v.number()),
});

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const gyms = await ctx.db
      .query("gyms")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .take(20);
    return Promise.all(
      gyms.map(async (gym) => ({
        ...gym,
        logoUrl: gym.logoStorageId ? await ctx.storage.getUrl(gym.logoStorageId) : null,
        coverPhotoUrl: gym.coverPhotoStorageId ? await ctx.storage.getUrl(gym.coverPhotoStorageId) : null,
      })),
    );
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

const openingHoursValidator = v.object({
  weekdays: v.string(),
  weekends: v.string(),
  friday: v.optional(v.string()),
});

const genderSectionValidator = v.object({
  gender: v.union(v.literal("male"), v.literal("female"), v.literal("mixed")),
  label: v.optional(v.string()),
  weekdays: v.optional(v.string()),
  weekends: v.optional(v.string()),
  friday: v.optional(v.string()),
});

const classScheduleValidator = v.object({
  activity: v.string(),
  schedule: v.string(),
  instructor: v.optional(v.string()),
});

export const createGym = mutation({
  args: {
    name: v.string(),
    bio: v.optional(v.string()),
    location: v.string(),
    city: v.string(),
    genderType: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("mixed"))),
    openingHours: v.optional(openingHoursValidator),
    genderSections: v.optional(v.array(genderSectionValidator)),
    classSchedules: v.optional(v.array(classScheduleValidator)),
    facilities: v.array(v.string()),
    pricingPlans: v.array(pricingPlanValidator),
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
      genderType: args.genderType,
      openingHours: args.openingHours,
      genderSections: args.genderSections,
      classSchedules: args.classSchedules,
      facilities: args.facilities,
      pricingPlans: args.pricingPlans,
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

export const getGymDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "gym_owner") return null;

    const gym = await ctx.db
      .query("gyms")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .unique();
    if (!gym) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
      .unique();

    const affiliations = await ctx.db
      .query("trainerGymAffiliation")
      .withIndex("by_gymId_and_isActive", (q) => q.eq("gymId", gym._id).eq("isActive", true))
      .take(50);

    const trainers = await Promise.all(
      affiliations.map(async (aff) => {
        const trainerUser = await ctx.db.get(aff.gymTrainerUserId);
        const clientRows = await ctx.db
          .query("clients")
          .withIndex("by_trainerId", (q) => q.eq("trainerId", aff.gymTrainerUserId))
          .take(101);
        return {
          userId: aff.gymTrainerUserId,
          name: trainerUser?.name ?? trainerUser?.email ?? "Unknown",
          affiliationRole: aff.affiliationRole,
          clientCount: Math.min(clientRows.length, 100),
          clientCountCapped: clientRows.length > 100,
        };
      }),
    );

    const gymClients = await ctx.db
      .query("clients")
      .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
      .take(100);

    const clients = await Promise.all(
      gymClients.map(async (client) => {
        const clientUser = await ctx.db.get(client.userId);
        let trainerName: string | null = null;
        if (client.trainerId) {
          const trainerUser = await ctx.db.get(client.trainerId);
          trainerName = trainerUser?.name ?? trainerUser?.email ?? null;
        }
        return {
          clientId: client._id,
          name: clientUser?.name ?? clientUser?.email ?? "Unknown",
          goal: client.goal,
          city: client.city,
          trainerId: client.trainerId ?? null,
          trainerName,
        };
      }),
    );

    const limits = subscription
      ? LIMITS[subscription.plan as SubscriptionPlan]
      : null;

    return { gym, subscription, trainers, clients, limits };
  },
});

export const updateGym = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    city: v.optional(v.string()),
    genderType: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("mixed"))),
    openingHours: v.optional(openingHoursValidator),
    genderSections: v.optional(v.array(genderSectionValidator)),
    classSchedules: v.optional(v.array(classScheduleValidator)),
    facilities: v.optional(v.array(v.string())),
    pricingPlans: v.optional(v.array(pricingPlanValidator)),
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
    if (args.genderType !== undefined) patch.genderType = args.genderType;
    if (args.openingHours !== undefined) patch.openingHours = args.openingHours;
    if (args.genderSections !== undefined) patch.genderSections = args.genderSections;
    if (args.classSchedules !== undefined) patch.classSchedules = args.classSchedules;
    if (args.facilities !== undefined) patch.facilities = args.facilities;
    if (args.pricingPlans !== undefined) patch.pricingPlans = args.pricingPlans;
    if (args.logoStorageId !== undefined) patch.logoStorageId = args.logoStorageId;
    if (args.coverPhotoStorageId !== undefined) patch.coverPhotoStorageId = args.coverPhotoStorageId;

    await ctx.db.patch(gym._id, patch);
  },
});

export const getGymPublicPage = query({
  args: { gymId: v.id("gyms") },
  handler: async (ctx, args) => {
    const gym = await ctx.db.get(args.gymId);
    if (!gym || !gym.isActive) return null;

    const logoUrl = gym.logoStorageId
      ? await ctx.storage.getUrl(gym.logoStorageId)
      : null;
    const coverPhotoUrl = gym.coverPhotoStorageId
      ? await ctx.storage.getUrl(gym.coverPhotoStorageId)
      : null;

    const affiliations = await ctx.db
      .query("trainerGymAffiliation")
      .withIndex("by_gymId_and_isActive", (q) =>
        q.eq("gymId", args.gymId).eq("isActive", true),
      )
      .take(20);

    const trainers = await Promise.all(
      affiliations.map(async (aff) => {
        const user = await ctx.db.get(aff.gymTrainerUserId);
        return {
          userId: aff.gymTrainerUserId,
          name: user?.name ?? user?.email ?? "Trainer",
          email: user?.email ?? null,
          affiliationRole: aff.affiliationRole,
        };
      }),
    );

    const allProducts = await ctx.db
      .query("products")
      .withIndex("by_sellerGymId", (q) => q.eq("sellerGymId", args.gymId))
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
      gym: {
        _id: gym._id,
        name: gym.name,
        bio: gym.bio,
        location: gym.location,
        city: gym.city,
        genderType: gym.genderType,
        openingHours: gym.openingHours,
        genderSections: gym.genderSections,
        classSchedules: gym.classSchedules,
        facilities: gym.facilities,
        pricingPlans: gym.pricingPlans,
        logoUrl,
        coverPhotoUrl,
        isActive: gym.isActive,
        createdAt: gym.createdAt,
      },
      trainers,
      products,
    };
  },
});
