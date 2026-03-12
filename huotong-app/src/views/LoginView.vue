<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { Field, Form, Button as VanButton } from 'vant'
import { useUserStore } from '../stores/user'
import { requestRetryOnNetworkError } from '../lib/networkRetry'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function onSubmit() {
  if (!email.value.trim() || !password.value) {
    showToast('请填写邮箱和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(email.value.trim(), password.value)
    router.replace('/')
  } catch (err: unknown) {
    const messageText =
      typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : ''
    if (messageText.toLowerCase().includes('invalid login credentials')) {
      showToast('邮箱或密码错误')
      return
    }

    showToast('登录失败，请检查网络后重试')
    const shouldRetry = await requestRetryOnNetworkError(err, {
      title: '网络异常',
      message: '登录失败，请检查网络后重试',
      confirmButtonText: '重试登录',
      cancelButtonText: '稍后再试',
    })
    if (shouldRetry) {
      await onSubmit()
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <h1 class="title">货通 · 登录</h1>
    <p class="hint">请输入账号与密码登录系统</p>
    <Form @submit="onSubmit" @keydown.enter.prevent="onSubmit">
      <Field
        v-model="email"
        name="email"
        type="email"
        label="邮箱"
        placeholder="请输入邮箱"
        :rules="[{ required: true, message: '请填写邮箱' }]"
      />
      <Field
        v-model="password"
        name="password"
        type="password"
        label="密码"
        placeholder="请输入密码"
        :rules="[{ required: true, message: '请填写密码' }]"
      />
      <div class="btn-wrap">
        <VanButton
          round
          block
          type="primary"
          native-type="submit"
          :loading="loading"
          data-testid="login-submit"
        >
          登录
        </VanButton>
      </div>
    </Form>
  </div>
</template>

<style scoped>
.login-page {
  padding: 2rem 1.5rem;
  min-height: 100vh;
  box-sizing: border-box;
}
.title {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.hint {
  font-size: 16px;
  color: #666;
  margin-bottom: 2rem;
}
.btn-wrap {
  margin-top: 2rem;
}
</style>
