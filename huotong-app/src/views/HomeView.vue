<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../stores/user'
import { Button as VanButton } from 'vant'

const router = useRouter()
const userStore = useUserStore()
const supabaseConnected = ref<boolean | null>(null)

onMounted(async () => {
  try {
    const { error } = await supabase.auth.getSession()
    supabaseConnected.value = !error
  } catch {
    supabaseConnected.value = false
  }
})

async function logout() {
  await userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="home">
    <h1>货通 HuoTong</h1>
    <p>项目脚手架已就绪：Vue 3 + Vite + TypeScript + Vant + Pinia + Vue Router + Supabase</p>
    <VanButton type="primary" block>Vant 按钮（验证组件渲染）</VanButton>
    <p v-if="supabaseConnected === true" class="status ok">Supabase 连接正常</p>
    <p v-else-if="supabaseConnected === false" class="status warn">Supabase 未配置或连接失败，请检查 .env</p>
    <p v-else class="status">正在检测 Supabase 连接…</p>
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
.status {
  margin-top: 1rem;
}
.status.ok {
  color: green;
}
.status.warn {
  color: orange;
}
.logout-wrap {
  margin-top: 2rem;
}
</style>
