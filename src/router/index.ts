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
      path: '/onboarding',
      component: () => import('../views/OnboardingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      redirect: () => {
        const authStore = useAuthStore()
        const role = authStore.convexUser?.role
        if (role === 'trainer') return '/trainer/dashboard'
        if (role === 'client') return '/client/dashboard'
        if (role === 'nutritionist') return '/nutritionist/dashboard'
        return '/onboarding'
      },
    },
    {
      path: '/trainer',
      component: () => import('../layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          component: () => import('../views/trainer/TrainerDashboardView.vue'),
        },
      ],
    },
    {
      path: '/client',
      component: () => import('../layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          component: () => import('../views/client/ClientDashboardView.vue'),
        },
      ],
    },
    {
      path: '/nutritionist',
      component: () => import('../layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          component: () => import('../views/nutritionist/NutritionistDashboardView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for Clerk to finish loading
  await authStore.waitForLoad()

  // Redirect unauthenticated users away from protected routes
  if (to.meta.requiresAuth && !authStore.isSignedIn) {
    return { path: '/sign-in' }
  }

  // Redirect authenticated users away from guest routes
  if (to.meta.requiresGuest && authStore.isSignedIn) {
    return { path: '/dashboard' }
  }
})

export default router
