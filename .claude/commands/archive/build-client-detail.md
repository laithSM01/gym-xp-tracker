Create src/views/trainer/ClientDetailView.vue with:

- Client name, tier badge, age, goal at the top
- XP bar showing progress within current tier
- Award XP form: number input for amount, text input for reason, submit button
- On submit call convex mutation api.clients.awardXP
- Active challenges list with XP reward shown
- XP history feed showing last 10 entries

Use the same tier colors as TrainerDashboardView.vue:
beginner=gray, novice=blue, intermediate=amber, advanced=purple, elite=green

Get the clientId from useRoute().params.clientId and use it to
call api.clients.getClientById
