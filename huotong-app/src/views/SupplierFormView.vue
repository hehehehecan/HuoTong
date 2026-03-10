<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Form as VanForm, Field as VanField, Button as VanButton, showToast } from 'vant'
import { useSuppliers } from '../composables/useSuppliers'

const router = useRouter()
const { create } = useSuppliers()

const submitting = ref(false)
const form = reactive({
  name: '',
  contact: '',
  phone: '',
  category: '',
})

async function onSubmit() {
  const name = form.name.trim()
  if (!name) {
    showToast('请填写供应商名称')
    return
  }
  submitting.value = true
  try {
    await create({
      name,
      contact: form.contact.trim() || undefined,
      phone: form.phone.trim() || undefined,
      category: form.category.trim() || undefined,
    })
    showToast({ type: 'success', message: '保存成功' })
    router.push('/suppliers')
  } catch {
    showToast({ type: 'fail', message: '保存失败，请检查网络后重试' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="supplier-form">
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          name="name"
          label="供应商名称"
          placeholder="请输入供应商名称"
          :rules="[{ required: true, message: '请填写供应商名称' }]"
          maxlength="200"
          show-word-limit
        />
        <van-field
          v-model="form.contact"
          name="contact"
          label="联系人"
          placeholder="请输入联系人"
        />
        <van-field
          v-model="form.phone"
          name="phone"
          label="电话"
          placeholder="请输入电话"
        />
        <van-field
          v-model="form.category"
          name="category"
          label="主营品类"
          placeholder="请输入主营品类"
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
.supplier-form {
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
