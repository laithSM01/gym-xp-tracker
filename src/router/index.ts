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
    // Public invite route — accessible without auth
    {
      path: '/invite/gym',
      component: () => import('@/views/public/InviteAcceptView.vue'),
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
          path: 'trainer/setup',
          component: () => import('@/views/trainer/TrainerSetupView.vue'),
        },
        {
          path: 'client/dashboard',
          component: () => import('@/views/client/ClientDashboardView.vue'),
        },
        {
          path: 'client/setup',
          component: () => import('@/views/client/ClientSetupView.vue'),
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
        {
          path: 'gym/setup',
          component: () => import('@/views/gym/GymSetupView.vue'),
        },
        {
          path: 'gym-trainer/dashboard',
          component: () => import('@/views/gym-trainer/GymTrainerDashboardView.vue'),
        },
      ],
    },
  ],
})

const roleDashboard: Record<string, string> = {
  trainer: '/trainer/dashboard',
  gym_trainer: '/gym-trainer/dashboard',
  client: '/client/dashboard',
  nutritionist: '/nutritionist/dashboard',
  gym_owner: '/gym/dashboard',
}

const rolePrefix: Record<string, string> = {
  trainer: '/trainer/',
  gym_trainer: '/gym-trainer/',
  client: '/client/',
  nutritionist: '/nutritionist/',
  gym_owner: '/gym/',
}

const PUBLIC_PATHS = ['/', '/sign-in', '/onboarding', '/invite/gym']

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

  // Signed-in but no Convex user row yet — must complete onboarding first
  await authStore.waitForUser()
  if (!authStore.convexUser?.role) {
    return '/onboarding'
  }

  // Prevent cross-role navigation
  if (authStore.isSignedIn) {
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
