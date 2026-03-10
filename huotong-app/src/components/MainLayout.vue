<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

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
    <van-tabbar route>
      <van-tabbar-item to="/" name="home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/products" name="products" icon="shopping-cart-o">商品</van-tabbar-item>
      <van-tabbar-item to="/orders" name="orders" icon="records-o">单据</van-tabbar-item>
      <van-tabbar-item to="/more" name="more" icon="setting-o">更多</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  padding-bottom: 50px; /* Tabbar 高度 */
  box-sizing: border-box;
}

.main-content {
  min-height: calc(100vh - 50px);
  max-width: 1200px;
  margin: 0 auto;
  font-size: 16px;
}

.main-nav-bar {
  --van-nav-bar-height: 46px;
}
</style>
