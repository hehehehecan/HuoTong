<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Form as VanForm, Field as VanField, Button as VanButton, showToast, showConfirmDialog } from 'vant'
import { useSuppliers } from '../composables/useSuppliers'
import { usePurchaseOrders, type PurchaseOrderWithSupplier } from '../composables/usePurchaseOrders'
import { usePayables } from '../composables/usePayables'

const router = useRouter()
const route = useRoute()
const { getById, update, remove } = useSuppliers()
const { list: listPurchaseOrders } = usePurchaseOrders()
const { listGroupedBySupplier } = usePayables()

const supplierId = ref<string | undefined>(route.params.id as string)
const loading = ref(false)
const submitting = ref(false)
const purchaseOrdersLoading = ref(false)
const purchaseOrders = ref<PurchaseOrderWithSupplier[]>([])
const totalUnpaid = ref<number>(0)

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

async function loadSupplierExtras(id: string) {
  purchaseOrdersLoading.value = true
  try {
    const [orders, summaries] = await Promise.all([
      listPurchaseOrders({ supplier_id: id }),
      listGroupedBySupplier(),
    ])
    purchaseOrders.value = (orders ?? []).slice(0, 20)
    const summary = summaries.find((s) => s.supplier_id === id)
    totalUnpaid.value = summary?.total_unpaid ?? 0
  } catch {
    purchaseOrders.value = []
    totalUnpaid.value = 0
  } finally {
    purchaseOrdersLoading.value = false
  }
}

function formatMoney(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getStatusText(status: string): string {
  return status === 'confirmed' ? '已确认' : '草稿'
}

function goToPurchaseOrder(id: string) {
  router.push({ name: 'purchase-order-detail', params: { id } })
}

watch(
  () => route.params.id as string | undefined,
  (id) => {
    supplierId.value = id
    void loadSupplier()
    if (id) void loadSupplierExtras(id)
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

    <div v-if="supplierId" class="supplier-extras">
      <div class="extras-section">
        <div class="extras-title">应付账款汇总</div>
        <div class="total-unpaid">总欠款：¥{{ formatMoney(totalUnpaid) }}</div>
      </div>
      <div class="extras-section">
        <div class="extras-title">历史进货单</div>
        <van-loading v-if="purchaseOrdersLoading" size="24px" class="extras-loading" />
        <van-empty v-else-if="purchaseOrders.length === 0" description="暂无进货单" class="extras-empty" />
        <div v-else class="order-list">
          <div
            v-for="order in purchaseOrders"
            :key="order.id"
            class="order-item"
            @click="goToPurchaseOrder(order.id)"
          >
            <span class="order-no">{{ order.order_no }}</span>
            <span class="order-date">{{ formatDate(order.created_at) }}</span>
            <span class="order-amount">¥{{ formatMoney(Number(order.total_amount)) }}</span>
            <span class="order-status">{{ getStatusText(order.status) }}</span>
          </div>
        </div>
      </div>
    </div>
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

.supplier-extras {
  margin-top: 1.5rem;
  padding: 0 16px;
}

.extras-section {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.extras-title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.total-unpaid {
  font-size: 16px;
  font-weight: 600;
  color: #ee0a24;
}

.extras-loading,
.extras-empty {
  padding: 16px 0;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #fff;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.order-no {
  font-weight: 500;
  color: #323233;
  flex: 1;
  min-width: 0;
}

.order-date {
  color: #969799;
  margin: 0 8px;
}

.order-amount {
  font-weight: 500;
  color: #323233;
  margin-right: 8px;
}

.order-status {
  font-size: 12px;
  color: #969799;
}
</style>
