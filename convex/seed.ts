import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const oneYear = 365 * 24 * 60 * 60 * 1000;

    // ── Step 1: Gym Owner Users ──────────────────────────────────────────────
    const gymOwnerData = [
      { name: "Ahmad Al-Bishawi", email: "ahmad@ironhouse.jo", clerkId: "seed_gym_owner_1" },
      { name: "Maha Sharaf",      email: "maha@queensfitness.jo", clerkId: "seed_gym_owner_2" },
      { name: "Walid Khamis",     email: "walid@alphawarriors.jo", clerkId: "seed_gym_owner_3" },
      { name: "Ramzi Haddad",     email: "ramzi@fitlife.jo", clerkId: "seed_gym_owner_4" },
      { name: "Nader Abu-Ali",    email: "nader@boxfit.jo", clerkId: "seed_gym_owner_5" },
    ];

    const gymOwnerIds: Id<"users">[] = [];
    for (const o of gymOwnerData) {
      const id = await ctx.db.insert("users", {
        tokenIdentifier: `seed|${o.clerkId}`,
        clerkId: o.clerkId,
        name: o.name,
        email: o.email,
        role: "gym_owner",
        createdAt: now,
      });
      gymOwnerIds.push(id);
    }

    const [ownerId1, ownerId2, ownerId3, ownerId4, ownerId5] = gymOwnerIds as [
      Id<"users">, Id<"users">, Id<"users">, Id<"users">, Id<"users">
    ];

    // ── Step 2: Gyms ─────────────────────────────────────────────────────────
    const gymId1 = await ctx.db.insert("gyms", {
      ownerId: ownerId1,
      name: "Iron House Gym",
      bio: "Amman's premier mixed gym with top-tier equipment and expert trainers.",
      location: "Sweifieh, Amman",
      city: "Amman",
      genderType: "mixed",
      genderSections: [{
        gender: "mixed",
        label: "Mixed",
        weekdays: "6AM–11PM",
        weekends: "8AM–10PM",
        friday: "2PM–10PM",
      }],
      facilities: ["weights", "cardio", "sauna", "locker rooms", "parking"],
      pricingPlans: [
        { duration: "1_month",   priceJod: 35,  isOffer: false },
        { duration: "12_months", priceJod: 300, isOffer: false },
      ],
      isActive: true,
      trainersUsed: 2,
      clientsAdded: 0,
      productsListed: 0,
      createdAt: now,
    });

    const gymId2 = await ctx.db.insert("gyms", {
      ownerId: ownerId2,
      name: "Queens Fitness",
      bio: "A dedicated women-only fitness center with group classes and cardio equipment.",
      location: "Abdoun, Amman",
      city: "Amman",
      genderType: "female",
      facilities: ["cardio", "group classes", "women section", "locker rooms"],
      pricingPlans: [
        { duration: "1_month",  priceJod: 30, isOffer: false },
        { duration: "3_months", priceJod: 80, isOffer: false },
      ],
      isActive: true,
      trainersUsed: 2,
      clientsAdded: 0,
      productsListed: 0,
      createdAt: now,
    });

    const gymId3 = await ctx.db.insert("gyms", {
      ownerId: ownerId3,
      name: "Alpha Warriors",
      bio: "Zarqa's hardcore training ground for serious lifters and combat sports athletes.",
      location: "Al-Zarqa",
      city: "Zarqa",
      genderType: "male",
      facilities: ["weights", "boxing", "cardio"],
      pricingPlans: [
        { duration: "1_month", priceJod: 20, isOffer: false },
      ],
      isActive: true,
      trainersUsed: 2,
      clientsAdded: 0,
      productsListed: 0,
      createdAt: now,
    });

    const gymId4 = await ctx.db.insert("gyms", {
      ownerId: ownerId4,
      name: "FitLife Center",
      bio: "Irbid's most complete fitness facility with swimming pool and diverse training options.",
      location: "Downtown Irbid",
      city: "Irbid",
      genderType: "mixed",
      facilities: ["weights", "cardio", "swimming pool", "parking"],
      pricingPlans: [
        { duration: "1_month",   priceJod: 25,  isOffer: false },
        { duration: "6_months",  priceJod: 130, isOffer: false },
        { duration: "12_months", priceJod: 240, isOffer: true, offerExpiresAt: now + thirtyDays },
      ],
      isActive: true,
      trainersUsed: 2,
      clientsAdded: 0,
      productsListed: 0,
      createdAt: now,
    });

    const gymId5 = await ctx.db.insert("gyms", {
      ownerId: ownerId5,
      name: "BoxFit Jordan",
      bio: "Amman's top boxing and functional fitness gym.",
      location: "Khalda, Amman",
      city: "Amman",
      genderType: "male",
      facilities: ["boxing", "cardio", "locker rooms"],
      pricingPlans: [
        { duration: "1_month",  priceJod: 28, isOffer: false },
        { duration: "3_months", priceJod: 75, isOffer: false },
      ],
      isActive: true,
      trainersUsed: 2,
      clientsAdded: 0,
      productsListed: 0,
      createdAt: now,
    });

    // ── Step 3: Gym Subscriptions ─────────────────────────────────────────────
    const gymSubData: { gymId: Id<"gyms">; plan: "gym_large" | "gym_medium" | "gym_small"; aiGenerationsLimit: number }[] = [
      { gymId: gymId1, plan: "gym_large",  aiGenerationsLimit: -1  },
      { gymId: gymId2, plan: "gym_medium", aiGenerationsLimit: 100 },
      { gymId: gymId3, plan: "gym_small",  aiGenerationsLimit: 50  },
      { gymId: gymId4, plan: "gym_medium", aiGenerationsLimit: 100 },
      { gymId: gymId5, plan: "gym_small",  aiGenerationsLimit: 50  },
    ];

    for (const s of gymSubData) {
      await ctx.db.insert("subscriptions", {
        gymId: s.gymId,
        plan: s.plan,
        status: "active",
        currentPeriodEnd: now + oneYear,
        aiGenerationsUsed: 0,
        aiGenerationsLimit: s.aiGenerationsLimit,
        pricePaidJod: 0,
        createdAt: now,
      });
    }

    // ── Steps 4–6: Gym Trainers + Invitations + Affiliations ─────────────────
    const gymTrainerData = [
      { name: "Hassan Al-Omari", email: "hassan@ironhouse.jo",    clerkId: "seed_gym_trainer_1",  gymId: gymId1 },
      { name: "Nadia Khalaf",    email: "nadia@ironhouse.jo",     clerkId: "seed_gym_trainer_2",  gymId: gymId1 },
      { name: "Tariq Mansour",   email: "tariq@queensfitness.jo", clerkId: "seed_gym_trainer_3",  gymId: gymId2 },
      { name: "Rima Saleh",      email: "rima@queensfitness.jo",  clerkId: "seed_gym_trainer_4",  gymId: gymId2 },
      { name: "Bilal Khoury",    email: "bilal@alphawarriors.jo", clerkId: "seed_gym_trainer_5",  gymId: gymId3 },
      { name: "Dina Haddad",     email: "dina@alphawarriors.jo",  clerkId: "seed_gym_trainer_6",  gymId: gymId3 },
      { name: "Sami Aoun",       email: "sami@fitlife.jo",        clerkId: "seed_gym_trainer_7",  gymId: gymId4 },
      { name: "Lara Al-Masri",   email: "lara@fitlife.jo",        clerkId: "seed_gym_trainer_8",  gymId: gymId4 },
      { name: "Faris Nabulsi",   email: "faris@boxfit.jo",        clerkId: "seed_gym_trainer_9",  gymId: gymId5 },
      { name: "Maya Ibrahim",    email: "maya@boxfit.jo",         clerkId: "seed_gym_trainer_10", gymId: gymId5 },
    ];

    const gymTrainerUserIds: Id<"users">[] = [];
    for (let i = 0; i < gymTrainerData.length; i++) {
      const t = gymTrainerData[i]!;
      const n = i + 1;

      const userId = await ctx.db.insert("users", {
        tokenIdentifier: `seed|${t.clerkId}`,
        clerkId: t.clerkId,
        name: t.name,
        email: t.email,
        role: "gym_trainer",
        createdAt: now,
      });

      const inviteId = await ctx.db.insert("gymInvitations", {
        gymId: t.gymId,
        invitedEmail: t.email,
        invitedName: t.name,
        inviteToken: `seed_token_gym_trainer_${n}`,
        status: "accepted",
        createdAt: now,
        expiresAt: now + thirtyDays,
        acceptedAt: now,
        acceptedByUserId: userId,
      });

      await ctx.db.insert("trainerGymAffiliation", {
        gymTrainerUserId: userId,
        gymId: t.gymId,
        affiliationRole: "trainer",
        inviteId,
        joinedAt: now,
        isActive: true,
      });

      gymTrainerUserIds.push(userId);
    }

    // gymTrainerUserIds[0,1] = Iron House; [2,3] = Queens; [4,5] = Alpha; [6,7] = FitLife; [8,9] = BoxFit

    // ── Steps 8–10: Personal Trainers + Profiles + Subscriptions ─────────────
    const ptUserData = [
      {
        name: "Yusuf Al-Ahmad", email: "yusuf@pt.jo", clerkId: "seed_pt_1",
        bio: "Certified trainer specializing in weight loss, muscle building, and HIIT. 6 years of experience helping clients transform.",
        specializations: ["weight loss", "muscle building", "HIIT"],
        certifications: ["NASM CPT"],
        yearsOfExperience: 6,
      },
      {
        name: "Hala Nassar", email: "hala@pt.jo", clerkId: "seed_pt_2",
        bio: "Yoga instructor and women's fitness specialist focused on flexibility and mindful movement.",
        specializations: ["yoga", "flexibility", "women fitness"],
        certifications: ["ACE", "RYT-200"],
        yearsOfExperience: 8,
      },
      {
        name: "Khaled Zubaidi", email: "khaled@pt.jo", clerkId: "seed_pt_3",
        bio: "Powerlifting coach with a passion for strength conditioning and competition preparation.",
        specializations: ["powerlifting", "strength conditioning"],
        certifications: ["ISSA"],
        yearsOfExperience: 5,
      },
      {
        name: "Rana Khalil", email: "rana@pt.jo", clerkId: "seed_pt_4",
        bio: "Boxing coach and functional training expert. Builds both fitness and technique simultaneously.",
        specializations: ["boxing", "cardio", "functional training"],
        certifications: ["Boxing Coach Level 2"],
        yearsOfExperience: 4,
      },
      {
        name: "Amjad Al-Masri", email: "amjad@pt.jo", clerkId: "seed_pt_5",
        bio: "CrossFit and endurance specialist helping athletes push their limits with science-based programming.",
        specializations: ["crossfit", "endurance", "running"],
        certifications: ["NASM CPT", "CrossFit L1"],
        yearsOfExperience: 7,
      },
    ];

    const ptUserIds: Id<"users">[] = [];
    const ptProfileIds: Id<"personalTrainers">[] = [];

    for (const pt of ptUserData) {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: `seed|${pt.clerkId}`,
        clerkId: pt.clerkId,
        name: pt.name,
        email: pt.email,
        role: "trainer",
        createdAt: now,
      });
      ptUserIds.push(userId);

      const profileId = await ctx.db.insert("personalTrainers", {
        userId,
        bio: pt.bio,
        certifications: pt.certifications,
        specializations: pt.specializations,
        yearsOfExperience: pt.yearsOfExperience,
        isActive: true,
        clientsAdded: 0,
        productsListed: 0,
        createdAt: now,
      });
      ptProfileIds.push(profileId);

      await ctx.db.insert("subscriptions", {
        trainerProfileId: profileId,
        plan: "personal_trainer",
        status: "active",
        currentPeriodEnd: now + oneYear,
        aiGenerationsUsed: 0,
        aiGenerationsLimit: 30,
        pricePaidJod: 0,
        createdAt: now,
      });
    }

    const [ptUserId1, ptUserId2, ptUserId3, ptUserId4, ptUserId5] = ptUserIds as [
      Id<"users">, Id<"users">, Id<"users">, Id<"users">, Id<"users">
    ];
    const [ptProfileId1, ptProfileId2, ptProfileId3, ptProfileId4, ptProfileId5] = ptProfileIds as [
      Id<"personalTrainers">, Id<"personalTrainers">, Id<"personalTrainers">, Id<"personalTrainers">, Id<"personalTrainers">
    ];

    // ── Steps 11–14: Clients + Challenges + XP Logs ──────────────────────────
    type ClientSeed = {
      name: string;
      email: string;
      clerkId: string;
      age: number;
      gender: "male" | "female";
      goal: string;
      height: number;
      city: string;
      sportTypes: ("gym" | "swimming" | "boxing" | "football" | "running" | "crossfit")[];
      preferredTrainingDays: "2-3" | "3-4" | "4-5" | "5-6";
      xp: number;
      gymId?: Id<"gyms">;
      trainerId?: Id<"users">;
      isEnrolled: boolean;
      assignedBy: Id<"users">;
    };

    const clientData: ClientSeed[] = [
      // ── Gym-enrolled (8) ──────────────────────────────────────────────────
      {
        name: "Layla Hassan", email: "layla@seed.jo", clerkId: "seed_client_1",
        age: 27, gender: "female", height: 163, city: "Amman",
        goal: "Lose weight before summer", sportTypes: ["gym"],
        preferredTrainingDays: "3-4", xp: 420,
        gymId: gymId1, isEnrolled: true, assignedBy: gymTrainerUserIds[0]!,
      },
      {
        name: "Karim Mansour", email: "karim@seed.jo", clerkId: "seed_client_2",
        age: 34, gender: "male", height: 178, city: "Amman",
        goal: "Build muscle and increase strength", sportTypes: ["gym"],
        preferredTrainingDays: "4-5", xp: 1450,
        gymId: gymId1, isEnrolled: true, assignedBy: gymTrainerUserIds[0]!,
      },
      {
        name: "Rana Haddad", email: "rana.h@seed.jo", clerkId: "seed_client_3",
        age: 29, gender: "female", height: 165, city: "Amman",
        goal: "Tone up and build flexibility", sportTypes: ["gym", "running"],
        preferredTrainingDays: "3-4", xp: 680,
        gymId: gymId2, isEnrolled: true, assignedBy: gymTrainerUserIds[2]!,
      },
      {
        name: "Hana Moussa", email: "hana@seed.jo", clerkId: "seed_client_4",
        age: 22, gender: "female", height: 161, city: "Amman",
        goal: "Improve overall fitness and energy", sportTypes: ["gym"],
        preferredTrainingDays: "2-3", xp: 320,
        gymId: gymId2, isEnrolled: true, assignedBy: gymTrainerUserIds[2]!,
      },
      {
        name: "Yousef Ibrahim", email: "yousef@seed.jo", clerkId: "seed_client_5",
        age: 38, gender: "male", height: 182, city: "Irbid",
        goal: "Improve cardio and swimming performance", sportTypes: ["gym", "swimming"],
        preferredTrainingDays: "4-5", xp: 950,
        gymId: gymId4, isEnrolled: true, assignedBy: gymTrainerUserIds[6]!,
      },
      {
        name: "Nadia Farouk", email: "nadia@seed.jo", clerkId: "seed_client_6",
        age: 42, gender: "female", height: 160, city: "Irbid",
        goal: "Weight management and wellness", sportTypes: ["gym"],
        preferredTrainingDays: "2-3", xp: 210,
        gymId: gymId4, isEnrolled: true, assignedBy: gymTrainerUserIds[6]!,
      },
      {
        name: "Bilal Al-Khoury", email: "bilal.k@seed.jo", clerkId: "seed_client_7",
        age: 25, gender: "male", height: 175, city: "Zarqa",
        goal: "Gain lean muscle through boxing and lifting", sportTypes: ["boxing", "gym"],
        preferredTrainingDays: "5-6", xp: 1850,
        gymId: gymId3, isEnrolled: true, assignedBy: gymTrainerUserIds[4]!,
      },
      {
        name: "Samer Nabulsi", email: "samer@seed.jo", clerkId: "seed_client_8",
        age: 19, gender: "male", height: 172, city: "Zarqa",
        goal: "Learn boxing fundamentals and build base fitness", sportTypes: ["boxing"],
        preferredTrainingDays: "3-4", xp: 150,
        gymId: gymId3, isEnrolled: true, assignedBy: gymTrainerUserIds[4]!,
      },
      // ── Personal trainer clients (8) ─────────────────────────────────────
      {
        name: "Fatima Al-Zahra", email: "fatima@seed.jo", clerkId: "seed_client_9",
        age: 31, gender: "female", height: 162, city: "Amman",
        goal: "Post-pregnancy fitness recovery", sportTypes: ["gym"],
        preferredTrainingDays: "3-4", xp: 540,
        trainerId: ptUserId1, isEnrolled: true, assignedBy: ptUserId1,
      },
      {
        name: "Omar Saleh", email: "omar@seed.jo", clerkId: "seed_client_10",
        age: 28, gender: "male", height: 180, city: "Amman",
        goal: "Lose 15 kg through structured training", sportTypes: ["gym", "running"],
        preferredTrainingDays: "4-5", xp: 2200,
        trainerId: ptUserId1, isEnrolled: true, assignedBy: ptUserId1,
      },
      {
        name: "Dina Khalaf", email: "dina.kh@seed.jo", clerkId: "seed_client_11",
        age: 35, gender: "female", height: 167, city: "Amman",
        goal: "Yoga-based flexibility and mindful movement", sportTypes: ["gym"],
        preferredTrainingDays: "3-4", xp: 780,
        trainerId: ptUserId2, isEnrolled: true, assignedBy: ptUserId2,
      },
      {
        name: "Dalia Nasser", email: "dalia@seed.jo", clerkId: "seed_client_12",
        age: 24, gender: "female", height: 159, city: "Amman",
        goal: "Core strength and better posture", sportTypes: ["gym"],
        preferredTrainingDays: "2-3", xp: 340,
        trainerId: ptUserId2, isEnrolled: true, assignedBy: ptUserId2,
      },
      {
        name: "Tariq Zuhdi", email: "tariq.z@seed.jo", clerkId: "seed_client_13",
        age: 22, gender: "male", height: 176, city: "Irbid",
        goal: "Powerlifting competition preparation", sportTypes: ["gym"],
        preferredTrainingDays: "5-6", xp: 3100,
        trainerId: ptUserId3, isEnrolled: true, assignedBy: ptUserId3,
      },
      {
        name: "Ahmad Al-Nabulsi", email: "ahmad.n@seed.jo", clerkId: "seed_client_14",
        age: 30, gender: "male", height: 179, city: "Irbid",
        goal: "Strength conditioning and lean bulk", sportTypes: ["gym"],
        preferredTrainingDays: "4-5", xp: 1200,
        trainerId: ptUserId3, isEnrolled: true, assignedBy: ptUserId3,
      },
      {
        name: "Lara Al-Sharif", email: "lara.sh@seed.jo", clerkId: "seed_client_15",
        age: 27, gender: "female", height: 164, city: "Amman",
        goal: "Learn boxing and drop 8 kg", sportTypes: ["boxing", "gym"],
        preferredTrainingDays: "3-4", xp: 460,
        trainerId: ptUserId4, isEnrolled: true, assignedBy: ptUserId4,
      },
      {
        name: "Sami Hassan", email: "sami.h@seed.jo", clerkId: "seed_client_16",
        age: 33, gender: "male", height: 183, city: "Irbid",
        goal: "CrossFit and endurance training", sportTypes: ["crossfit", "gym"],
        preferredTrainingDays: "4-5", xp: 2750,
        trainerId: ptUserId5, isEnrolled: true, assignedBy: ptUserId5,
      },
      // ── Free pool (4) ─────────────────────────────────────────────────────
      {
        name: "Nour Al-Rashid", email: "nour@seed.jo", clerkId: "seed_client_17",
        age: 20, gender: "female", height: 163, city: "Amman",
        goal: "Get started with fitness and build a routine", sportTypes: ["gym"],
        preferredTrainingDays: "2-3", xp: 0,
        isEnrolled: false, assignedBy: gymTrainerUserIds[0]!,
      },
      {
        name: "Mazen Khalil", email: "mazen@seed.jo", clerkId: "seed_client_18",
        age: 45, gender: "male", height: 174, city: "Irbid",
        goal: "Recover from back injury with proper guidance", sportTypes: ["gym"],
        preferredTrainingDays: "2-3", xp: 0,
        isEnrolled: false, assignedBy: gymTrainerUserIds[0]!,
      },
      {
        name: "Rawan Saleh", email: "rawan@seed.jo", clerkId: "seed_client_19",
        age: 32, gender: "female", height: 166, city: "Amman",
        goal: "Find a training program that fits my lifestyle", sportTypes: ["running", "gym"],
        preferredTrainingDays: "3-4", xp: 0,
        isEnrolled: false, assignedBy: gymTrainerUserIds[0]!,
      },
      {
        name: "Hamzah Al-Ahmad", email: "hamzah@seed.jo", clerkId: "seed_client_20",
        age: 18, gender: "male", height: 178, city: "Zarqa",
        goal: "Build an athletic base for football", sportTypes: ["football", "gym"],
        preferredTrainingDays: "4-5", xp: 0,
        isEnrolled: false, assignedBy: gymTrainerUserIds[0]!,
      },
    ];

    const challengeTemplates = [
      { title: "Complete 50 push-ups",           description: "Do 50 push-ups in a single session without breaking form.", xpReward: 100 },
      { title: "7-day workout streak",            description: "Train every day for 7 consecutive days.",                  xpReward: 200 },
      { title: "Drink 2L of water daily",         description: "Hit your hydration goal for 5 days straight.",             xpReward: 75  },
      { title: "Run 3 km under 20 min",           description: "Complete a 3 km run in under 20 minutes.",                 xpReward: 150 },
      { title: "Master the deadlift form",        description: "Complete a form check session with your trainer.",          xpReward: 125 },
      { title: "Attend 3 group classes",          description: "Participate in 3 scheduled group training sessions.",       xpReward: 90  },
      { title: "Log meals for 5 days",            description: "Track every meal in the app for 5 consecutive days.",       xpReward: 80  },
      { title: "Hold a 2-min plank",              description: "Hold a plank position for 2 minutes continuously.",         xpReward: 110 },
      { title: "10 pull-ups unassisted",          description: "Complete 10 strict pull-ups in one set.",                   xpReward: 175 },
      { title: "Stretch for 15 min post-workout", description: "Cool down with a full 15-minute stretch after training.",   xpReward: 60  },
    ];

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

    const clientIds: Id<"clients">[] = [];
    let totalXpLogs = 0;

    for (let i = 0; i < clientData.length; i++) {
      const c = clientData[i]!;

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
        gymId: c.gymId,
        age: c.age,
        gender: c.gender,
        goal: c.goal,
        height: c.height,
        city: c.city,
        sportTypes: c.sportTypes,
        preferredTrainingDays: c.preferredTrainingDays,
        healthConditions: [],
        isEnrolled: c.isEnrolled,
        currentXP: c.xp,
        currentTier: tierFromXP(c.xp),
        nutritionistAccess: false,
        createdAt: now,
      });
      clientIds.push(clientId);

      // Challenges — 3 per client, mix of completed/pending
      for (let j = 0; j < 3; j++) {
        const template = challengeTemplates[(i * 3 + j) % challengeTemplates.length]!;
        const isCompleted = j === 0 || (i % 3 === 0 && j === 1);
        await ctx.db.insert("challenges", {
          title: template.title,
          description: template.description,
          xpReward: template.xpReward,
          assignedTo: clientId,
          assignedBy: c.assignedBy,
          status: isCompleted ? "completed" : "pending",
          completedAt: isCompleted ? now - 1000 * 60 * 60 * 24 * (j + 1) : undefined,
        });
      }

      // XP logs — 2 per client with XP, split 70/30
      if (c.xp > 0) {
        const firstAmount = Math.round(c.xp * 0.7);
        const secondAmount = c.xp - firstAmount;
        await ctx.db.insert("xpLogs", {
          clientId,
          amount: firstAmount,
          reason: xpLogReasons[(i * 2) % xpLogReasons.length]!,
          awardedBy: c.assignedBy,
          createdAt: now - 1000 * 60 * 60 * 24 * 14,
        });
        await ctx.db.insert("xpLogs", {
          clientId,
          amount: secondAmount,
          reason: xpLogReasons[(i * 2 + 1) % xpLogReasons.length]!,
          awardedBy: c.assignedBy,
          createdAt: now - 1000 * 60 * 60 * 24 * 3,
        });
        totalXpLogs += 2;
      }
    }

    // ── Step 15: Patch clientsAdded counters ─────────────────────────────────
    // Iron House=2, Queens=2, FitLife=2, Alpha=2, BoxFit=0 (no enrolled clients)
    await ctx.db.patch(gymId1, { clientsAdded: 2 });
    await ctx.db.patch(gymId2, { clientsAdded: 2 });
    await ctx.db.patch(gymId3, { clientsAdded: 2 });
    await ctx.db.patch(gymId4, { clientsAdded: 2 });

    // Yusuf=2, Hala=2, Khaled=2, Rana=1, Amjad=1
    await ctx.db.patch(ptProfileId1, { clientsAdded: 2 });
    await ctx.db.patch(ptProfileId2, { clientsAdded: 2 });
    await ctx.db.patch(ptProfileId3, { clientsAdded: 2 });
    await ctx.db.patch(ptProfileId4, { clientsAdded: 1 });
    await ctx.db.patch(ptProfileId5, { clientsAdded: 1 });

    return {
      gymOwners: 5,
      gyms: 5,
      gymSubscriptions: 5,
      gymTrainers: 10,
      personalTrainers: 5,
      ptSubscriptions: 5,
      clients: clientIds.length,
      challenges: clientIds.length * 3,
      xpLogs: totalXpLogs,
    };
  },
});
