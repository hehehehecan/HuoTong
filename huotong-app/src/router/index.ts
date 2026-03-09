import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const isPublic = to.meta.public === true

  if (!userStore.isLoggedIn) {
    await userStore.initSession()
  }

  if (isPublic) {
    if (userStore.isLoggedIn) {
      return { path: '/' }
    }
    return
  }
  if (!userStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router
