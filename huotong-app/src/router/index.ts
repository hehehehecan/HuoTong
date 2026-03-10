import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import MainLayout from '../components/MainLayout.vue'

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
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('../views/PlaceholderView.vue'),
          meta: { title: '商品', message: '功能开发中，敬请期待' },
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('../views/PlaceholderView.vue'),
          meta: { title: '单据', message: '功能开发中，敬请期待' },
        },
        {
          path: 'more',
          name: 'more',
          component: () => import('../views/PlaceholderView.vue'),
          meta: { title: '更多', message: '功能开发中，敬请期待' },
        },
        {
          path: 'sale-orders/new',
          name: 'sale-order-new',
          component: () => import('../views/PlaceholderView.vue'),
          meta: { title: '新建出货单', message: '功能开发中，敬请期待' },
        },
        {
          path: 'purchase-orders/new',
          name: 'purchase-order-new',
          component: () => import('../views/PlaceholderView.vue'),
          meta: { title: '新建进货单', message: '功能开发中，敬请期待' },
        },
        {
          path: 'receivables',
          name: 'receivables',
          component: () => import('../views/PlaceholderView.vue'),
          meta: { title: '应收账款', message: '功能开发中，敬请期待' },
        },
      ],
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
