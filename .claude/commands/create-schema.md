Read CLAUDE.md and convex/\_generated/ai/guidelines.md first.

Create convex/schema.ts for a gym management app with these tables:

users: clerkId, name, email, role (trainer/client/nutritionist), createdAt
clients: userId, trainerId, age, goal, isEnrolled, currentXP, currentTier (beginner/novice/intermediate/advanced/elite), createdAt
challenges: title, description, xpReward, assignedTo (clientId), assignedBy (trainerId), status (pending/completed), completedAt
xpLogs: clientId, amount, reason, awardedBy (trainerId), createdAt
programs: clientId, trainerId, title, startDate, endDate, exercises (array), status (active/completed)
nutritionPlans: clientId, nutritionistId, tier, meals (array), calories, notes, createdAt

Use proper Convex v_string, v_number, v_id, v_union, v_literal types. Add indexes for common queries like by trainerId, by clientId.
