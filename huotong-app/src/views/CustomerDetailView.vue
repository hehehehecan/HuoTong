<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Form as VanForm, Field as VanField, Button as VanButton, showToast, showConfirmDialog } from 'vant'
import { useCustomers } from '../composables/useCustomers'
import { useSaleOrders, type SaleOrderWithCustomer } from '../composables/useSaleOrders'
import { useReceivables } from '../composables/useReceivables'

const router = useRouter()
const route = useRoute()
const { getById, update, remove } = useCustomers()
const { list: listSaleOrders } = useSaleOrders()
const { listGroupedByCustomer } = useReceivables()

const customerId = ref<string | undefined>(route.params.id as string)
const loading = ref(false)
const submitting = ref(false)
const saleOrdersLoading = ref(false)
const saleOrders = ref<SaleOrderWithCustomer[]>([])
const totalUnpaid = ref<number>(0)

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

async function loadCustomerExtras(id: string) {
  saleOrdersLoading.value = true
  try {
    const [orders, summaries] = await Promise.all([
      listSaleOrders({ customer_id: id }),
      listGroupedByCustomer(),
    ])
    saleOrders.value = (orders ?? []).slice(0, 20)
    const summary = summaries.find((s) => s.customer_id === id)
    totalUnpaid.value = summary?.total_unpaid ?? 0
  } catch {
    saleOrders.value = []
    totalUnpaid.value = 0
  } finally {
    saleOrdersLoading.value = false
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

function goToSaleOrder(id: string) {
  router.push({ name: 'sale-order-detail', params: { id } })
}

watch(
  () => route.params.id as string | undefined,
  (id) => {
    customerId.value = id
    void loadCustomer()
    if (id) void loadCustomerExtras(id)
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

    <div v-if="customerId" class="customer-extras">
      <div class="extras-section">
        <div class="extras-title">应收账款汇总</div>
        <div class="total-unpaid">总欠款：¥{{ formatMoney(totalUnpaid) }}</div>
      </div>
      <div class="extras-section">
        <div class="extras-title">历史出货单</div>
        <van-loading v-if="saleOrdersLoading" size="24px" class="extras-loading" />
        <van-empty v-else-if="saleOrders.length === 0" description="暂无出货单" class="extras-empty" />
        <div v-else class="order-list">
          <div
            v-for="order in saleOrders"
            :key="order.id"
            class="order-item"
            @click="goToSaleOrder(order.id)"
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

.customer-extras {
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
