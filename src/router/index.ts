import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/sign-in',
      component: () => import('../layouts/AuthLayout.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/dashboard',
      component: () => import('../layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('../views/DashboardView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.waitForLoad()

  if (to.meta.requiresAuth && !authStore.isSignedIn) {
    return { path: '/sign-in' }
  }

  if (to.meta.requiresGuest && authStore.isSignedIn) {
    return { path: '/dashboard' }
  }
})

export default router
