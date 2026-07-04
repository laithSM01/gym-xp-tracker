import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

type Tier = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite'

function tierFromXP(xp: number): Tier {
  if (xp >= 3000) return 'elite'
  if (xp >= 2000) return 'advanced'
  if (xp >= 1000) return 'intermediate'
  if (xp >= 500) return 'novice'
  return 'beginner'
}

// 50 XP base + 10 per exercise, capped at 100
function calcXP(exerciseCount: number): number {
  return Math.min(100, Math.max(50, exerciseCount * 10 + 10))
}

export const completeSession = mutation({
  args: {
    programId: v.optional(v.id('programs')),
    dayIndex: v.number(),
    exerciseCount: v.number(),
    dateKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) throw new Error('User not found')
    if (user.role !== 'client') throw new Error('Only clients can complete sessions')

    const client = await ctx.db
      .query('clients')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique()
    if (!client) throw new Error('Client not found')

    // One claim per day per workout day — idempotency guard
    const existing = await ctx.db
      .query('workoutSessions')
      .withIndex('by_client_date_day', (q) =>
        q.eq('clientId', client._id).eq('dateKey', args.dateKey).eq('dayIndex', args.dayIndex),
      )
      .first()
    if (existing) throw new Error('Session already completed today')

    const xpAwarded = calcXP(args.exerciseCount)
    const now = Date.now()
    const newXP = client.currentXP + xpAwarded
    const newTier = tierFromXP(newXP)

    await ctx.db.insert('workoutSessions', {
      clientId: client._id,
      programId: args.programId,
      dayIndex: args.dayIndex,
      dateKey: args.dateKey,
      xpAwarded,
      exerciseCount: args.exerciseCount,
      completedAt: now,
    })

    await ctx.db.patch(client._id, { currentXP: newXP, currentTier: newTier })

    await ctx.db.insert('xpLogs', {
      clientId: client._id,
      amount: xpAwarded,
      reason: `Completed workout session (Day ${args.dayIndex + 1})`,
      awardedBy: user._id,
      createdAt: now,
    })

    return xpAwarded
  },
})

export const getTodaySessions = query({
  args: { dateKey: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) return []

    const client = await ctx.db
      .query('clients')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique()
    if (!client) return []

    const sessions = await ctx.db
      .query('workoutSessions')
      .withIndex('by_client_date_day', (q) =>
        q.eq('clientId', client._id).eq('dateKey', args.dateKey),
      )
      .collect()

    return sessions.map((s) => s.dayIndex)
  },
})
