Read CLAUDE.md and convex/\_generated/ai/guidelines.md first.

Build the trainer dashboard for this gym management app:

1. Create convex/clients.ts with:
   - query getMyClients: returns all clients for the logged in trainer, ordered by XP desc
   - query getClientById: returns single client with full details
   - mutation awardXP: adds XP to a client, creates xpLog entry, updates tier if threshold hit

2. Create src/views/trainer/DashboardView.vue:
   - Shows trainer name and total client count
   - Client roster as cards: name, tier badge, XP bar, goal
   - Click a client to open their detail page
   - Real-time updates via Convex useQuery

3. Create src/views/trainer/ClientDetailView.vue:
   - Full client profile: XP bar with tier progress, current tier badge
   - Award XP button with amount input and reason
   - Active challenges list
   - Recent XP history feed

Use Tailwind CSS. Make it look clean and professional. Use these tier colors:
Beginner=gray, Novice=blue, Intermediate=amber, Advanced=purple, Elite=green
