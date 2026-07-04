import { query } from './_generated/server'
import { v } from 'convex/values'

type Exercise = { name: string; sets: number; reps: string }
type DaySchedule = { day: string; type: string; exercises: Exercise[] }
type StarterProgram = { title: string; description: string; weeklySchedule: DaySchedule[] }

const BEGINNER_PROGRAM: StarterProgram = {
  title: '3-Day Full Body (Bodyweight)',
  description: 'A simple 3-day routine using only bodyweight — perfect for building a foundation.',
  weeklySchedule: [
    {
      day: 'Monday',
      type: 'Full Body',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: '10-15' },
        { name: 'Bodyweight Squats', sets: 3, reps: '15-20' },
        { name: 'Plank', sets: 3, reps: '30s hold' },
        { name: 'Glute Bridge', sets: 3, reps: '15' },
        { name: 'Superman Hold', sets: 3, reps: '10' },
      ],
    },
    {
      day: 'Wednesday',
      type: 'Full Body',
      exercises: [
        { name: 'Pike Push-ups', sets: 3, reps: '8-12' },
        { name: 'Reverse Lunges', sets: 3, reps: '10 each leg' },
        { name: 'Mountain Climbers', sets: 3, reps: '20 reps total' },
        { name: 'Hip Thrusts', sets: 3, reps: '15' },
        { name: 'Dead Bug', sets: 3, reps: '8 each side' },
      ],
    },
    {
      day: 'Friday',
      type: 'Full Body',
      exercises: [
        { name: 'Diamond Push-ups', sets: 3, reps: '8-12' },
        { name: 'Jump Squats', sets: 3, reps: '10' },
        { name: 'Side Plank', sets: 3, reps: '20s each side' },
        { name: 'Single-Leg Glute Bridge', sets: 3, reps: '10 each leg' },
        { name: 'Burpees', sets: 3, reps: '8' },
      ],
    },
  ],
}

const INTERMEDIATE_PROGRAM: StarterProgram = {
  title: '4-Day Upper / Lower Split',
  description: 'A balanced 4-day split targeting upper and lower body on alternating days.',
  weeklySchedule: [
    {
      day: 'Monday',
      type: 'Upper Body',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8-10' },
        { name: 'Bent-Over Row', sets: 4, reps: '8-10' },
        { name: 'Overhead Press', sets: 3, reps: '10-12' },
        { name: 'Pull-ups / Lat Pulldown', sets: 3, reps: '8-10' },
        { name: 'Tricep Dips', sets: 3, reps: '10-12' },
        { name: 'Dumbbell Curl', sets: 3, reps: '12' },
      ],
    },
    {
      day: 'Tuesday',
      type: 'Lower Body',
      exercises: [
        { name: 'Barbell Squat', sets: 4, reps: '6-8' },
        { name: 'Romanian Deadlift', sets: 3, reps: '10' },
        { name: 'Leg Press', sets: 3, reps: '12' },
        { name: 'Walking Lunges', sets: 3, reps: '10 each leg' },
        { name: 'Seated Calf Raise', sets: 4, reps: '15' },
      ],
    },
    {
      day: 'Thursday',
      type: 'Upper Body',
      exercises: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: '10' },
        { name: 'Cable Row', sets: 4, reps: '10' },
        { name: 'Dumbbell Lateral Raise', sets: 3, reps: '15' },
        { name: 'Face Pulls', sets: 3, reps: '15' },
        { name: 'Skull Crushers', sets: 3, reps: '10-12' },
        { name: 'Hammer Curl', sets: 3, reps: '12' },
      ],
    },
    {
      day: 'Friday',
      type: 'Lower Body',
      exercises: [
        { name: 'Deadlift', sets: 4, reps: '5-6' },
        { name: 'Front Squat / Goblet Squat', sets: 3, reps: '8-10' },
        { name: 'Leg Curl', sets: 3, reps: '12' },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '8 each leg' },
        { name: 'Standing Calf Raise', sets: 4, reps: '15' },
      ],
    },
  ],
}

const ADVANCED_PROGRAM: StarterProgram = {
  title: '5-Day Push / Pull / Legs',
  description: 'A high-frequency PPL programme with a dedicated arm day for serious lifters.',
  weeklySchedule: [
    {
      day: 'Monday',
      type: 'Push',
      exercises: [
        { name: 'Barbell Bench Press', sets: 4, reps: '5-6' },
        { name: 'Incline Dumbbell Press', sets: 4, reps: '8-10' },
        { name: 'Overhead Press', sets: 3, reps: '8' },
        { name: 'Cable Fly', sets: 3, reps: '12-15' },
        { name: 'Overhead Tricep Extension', sets: 3, reps: '10-12' },
        { name: 'Lateral Raise', sets: 4, reps: '15-20' },
      ],
    },
    {
      day: 'Tuesday',
      type: 'Pull',
      exercises: [
        { name: 'Weighted Pull-ups', sets: 4, reps: '6-8' },
        { name: 'Barbell Row', sets: 4, reps: '6-8' },
        { name: 'Chest-Supported Row', sets: 3, reps: '10-12' },
        { name: 'Face Pulls', sets: 3, reps: '20' },
        { name: 'Barbell Curl', sets: 3, reps: '8-10' },
        { name: 'Rear Delt Fly', sets: 3, reps: '15' },
      ],
    },
    {
      day: 'Wednesday',
      type: 'Legs',
      exercises: [
        { name: 'Barbell Squat', sets: 5, reps: '5' },
        { name: 'Romanian Deadlift', sets: 4, reps: '8-10' },
        { name: 'Leg Press', sets: 3, reps: '12-15' },
        { name: 'Leg Curl', sets: 3, reps: '10-12' },
        { name: 'Calf Raise', sets: 5, reps: '12-15' },
      ],
    },
    {
      day: 'Friday',
      type: 'Push',
      exercises: [
        { name: 'Incline Barbell Press', sets: 4, reps: '6-8' },
        { name: 'Dumbbell Shoulder Press', sets: 4, reps: '10' },
        { name: 'Cable Crossover', sets: 3, reps: '15' },
        { name: 'Tricep Pushdown', sets: 3, reps: '12' },
        { name: 'Lateral Raise (Drop Set)', sets: 3, reps: '12-15' },
      ],
    },
    {
      day: 'Saturday',
      type: 'Pull + Legs',
      exercises: [
        { name: 'Deadlift', sets: 4, reps: '4-5' },
        { name: 'Lat Pulldown', sets: 4, reps: '10' },
        { name: 'Cable Row', sets: 3, reps: '10-12' },
        { name: 'Hack Squat', sets: 3, reps: '10-12' },
        { name: 'Hammer Curl', sets: 3, reps: '12' },
        { name: 'Seated Calf Raise', sets: 4, reps: '12' },
      ],
    },
  ],
}

function pickProgram(tier: string): StarterProgram {
  if (tier === 'advanced' || tier === 'elite') return ADVANCED_PROGRAM
  if (tier === 'intermediate' || tier === 'novice') return INTERMEDIATE_PROGRAM
  return BEGINNER_PROGRAM
}

export const getStarterProgram = query({
  args: {},
  handler: async (ctx): Promise<StarterProgram | null> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (!user) return null

    const client = await ctx.db
      .query('clients')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique()
    if (!client) return null

    if (client.gymId || client.trainerId) return null

    return pickProgram(client.currentTier)
  },
})
