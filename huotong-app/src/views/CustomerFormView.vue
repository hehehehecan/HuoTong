<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Form as VanForm, Field as VanField, Button as VanButton, showToast } from 'vant'
import { useCustomers } from '../composables/useCustomers'

const router = useRouter()
const { create } = useCustomers()

const submitting = ref(false)
const form = reactive({
  name: '',
  phone: '',
  address: '',
})

async function onSubmit() {
  const name = form.name.trim()
  if (!name) {
    showToast('请填写客户姓名')
    return
  }
  submitting.value = true
  try {
    await create({
      name,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
    })
    showToast({ type: 'success', message: '保存成功' })
    router.push('/customers')
  } catch {
    showToast({ type: 'fail', message: '保存失败，请检查网络后重试' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="customer-form">
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          name="name"
          label="客户姓名"
          placeholder="请输入客户姓名"
          :rules="[{ required: true, message: '请填写客户姓名' }]"
          maxlength="200"
          show-word-limit
        />
        <van-field
          v-model="form.phone"
          name="phone"
          label="电话"
          placeholder="请输入电话"
        />
        <van-field
          v-model="form.address"
          name="address"
          label="地址"
          type="textarea"
          placeholder="请输入地址"
          rows="3"
        />
      </van-cell-group>
      <div class="form-actions">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="submitting"
          class="submit-btn"
        >
          保存
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<style scoped>
.customer-form {
  padding: 1rem;
  font-size: 16px;
}
.form-actions {
  margin-top: 1.5rem;
  padding: 0 16px;
}
.submit-btn {
  min-height: 48px;
  font-size: 16px;
}
</style>
