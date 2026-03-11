<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navTitle = computed(() => {
  const metaTitle = route.meta.title as string | undefined
  if (metaTitle) return metaTitle
  const titleMap: Record<string, string> = {
    home: '首页',
    products: '商品',
    customers: '客户',
    suppliers: '供应商',
    orders: '单据',
    more: '更多',
  }
  const name = (route.name as string) ?? 'home'
  return titleMap[name] ?? '货通'
})

const activeTab = computed(() => {
  const name = (route.name as string) ?? ''

  if (
    ['products', 'product-new', 'product-batch-import', 'product-edit'].includes(name)
  ) {
    return 'products'
  }

  if (
    [
      'orders',
      'sale-orders',
      'sale-order-new',
      'sale-order-detail',
      'purchase-orders',
      'purchase-order-new',
      'purchase-order-detail',
    ].includes(name)
  ) {
    return 'orders'
  }

  if (
    [
      'more',
      'customers',
      'customer-new',
      'customer-detail',
      'suppliers',
      'supplier-new',
      'supplier-detail',
      'receivables',
      'payables',
      'stock',
    ].includes(name)
  ) {
    return 'more'
  }

  return 'home'
})

function onTabChange(name: string | number) {
  const targetMap: Record<string, string> = {
    home: '/',
    products: '/products',
    orders: '/sale-orders',
    more: '/more',
  }
  const target = targetMap[String(name)]
  if (target && target !== route.fullPath) {
    void router.push(target)
  }
}
</script>

<template>
  <div class="main-layout">
    <van-nav-bar
      :title="navTitle"
      fixed
      placeholder
      class="main-nav-bar"
    />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
    <van-tabbar :model-value="activeTab" @update:model-value="onTabChange">
      <van-tabbar-item name="home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item name="products" icon="shopping-cart-o">商品</van-tabbar-item>
      <van-tabbar-item name="orders" icon="records-o">单据</van-tabbar-item>
      <van-tabbar-item name="more" icon="setting-o">更多</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.main-layout {
  --app-tabbar-height: 50px;
  --app-content-max-width: 1200px;
  min-height: 100vh;
  padding-bottom: var(--app-tabbar-height); /* Tabbar 高度 */
  box-sizing: border-box;
}

.main-content {
  min-height: calc(100vh - var(--app-tabbar-height));
  max-width: var(--app-content-max-width);
  margin: 0 auto;
  font-size: 16px;
}

.main-nav-bar {
  --van-nav-bar-height: 46px;
}
</style>
