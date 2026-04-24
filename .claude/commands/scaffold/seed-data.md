Read CLAUDE.md and convex/\_generated/ai/guidelines.md first.

Create convex/seed.ts with a mutation that seeds realistic gym data:

- 3 trainers with names: Ahmed Al-Rashid, Sara Khalil, Omar Nasser
- 10 clients spread across trainers (4, 3, 3)
- Each client has realistic age (18-45), goal, XP between 0-3500, and a tier matching their XP
- 3 challenges per client (mix of pending and completed)
- 2 xpLog entries per client showing XP history

Make it a single Convex mutation called seed.runSeed that can be called from the Convex dashboard.
