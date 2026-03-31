import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

type Tier = "beginner" | "novice" | "intermediate" | "advanced" | "elite";

function tierFromXP(xp: number): Tier {
  if (xp >= 3000) return "elite";
  if (xp >= 2000) return "advanced";
  if (xp >= 1000) return "intermediate";
  if (xp >= 500) return "novice";
  return "beginner";
}

export const runSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // ── Trainers ────────────────────────────────────────────────────────────
    const trainerData = [
      { name: "Ahmed Al-Rashid", email: "ahmed@gymxp.dev", clerkId: "seed_trainer_1" },
      { name: "Sara Khalil",     email: "sara@gymxp.dev",  clerkId: "seed_trainer_2" },
      { name: "Omar Nasser",     email: "omar@gymxp.dev",  clerkId: "seed_trainer_3" },
    ];

    const trainerIds: Id<"users">[] = [];
    for (const t of trainerData) {
      const id = await ctx.db.insert("users", {
        tokenIdentifier: `seed|${t.clerkId}`,
        clerkId: t.clerkId,
        name: t.name,
        email: t.email,
        role: "trainer",
        createdAt: now,
      });
      trainerIds.push(id);
    }

    const [ahmed, sara, omar] = trainerIds;

    // ── Clients (10 total: 4 Ahmed, 3 Sara, 3 Omar) ─────────────────────────
    const clientUserData: {
      name: string;
      email: string;
      clerkId: string;
      trainerId: Id<"users">;
      age: number;
      goal: string;
      xp: number;
    }[] = [
      // Ahmed's 4
      { name: "Layla Hassan",    email: "layla@gymxp.dev",   clerkId: "seed_client_1",  trainerId: ahmed, age: 27, goal: "Lose 10 kg before summer",          xp: 320  },
      { name: "Karim Mansour",   email: "karim@gymxp.dev",   clerkId: "seed_client_2",  trainerId: ahmed, age: 34, goal: "Build muscle and increase strength", xp: 1450 },
      { name: "Fatima Al-Zahra", email: "fatima@gymxp.dev",  clerkId: "seed_client_3",  trainerId: ahmed, age: 22, goal: "Improve overall fitness and energy",  xp: 680  },
      { name: "Yousef Ibrahim",  email: "yousef@gymxp.dev",  clerkId: "seed_client_4",  trainerId: ahmed, age: 41, goal: "Maintain weight and stay active",     xp: 2750 },
      // Sara's 3
      { name: "Rania Saleh",     email: "rania@gymxp.dev",   clerkId: "seed_client_5",  trainerId: sara,  age: 29, goal: "Run a 5K without stopping",           xp: 950  },
      { name: "Tariq Nabulsi",   email: "tariq@gymxp.dev",   clerkId: "seed_client_6",  trainerId: sara,  age: 38, goal: "Recover from back injury",            xp: 150  },
      { name: "Hana Moussa",     email: "hana@gymxp.dev",    clerkId: "seed_client_7",  trainerId: sara,  age: 25, goal: "Tone up and build flexibility",       xp: 3200 },
      // Omar's 3
      { name: "Bilal Khoury",    email: "bilal@gymxp.dev",   clerkId: "seed_client_8",  trainerId: omar,  age: 31, goal: "Gain 5 kg of lean muscle",            xp: 1850 },
      { name: "Nadia Farouk",    email: "nadia@gymxp.dev",   clerkId: "seed_client_9",  trainerId: omar,  age: 45, goal: "Improve cardio and endurance",        xp: 450  },
      { name: "Sami Aoun",       email: "sami@gymxp.dev",    clerkId: "seed_client_10", trainerId: omar,  age: 18, goal: "Learn proper form and build base",    xp: 2200 },
    ];

    const clientIds: Id<"clients">[] = [];
    for (const c of clientUserData) {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: `seed|${c.clerkId}`,
        clerkId: c.clerkId,
        name: c.name,
        email: c.email,
        role: "client",
        createdAt: now,
      });

      const clientId = await ctx.db.insert("clients", {
        userId,
        trainerId: c.trainerId,
        age: c.age,
        goal: c.goal,
        isEnrolled: true,
        currentXP: c.xp,
        currentTier: tierFromXP(c.xp),
        createdAt: now,
      });

      clientIds.push(clientId);
    }

    // ── Challenges (3 per client) ────────────────────────────────────────────
    const challengeTemplates = [
      { title: "Complete 50 push-ups",          description: "Do 50 push-ups in a single session without breaking form.", xpReward: 100 },
      { title: "7-day workout streak",           description: "Train every day for 7 consecutive days.",                  xpReward: 200 },
      { title: "Drink 2L of water daily",        description: "Hit your hydration goal for 5 days straight.",             xpReward: 75  },
      { title: "Run 3 km under 20 min",          description: "Complete a 3 km run in under 20 minutes.",                xpReward: 150 },
      { title: "Master the deadlift form",       description: "Complete a form check session with your trainer.",         xpReward: 125 },
      { title: "Attend 3 group classes",         description: "Participate in 3 scheduled group training sessions.",      xpReward: 90  },
      { title: "Log meals for 5 days",           description: "Track every meal in the app for 5 consecutive days.",      xpReward: 80  },
      { title: "Hold a 2-min plank",             description: "Hold a plank position for 2 minutes continuously.",        xpReward: 110 },
      { title: "10 pull-ups unassisted",         description: "Complete 10 strict pull-ups in one set.",                  xpReward: 175 },
      { title: "Stretch for 15 min post-workout",description: "Cool down with a full 15-minute stretch after training.",  xpReward: 60  },
    ];

    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      const trainerId = clientUserData[i].trainerId;

      // Pick 3 challenge templates rotating through the list
      for (let j = 0; j < 3; j++) {
        const template = challengeTemplates[(i * 3 + j) % challengeTemplates.length];
        // Mix statuses: first challenge completed, rest pending (with variation)
        const isCompleted = j === 0 || (i % 3 === 0 && j === 1);

        await ctx.db.insert("challenges", {
          title: template.title,
          description: template.description,
          xpReward: template.xpReward,
          assignedTo: clientId,
          assignedBy: trainerId,
          status: isCompleted ? "completed" : "pending",
          completedAt: isCompleted ? now - 1000 * 60 * 60 * 24 * (j + 1) : undefined,
        });
      }
    }

    // ── XP Logs (2 per client) ───────────────────────────────────────────────
    const xpLogReasons = [
      "Completed weekly challenge",
      "Perfect attendance this week",
      "Personal record on bench press",
      "Finished first 5K run",
      "Nutrition goal met for 7 days",
      "Trainer bonus for outstanding effort",
      "Completed beginner program",
      "10-day workout streak",
      "Improved squat max by 20 kg",
      "Consistency reward — 30 sessions logged",
    ];

    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      const trainerId = clientUserData[i].trainerId;
      const totalXP = clientUserData[i].xp;

      // Split XP across 2 log entries (70% / 30%)
      const firstAmount = Math.round(totalXP * 0.7);
      const secondAmount = totalXP - firstAmount;

      await ctx.db.insert("xpLogs", {
        clientId,
        amount: firstAmount,
        reason: xpLogReasons[(i * 2) % xpLogReasons.length],
        awardedBy: trainerId,
        createdAt: now - 1000 * 60 * 60 * 24 * 14,
      });

      await ctx.db.insert("xpLogs", {
        clientId,
        amount: secondAmount,
        reason: xpLogReasons[(i * 2 + 1) % xpLogReasons.length],
        awardedBy: trainerId,
        createdAt: now - 1000 * 60 * 60 * 24 * 3,
      });
    }

    return {
      trainers: trainerIds.length,
      clients: clientIds.length,
      challenges: clientIds.length * 3,
      xpLogs: clientIds.length * 2,
    };
  },
});
