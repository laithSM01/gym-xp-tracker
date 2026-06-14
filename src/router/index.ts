import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public routes — no auth required
    {
      path: '/',
      component: () => import('@/layouts/PublicLayout.vue'),
      children: [
        {
          path: '',
          name: 'landing',
          component: () => import('@/views/public/LandingView.vue'),
        },
      ],
    },
    {
      path: '/sign-in',
      component: () => import('@/layouts/AuthLayout.vue'),
    },
    {
      path: '/onboarding',
      component: () => import('@/views/OnboardingView.vue'),
    },
    // Authenticated routes
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
        {
          path: 'gym/dashboard',
          component: () => import('@/views/gym/GymDashboardView.vue'),
        },
      ],
    },
  ],
})

const roleDashboard: Record<string, string> = {
  trainer: '/trainer/dashboard',
  client: '/client/dashboard',
  nutritionist: '/nutritionist/dashboard',
  gym_owner: '/gym/dashboard',
}

const rolePrefix: Record<string, string> = {
  trainer: '/trainer/',
  client: '/client/',
  nutritionist: '/nutritionist/',
  gym_owner: '/gym/',
}

const PUBLIC_PATHS = ['/', '/sign-in', '/onboarding']

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.waitForLoad()

  // Public paths are always accessible
  if (PUBLIC_PATHS.includes(to.path)) {
    // Signed-in users on / or /sign-in redirect to their dashboard
    if (authStore.isSignedIn && (to.path === '/' || to.path === '/sign-in')) {
      await authStore.waitForUser()
      const role = authStore.convexUser?.role
      return role ? roleDashboard[role] : '/onboarding'
    }
    return true
  }

  // All other routes require auth
  if (!authStore.isSignedIn) {
    return '/sign-in'
  }

  // Prevent cross-role navigation
  if (authStore.isSignedIn) {
    await authStore.waitForUser()
    const role = authStore.convexUser?.role
    if (role) {
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
