<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Form as VanForm, Field as VanField, Button as VanButton, showToast } from 'vant'
import { useProducts } from '../composables/useProducts'

const router = useRouter()
const { create } = useProducts()

const submitting = ref(false)
const form = reactive({
  name: '',
  spec: '',
  sell_price: '',
  buy_price: '',
})

async function onSubmit() {
  const name = form.name.trim()
  if (!name) {
    showToast('请填写商品名称')
    return
  }
  submitting.value = true
  try {
    await create({
      name,
      spec: form.spec.trim() || undefined,
      sell_price: parseFloat(form.sell_price) || 0,
      buy_price: parseFloat(form.buy_price) || 0,
    })
    showToast({ type: 'success', message: '保存成功' })
    router.push('/products')
  } catch {
    showToast({ type: 'fail', message: '保存失败，请检查网络后重试' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="product-form">
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          name="name"
          label="商品名称"
          placeholder="请输入商品名称"
          :rules="[{ required: true, message: '请填写商品名称' }]"
          maxlength="200"
          show-word-limit
        />
        <van-field
          v-model="form.spec"
          name="spec"
          label="规格"
          placeholder="请输入规格"
        />
        <van-field
          v-model="form.sell_price"
          name="sell_price"
          label="售价"
          type="number"
          placeholder="0"
        />
        <van-field
          v-model="form.buy_price"
          name="buy_price"
          label="进价"
          type="number"
          placeholder="0"
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
.product-form {
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
