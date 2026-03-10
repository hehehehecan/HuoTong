<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Form as VanForm, Field as VanField, Button as VanButton, showToast, showConfirmDialog } from 'vant'
import { useSuppliers } from '../composables/useSuppliers'

const router = useRouter()
const route = useRoute()
const { getById, update, remove } = useSuppliers()

const supplierId = ref<string | undefined>(route.params.id as string)
const loading = ref(false)
const submitting = ref(false)
const form = reactive({
  name: '',
  contact: '',
  phone: '',
  category: '',
})

function resetForm() {
  form.name = ''
  form.contact = ''
  form.phone = ''
  form.category = ''
}

let latestLoadId = 0
async function loadSupplier() {
  const id = supplierId.value
  if (!id) {
    resetForm()
    loading.value = false
    return
  }
  const loadId = ++latestLoadId
  loading.value = true
  try {
    const supplier = await getById(id)
    if (loadId !== latestLoadId) return
    if (!supplier) {
      showToast('供应商不存在')
      router.replace('/suppliers')
      return
    }
    form.name = supplier.name
    form.contact = supplier.contact ?? ''
    form.phone = supplier.phone ?? ''
    form.category = supplier.category ?? ''
  } catch {
    if (loadId !== latestLoadId) return
    showToast({ type: 'fail', message: '加载失败，请检查网络后重试' })
    router.replace('/suppliers')
  } finally {
    if (loadId === latestLoadId) {
      loading.value = false
    }
  }
}

watch(
  () => route.params.id as string | undefined,
  (id) => {
    supplierId.value = id
    void loadSupplier()
  },
  { immediate: true }
)

async function onSubmit() {
  const name = form.name.trim()
  if (!name) {
    showToast('请填写供应商名称')
    return
  }
  const id = supplierId.value
  if (!id) return
  submitting.value = true
  try {
    await update(id, {
      name,
      contact: form.contact.trim() || undefined,
      phone: form.phone.trim() || undefined,
      category: form.category.trim() || undefined,
    })
    showToast({ type: 'success', message: '保存成功' })
  } catch {
    showToast({ type: 'fail', message: '保存失败，请检查网络后重试' })
  } finally {
    submitting.value = false
  }
}

async function onDelete() {
  const id = supplierId.value
  if (!id || submitting.value || loading.value) return
  try {
    await showConfirmDialog({
      title: '删除供应商',
      message: '确定要删除该供应商吗？',
    })
  } catch {
    return
  }
  try {
    await remove(id)
    showToast({ type: 'success', message: '已删除' })
    router.replace('/suppliers')
  } catch {
    showToast({ type: 'fail', message: '删除失败，请检查网络后重试' })
  }
}
</script>

<template>
  <div class="supplier-detail">
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          name="name"
          label="供应商名称"
          placeholder="请输入供应商名称"
          :rules="[{ required: true, message: '请填写供应商名称' }]"
          :disabled="loading"
          maxlength="200"
          show-word-limit
        />
        <van-field
          v-model="form.contact"
          name="contact"
          label="联系人"
          placeholder="请输入联系人"
          :disabled="loading"
        />
        <van-field
          v-model="form.phone"
          name="phone"
          label="电话"
          placeholder="请输入电话"
          :disabled="loading"
        />
        <van-field
          v-model="form.category"
          name="category"
          label="主营品类"
          placeholder="请输入主营品类"
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
          删除供应商
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<style scoped>
.supplier-detail {
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
