<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import {
  useReceivables,
  type CustomerReceivableSummary,
  type ReceivableWithOrder,
} from '../composables/useReceivables'

const { loading, listGroupedByCustomer, listByCustomer } = useReceivables()

const summaries = ref<CustomerReceivableSummary[]>([])
const activeName = ref<string>('')
const customerDetails = ref<Map<string, ReceivableWithOrder[]>>(new Map())
const refreshing = ref(false)

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
              </div>
            </template>
          </div>
        </van-collapse-item>
      </van-collapse>
    </div>
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
