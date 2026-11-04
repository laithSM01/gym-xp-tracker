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
          name: 'home',
          component: () => import('@/views/public/HomeView.vue'),
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
    // Client dashboard — full-screen layout (no AppLayout header)
    {
      path: '/',
      component: () => import('@/layouts/ClientLayout.vue'),
      children: [
        {
          path: 'client/dashboard',
          component: () => import('@/views/client/ClientDashboardView.vue'),
        },
      ],
    },
    // Trainer routes — persistent sidebar app-shell
    {
      path: '/',
      component: () => import('@/layouts/TrainerLayout.vue'),
      children: [
        {
          path: 'trainer/dashboard',
          component: () => import('@/views/trainer/TrainerDashboardView.vue'),
        },
        {
          path: 'trainer/clients',
          component: () => import('@/views/trainer/ClientsView.vue'),
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
          path: 'trainer/schedule',
          component: () => import('@/views/trainer/ComingSoonView.vue'),
          meta: { title: 'Schedule', description: 'Session scheduling and calendar booking are coming soon.' },
        },
        {
          path: 'trainer/notifications',
          component: () => import('@/views/trainer/ComingSoonView.vue'),
          meta: { title: 'Notifications', description: 'Your notifications feed is coming soon.' },
        },
        {
          path: 'trainer/messages',
          component: () => import('@/views/trainer/ComingSoonView.vue'),
          meta: { title: 'Messages', description: 'Direct messaging with clients is coming soon.' },
        },
        {
          path: 'trainer/settings',
          component: () => import('@/views/trainer/ComingSoonView.vue'),
          meta: { title: 'Settings', description: 'Profile and account settings are coming soon.' },
        },
      ],
    },
    // Gym owner routes — persistent dark sidebar app-shell
    {
      path: '/',
      component: () => import('@/layouts/GymLayout.vue'),
      children: [
        {
          path: 'gym/dashboard',
          component: () => import('@/views/gym/GymDashboardView.vue'),
        },
        {
          path: 'gym/trainers',
          component: () => import('@/views/gym/GymTrainersView.vue'),
        },
        {
          path: 'gym/clients',
          component: () => import('@/views/gym/GymClientsView.vue'),
        },
        {
          path: 'gym/edit',
          component: () => import('@/views/gym/GymEditView.vue'),
        },
        {
          path: 'gym/billing',
          component: () => import('@/views/trainer/ComingSoonView.vue'),
          meta: { title: 'Billing', description: 'Payment history and invoicing are coming soon.' },
        },
        {
          path: 'gym/reports',
          component: () => import('@/views/trainer/ComingSoonView.vue'),
          meta: { title: 'Reports', description: 'Analytics and performance reports are coming soon.' },
        },
      ],
    },
    // Authenticated routes
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        {
          path: 'trainer/setup',
          component: () => import('@/views/trainer/TrainerSetupView.vue'),
        },
        {
          path: 'client/setup',
          component: () => import('@/views/client/ClientSetupView.vue'),
        },
        {
          path: 'gym/setup',
          component: () => import('@/views/gym/GymSetupView.vue'),
        },
        {
          path: 'gym-trainer/dashboard',
          component: () => import('@/views/gym-trainer/GymTrainerDashboardView.vue'),
        },
        {
          path: 'gym-trainer/client/:clientId',
          component: () => import('@/views/trainer/ClientDetailView.vue'),
        },
      ],
    },
  ],
})

const roleDashboard: Record<string, string> = {
  trainer: '/trainer/dashboard',
  gym_trainer: '/gym-trainer/dashboard',
  client: '/client/dashboard',
  gym_owner: '/gym/dashboard',
}

const rolePrefix: Record<string, string> = {
  trainer: '/trainer/',
  gym_trainer: '/gym-trainer/',
  client: '/client/',
  gym_owner: '/gym/',
}

const PUBLIC_PATHS = ['/', '/sign-in', '/onboarding', '/invite/gym']

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.waitForLoad()

  const isPublicRoute = PUBLIC_PATHS.includes(to.path)

  // Public paths are always accessible
  if (isPublicRoute) {
    // Signed-in users on /sign-in redirect to their dashboard
    if (authStore.isSignedIn && to.path === '/sign-in') {
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
