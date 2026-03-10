<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button as VanButton } from 'vant'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

function goTo(path: string) {
  router.push(path)
}

async function logout() {
  await userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="home">
    <h1 class="home-title">货通 HuoTong</h1>
    <p class="home-desc">选择要进行的操作</p>
    <div class="shortcuts">
      <VanButton
        type="primary"
        size="large"
        block
        class="shortcut-btn"
        @click="goTo('/sale-orders/new')"
      >
        新建出货单
      </VanButton>
      <VanButton
        type="primary"
        size="large"
        block
        class="shortcut-btn"
        @click="goTo('/purchase-orders/new')"
      >
        新建进货单
      </VanButton>
      <VanButton
        type="primary"
        size="large"
        block
        class="shortcut-btn"
        @click="goTo('/receivables')"
      >
        查应收
      </VanButton>
    </div>
    <div class="logout-wrap">
      <VanButton type="default" block @click="logout">退出登录</VanButton>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding: 1rem;
  font-size: 16px;
}
.home-title {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}
.home-desc {
  color: var(--van-gray-6, #969799);
  margin-bottom: 1.5rem;
}
.shortcuts {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
/* 触控区域最小 44x44px，Vant large 按钮已满足，此处保证最小高度 */
.shortcut-btn {
  min-height: 48px;
  font-size: 16px;
}
.logout-wrap {
  margin-top: 2rem;
}
</style>
