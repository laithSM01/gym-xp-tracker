import { query } from "./_generated/server";

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
