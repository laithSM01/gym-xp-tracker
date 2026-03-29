import './main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue'
import { ConvexClient } from 'convex/browser'
import router from './router'
import App from './App.vue'

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
})
app.provide('convex', convex)

app.mount('#app')
