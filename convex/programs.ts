import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createProgram = mutation({
  args: {
    clientId: v.id("clients"),
    title: v.string(),
    weeklySchedule: v.array(
      v.object({
        day: v.number(),
        type: v.string(),
        exercises: v.array(
          v.object({
            name: v.string(),
            sets: v.number(),
            reps: v.number(),
            notes: v.optional(v.string()),
          }),
        ),
      }),
    ),
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
    if (user.role !== "trainer") throw new Error("Only trainers can create programs");

    const client = await ctx.db.get(args.clientId);
    if (!client || client.trainerId !== user._id) {
      throw new Error("Client not found or access denied");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("programs")
      .withIndex("by_clientId_and_status", (q) =>
        q.eq("clientId", args.clientId).eq("status", "active"),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        weeklySchedule: args.weeklySchedule,
        startDate: now,
        endDate: now + 30 * 24 * 60 * 60 * 1000,
      });
    } else {
      await ctx.db.insert("programs", {
        clientId: args.clientId,
        trainerId: user._id,
        title: args.title,
        startDate: now,
        endDate: now + 30 * 24 * 60 * 60 * 1000,
        weeklySchedule: args.weeklySchedule,
        status: "active",
      });
    }
  },
});

export const updateProgramStatus = mutation({
  args: {
    programId: v.id("programs"),
    status: v.union(v.literal("active"), v.literal("completed")),
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
    if (user.role !== "trainer") throw new Error("Only trainers can update programs");

    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");

    const client = await ctx.db.get(program.clientId);
    if (!client || client.trainerId !== user._id) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.programId, { status: args.status });
  },
});

export const getClientPrograms = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user || user.role !== "trainer") return null;

    const client = await ctx.db.get(args.clientId);
    if (!client || client.trainerId !== user._id) return null;

    return await ctx.db
      .query("programs")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(20);
  },
});

export const getMyPrograms = query({
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

    return await ctx.db
      .query("programs")
      .withIndex("by_clientId_and_status", (q) =>
        q.eq("clientId", client._id).eq("status", "active"),
      )
      .order("desc")
      .take(10);
  },
});
