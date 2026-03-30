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
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.waitForLoad()

  if (!authStore.isSignedIn && to.path !== '/sign-in' && to.path !== '/onboarding') {
    return '/sign-in'
  }

  if (authStore.isSignedIn && to.path === '/sign-in') {
    return '/onboarding'
  }
  return true
})

export default router
