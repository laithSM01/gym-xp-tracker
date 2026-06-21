import './main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue'
import { ConvexClient } from 'convex/browser'
import router from './router'
import App from './App.vue'
import { ConvexGymsService } from './services/convex/gyms.convex'
import { ConvexTrainersService } from './services/convex/trainers.convex'
import { ConvexClientsService } from './services/convex/clients.convex'
import { ConvexGymInvitesService } from './services/convex/gym-invites.convex'
import { ConvexJoinRequestsService } from './services/convex/join-requests.convex'
import { ConvexProductsService } from './services/convex/products.convex'
import { ConvexGymTrainerService } from './services/convex/gym-trainer.convex'

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
})
app.provide('convex', convex)
app.provide('gymsService', new ConvexGymsService(convex))
app.provide('trainersService', new ConvexTrainersService(convex))
app.provide('clientsService', new ConvexClientsService(convex))
app.provide('gymInvitesService', new ConvexGymInvitesService(convex))
app.provide('joinRequestsService', new ConvexJoinRequestsService(convex))
app.provide('productsService', new ConvexProductsService(convex))
app.provide('gymTrainerService', new ConvexGymTrainerService(convex))

app.mount('#app')
