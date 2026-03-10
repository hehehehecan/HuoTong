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
          component: () => import('../views/ProductListView.vue'),
          meta: { title: '商品' },
        },
        {
          path: 'products/new',
          name: 'product-new',
          component: () => import('../views/ProductFormView.vue'),
          meta: { title: '新增商品' },
        },
        {
          path: 'products/batch',
          name: 'product-batch-import',
          component: () => import('../views/ProductBatchImportView.vue'),
          meta: { title: '批量录入商品' },
        },
        {
          path: 'products/:id',
          name: 'product-edit',
          component: () => import('../views/ProductFormView.vue'),
          meta: { title: '编辑商品' },
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('../views/CustomerListView.vue'),
          meta: { title: '客户' },
        },
        {
          path: 'customers/new',
          name: 'customer-new',
          component: () => import('../views/CustomerFormView.vue'),
          meta: { title: '新增客户' },
        },
        {
          path: 'customers/:id',
          name: 'customer-detail',
          component: () => import('../views/CustomerDetailView.vue'),
          meta: { title: '编辑客户' },
        },
        {
          path: 'suppliers',
          name: 'suppliers',
          component: () => import('../views/SupplierListView.vue'),
          meta: { title: '供应商' },
        },
        {
          path: 'suppliers/new',
          name: 'supplier-new',
          component: () => import('../views/SupplierFormView.vue'),
          meta: { title: '新增供应商' },
        },
        {
          path: 'suppliers/:id',
          name: 'supplier-detail',
          component: () => import('../views/SupplierDetailView.vue'),
          meta: { title: '编辑供应商' },
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
          component: () => import('../views/SaleOrderCreateView.vue'),
          meta: { title: '新建出货单' },
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
