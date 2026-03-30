import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/sign-in',
      component: () => import('@/layouts/AuthLayout.vue'),
    },
    {
      path: '/onboarding',
      component: () => import('@/views/OnboardingView.vue'),
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        {
          path: 'trainer/dashboard',
          component: () => import('@/views/trainer/TrainerDashboardView.vue'),
        },
        {
          path: 'trainer/client/:clientId',
          component: () => import('@/views/trainer/ClientDetailView.vue'),
        },
        {
          path: 'trainer/new-client',
          component: () => import('@/views/trainer/NewClientView.vue'),
        },
        {
          path: 'client/dashboard',
          component: () => import('@/views/client/ClientDashboardView.vue'),
        },
        {
          path: 'nutritionist/dashboard',
          component: () => import('@/views/nutritionist/NutritionistDashboardView.vue'),
        },
        {
          path: 'nutritionist/client/:clientId',
          component: () => import('@/views/nutritionist/ClientNutritionView.vue'),
        },
      ],
    },
  ],
})

const roleDashboard: Record<string, string> = {
  trainer: '/trainer/dashboard',
  client: '/client/dashboard',
  nutritionist: '/nutritionist/dashboard',
}

const rolePrefix: Record<string, string> = {
  trainer: '/trainer/',
  client: '/client/',
  nutritionist: '/nutritionist/',
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.waitForLoad()

  if (!authStore.isSignedIn && to.path !== '/sign-in' && to.path !== '/onboarding') {
    return '/sign-in'
  }

  if (authStore.isSignedIn && to.path === '/sign-in') {
    return '/onboarding'
  }

  if (authStore.isSignedIn) {
    await authStore.waitForUser()
    const role = authStore.convexUser?.role
    if (role) {
      // If navigating to a role-prefixed route that doesn't belong to this role, redirect
      for (const [r, prefix] of Object.entries(rolePrefix)) {
        if (to.path.startsWith(prefix) && r !== role) {
          return roleDashboard[role]
        }
      }
    }
  }

  return true
})

export default router
