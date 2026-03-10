<script setup lang="ts">
import { ref, onMounted, onScopeDispose } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import {
  useReceivables,
  type CustomerReceivableSummary,
  type ReceivableWithOrder,
} from '../composables/useReceivables'

const router = useRouter()
const { loading, listGroupedByCustomer, listByCustomer, recordPayment, onInvalidate } = useReceivables()

const summaries = ref<CustomerReceivableSummary[]>([])
const activeName = ref<string>('')
const customerDetails = ref<Map<string, ReceivableWithOrder[]>>(new Map())
const refreshing = ref(false)

const paymentPopupVisible = ref(false)
const paymentTarget = ref<ReceivableWithOrder | null>(null)
const paymentAmount = ref('')
const paymentSubmitting = ref(false)

function toMoney(value: number): number {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return 0
  return Math.round(normalized * 100) / 100
}

function formatMoney(value: number): string {
  return value.toFixed(2)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getStatusText(status: string): string {
  switch (status) {
    case 'unpaid':
      return '未付'
    case 'partial':
      return '部分付'
    case 'paid':
      return '已付'
    default:
      return status
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'unpaid':
      return '#ee0a24'
    case 'partial':
      return '#ff976a'
    case 'paid':
      return '#07c160'
    default:
      return '#969799'
  }
}

function getOrderNo(item: ReceivableWithOrder): string {
  const orders = item.sale_orders
  if (!orders) return '-'
  if (Array.isArray(orders)) {
    return orders[0]?.order_no ?? '-'
  }
  return orders.order_no ?? '-'
}

async function loadData() {
  try {
    summaries.value = await listGroupedByCustomer()
  } catch (e) {
    showToast('加载失败，请重试')
  }
}

async function onRefresh() {
  refreshing.value = true
  activeName.value = ''
  customerDetails.value.clear()
  await loadData()
  refreshing.value = false
}

onScopeDispose(onInvalidate(loadData))

async function onCollapseChange(name: string | number) {
  const customerId = String(name || '').trim()
  if (!customerId) return

  if (!customerDetails.value.has(customerId)) {
    try {
      const details = await listByCustomer(customerId)
      customerDetails.value.set(customerId, details)
    } catch (e) {
      showToast('加载明细失败')
    }
  }
}

function openPaymentPopup(item: ReceivableWithOrder) {
  paymentTarget.value = item
  paymentAmount.value = ''
  paymentPopupVisible.value = true
}

function goToSaleOrder(saleOrderId: string | undefined) {
  if (!saleOrderId?.trim()) {
    showToast('关联单据不存在')
    return
  }
  router.push({ name: 'sale-order-detail', params: { id: saleOrderId } })
}

function closePaymentPopup() {
  paymentPopupVisible.value = false
  paymentTarget.value = null
  paymentAmount.value = ''
}

function getRemaining(item: ReceivableWithOrder): number {
  return Math.max(0, toMoney(Number(item.amount) - Number(item.paid_amount)))
}

async function confirmPayment() {
  const item = paymentTarget.value
  if (!item) return
  const remaining = getRemaining(item)
  const amount = toMoney(Number.parseFloat(paymentAmount.value))
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast('请输入有效的付款金额')
    return
  }
  if (amount > remaining) {
    showToast('付款金额不能超过未付金额')
    return
  }
  paymentSubmitting.value = true
  try {
    await recordPayment(item.id, amount)
    closePaymentPopup()
    showToast('已更新')
    const customerId = item.customer_id
    const details = await listByCustomer(customerId)
    customerDetails.value.set(customerId, details)
    summaries.value = await listGroupedByCustomer()
  } catch (e) {
    showToast((e as Error)?.message ?? '操作失败，请重试')
  } finally {
    paymentSubmitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <div class="receivables-page">
      <van-loading v-if="loading && summaries.length === 0" class="page-loading" />

      <van-empty v-else-if="summaries.length === 0" description="暂无应收账款" />

      <van-collapse
        v-else
        v-model="activeName"
        accordion
        @change="onCollapseChange"
      >
        <van-collapse-item
          v-for="summary in summaries"
          :key="summary.customer_id"
          :name="summary.customer_id"
        >
          <template #title>
            <div class="summary-title">
              <span class="customer-name">{{ summary.customer_name }}</span>
              <span class="unpaid-amount">¥{{ formatMoney(summary.total_unpaid) }}</span>
            </div>
          </template>
          <template #value>
            <span class="unpaid-count">{{ summary.unpaid_count }}笔未付</span>
          </template>

          <div class="detail-list">
            <van-loading v-if="!customerDetails.has(summary.customer_id)" size="20px" />
            <template v-else>
              <div
                v-for="item in customerDetails.get(summary.customer_id)"
                :key="item.id"
                class="detail-item"
              >
                <div class="detail-row">
                  <span class="order-no">{{ getOrderNo(item) }}</span>
                  <span class="status-tag" :style="{ color: getStatusColor(item.status) }">
                    {{ getStatusText(item.status) }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="label">金额：</span>
                  <span class="value">¥{{ formatMoney(Number(item.amount)) }}</span>
                  <span class="label" style="margin-left: 12px;">已付：</span>
                  <span class="value">¥{{ formatMoney(Number(item.paid_amount)) }}</span>
                </div>
                <div class="detail-row">
                  <span class="date">{{ formatDate(item.created_at) }}</span>
                </div>
                <div class="detail-row detail-actions">
                  <van-button
                    v-if="item.sale_order_id"
                    size="small"
                    type="default"
                    plain
                    @click="goToSaleOrder(item.sale_order_id)"
                  >
                    查看原始单据
                  </van-button>
                  <van-button
                    v-if="item.status === 'unpaid' || item.status === 'partial'"
                    size="small"
                    type="primary"
                    @click="openPaymentPopup(item)"
                  >
                    标记付款
                  </van-button>
                </div>
              </div>
            </template>
          </div>
        </van-collapse-item>
      </van-collapse>
    </div>

    <van-popup
      v-model:show="paymentPopupVisible"
      position="bottom"
      round
      :style="{ padding: '16px 16px 24px' }"
      @closed="closePaymentPopup"
    >
      <div v-if="paymentTarget" class="payment-popup">
        <div class="payment-title">标记付款</div>
        <div class="payment-info">
          <div class="payment-row">
            <span class="payment-label">应收总额</span>
            <span class="payment-value">¥{{ formatMoney(Number(paymentTarget.amount)) }}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">已付金额</span>
            <span class="payment-value">¥{{ formatMoney(Number(paymentTarget.paid_amount)) }}</span>
          </div>
          <div class="payment-row">
            <span class="payment-label">剩余未付</span>
            <span class="payment-value highlight">¥{{ formatMoney(getRemaining(paymentTarget)) }}</span>
          </div>
        </div>
        <van-field
          v-model="paymentAmount"
          type="digit"
          label="本次付款金额"
          placeholder="请输入金额"
          :disabled="paymentSubmitting"
        />
        <div class="payment-buttons">
          <van-button block type="default" @click="closePaymentPopup">取消</van-button>
          <van-button block type="primary" :loading="paymentSubmitting" class="payment-confirm" @click="confirmPayment">
            确认
          </van-button>
        </div>
      </div>
    </van-popup>
  </van-pull-refresh>
</template>

<style scoped>
.receivables-page {
  min-height: 60vh;
  padding-bottom: 20px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-name {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.unpaid-amount {
  font-size: 16px;
  font-weight: 600;
  color: #ee0a24;
}

.unpaid-count {
  font-size: 14px;
  color: #969799;
}

.detail-list {
  padding: 8px 0;
}

.detail-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #f7f8fa;
  border-radius: 8px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ebedf0;
}

.payment-popup {
  min-width: 280px;
}

.payment-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 16px;
  text-align: center;
}

.payment-info {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.payment-row:last-child {
  margin-bottom: 0;
}

.payment-label {
  font-size: 14px;
  color: #969799;
}

.payment-value {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}

.payment-value.highlight {
  color: #ee0a24;
  font-weight: 600;
}

.payment-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.payment-confirm {
  margin-top: 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.order-no {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
  flex: 1;
}

.status-tag {
  font-size: 12px;
  font-weight: 500;
}

.label {
  font-size: 13px;
  color: #969799;
}

.value {
  font-size: 13px;
  color: #323233;
}

.date {
  font-size: 12px;
  color: #969799;
}
</style>
