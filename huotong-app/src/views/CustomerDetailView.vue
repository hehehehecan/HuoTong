<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Form as VanForm, Field as VanField, Button as VanButton, showToast, showConfirmDialog } from 'vant'
import { useCustomers } from '../composables/useCustomers'

const router = useRouter()
const route = useRoute()
const { getById, update, remove } = useCustomers()

const customerId = ref<string | undefined>(route.params.id as string)
const loading = ref(false)
const submitting = ref(false)
const form = reactive({
  name: '',
  phone: '',
  address: '',
})

function resetForm() {
  form.name = ''
  form.phone = ''
  form.address = ''
}

let latestLoadId = 0
async function loadCustomer() {
  const id = customerId.value
  if (!id) {
    resetForm()
    loading.value = false
    return
  }
  const loadId = ++latestLoadId
  loading.value = true
  try {
    const customer = await getById(id)
    if (loadId !== latestLoadId) return
    if (!customer) {
      showToast('客户不存在')
      router.replace('/customers')
      return
    }
    form.name = customer.name
    form.phone = customer.phone ?? ''
    form.address = customer.address ?? ''
  } catch {
    if (loadId !== latestLoadId) return
    showToast({ type: 'fail', message: '加载失败，请检查网络后重试' })
    router.replace('/customers')
  } finally {
    if (loadId === latestLoadId) {
      loading.value = false
    }
  }
}

watch(
  () => route.params.id as string | undefined,
  (id) => {
    customerId.value = id
    void loadCustomer()
  },
  { immediate: true }
)

async function onSubmit() {
  const name = form.name.trim()
  if (!name) {
    showToast('请填写客户姓名')
    return
  }
  const id = customerId.value
  if (!id) return
  submitting.value = true
  try {
    await update(id, {
      name,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
    })
    showToast({ type: 'success', message: '保存成功' })
  } catch {
    showToast({ type: 'fail', message: '保存失败，请检查网络后重试' })
  } finally {
    submitting.value = false
  }
}

async function onDelete() {
  const id = customerId.value
  if (!id || submitting.value || loading.value) return
  try {
    await showConfirmDialog({
      title: '删除客户',
      message: '确定要删除该客户吗？',
    })
  } catch {
    return
  }
  try {
    await remove(id)
    showToast({ type: 'success', message: '已删除' })
    router.replace('/customers')
  } catch {
    showToast({ type: 'fail', message: '删除失败，请检查网络后重试' })
  }
}
</script>

<template>
  <div class="customer-detail">
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          name="name"
          label="客户姓名"
          placeholder="请输入客户姓名"
          :rules="[{ required: true, message: '请填写客户姓名' }]"
          :disabled="loading"
          maxlength="200"
          show-word-limit
        />
        <van-field
          v-model="form.phone"
          name="phone"
          label="电话"
          placeholder="请输入电话"
          :disabled="loading"
        />
        <van-field
          v-model="form.address"
          name="address"
          label="地址"
          type="textarea"
          placeholder="请输入地址"
          rows="3"
          :disabled="loading"
        />
      </van-cell-group>
      <div class="form-actions">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="submitting"
          :disabled="loading"
          class="submit-btn"
        >
          保存
        </van-button>
        <van-button
          round
          block
          type="danger"
          plain
          :disabled="loading || submitting"
          class="delete-btn"
          @click="onDelete"
        >
          删除客户
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<style scoped>
.customer-detail {
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
.delete-btn {
  margin-top: 0.75rem;
  min-height: 48px;
  font-size: 16px;
}
</style>
