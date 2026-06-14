import { query } from "./_generated/server";

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
