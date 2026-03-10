<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Form as VanForm, Field as VanField, Button as VanButton, showToast, showConfirmDialog } from 'vant'
import { useProducts } from '../composables/useProducts'

const router = useRouter()
const route = useRoute()
const { create, getById, update, remove } = useProducts()

const productId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!productId.value)

const loading = ref(false)
const submitting = ref(false)
const form = reactive({
  name: '',
  spec: '',
  sell_price: '',
  buy_price: '',
})

function resetForm() {
  form.name = ''
  form.spec = ''
  form.sell_price = ''
  form.buy_price = ''
}

let latestLoadId = 0
async function loadProductByRouteId() {
  const id = productId.value
  if (!id) {
    latestLoadId += 1
    resetForm()
    loading.value = false
    return
  }
  const loadId = ++latestLoadId
  loading.value = true
  try {
    const product = await getById(id)
    if (loadId !== latestLoadId) return
    if (!product) {
      showToast('商品不存在')
      router.push('/products')
      return
    }
    form.name = product.name
    form.spec = product.spec ?? ''
    form.sell_price = String(product.sell_price ?? 0)
    form.buy_price = String(product.buy_price ?? 0)
  } catch {
    if (loadId !== latestLoadId) return
    showToast({ type: 'fail', message: '加载失败，请检查网络后重试' })
    router.push('/products')
  } finally {
    if (loadId === latestLoadId) {
      loading.value = false
    }
  }
}

watch(productId, () => {
  void loadProductByRouteId()
}, { immediate: true })

async function onSubmit() {
  const name = form.name.trim()
  if (!name) {
    showToast('请填写商品名称')
    return
  }
  submitting.value = true
  try {
    const id = productId.value
    if (id) {
      await update(id, {
        name,
        spec: form.spec.trim() || undefined,
        sell_price: parseFloat(form.sell_price) || 0,
        buy_price: parseFloat(form.buy_price) || 0,
      })
      showToast({ type: 'success', message: '保存成功' })
    } else {
      await create({
        name,
        spec: form.spec.trim() || undefined,
        sell_price: parseFloat(form.sell_price) || 0,
        buy_price: parseFloat(form.buy_price) || 0,
      })
      showToast({ type: 'success', message: '保存成功' })
    }
    router.push('/products')
  } catch {
    showToast({ type: 'fail', message: '保存失败，请检查网络后重试' })
  } finally {
    submitting.value = false
  }
}

async function onDelete() {
  const id = productId.value
  if (!id || submitting.value || loading.value) return
  try {
    await showConfirmDialog({
      title: '删除商品',
      message: '确定要删除该商品吗？',
    })
  } catch {
    return
  }
  try {
    await remove(id)
    showToast({ type: 'success', message: '已删除' })
    router.push('/products')
  } catch {
    showToast({ type: 'fail', message: '删除失败，请检查网络后重试' })
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
          :disabled="loading"
          class="submit-btn"
        >
          保存
        </van-button>
        <van-button
          v-if="isEditMode"
          round
          block
          type="danger"
          plain
          :disabled="loading || submitting"
          class="delete-btn"
          @click="onDelete"
        >
          删除商品
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
.delete-btn {
  margin-top: 0.75rem;
  min-height: 48px;
  font-size: 16px;
}
</style>
