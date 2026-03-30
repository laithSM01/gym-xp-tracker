import { query } from "./_generated/server";

export const getMyChallenges = query({
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

    const all = await ctx.db
      .query("challenges")
      .withIndex("by_assignedTo", (q) => q.eq("assignedTo", client._id))
      .take(50);

    return {
      active: all.filter((c) => c.status === "pending"),
      completed: all.filter((c) => c.status === "completed"),
    };
  },
});
