<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { usePurchaseOrders } from '../composables/usePurchaseOrders'
import { useSuppliers } from '../composables/useSuppliers'
import type { PurchaseOrderWithSupplier } from '../composables/usePurchaseOrders'
import type { PurchaseOrderListFilters } from '../composables/usePurchaseOrders'

const router = useRouter()
const { list, loading } = usePurchaseOrders()
const { suppliers, fetchAll } = useSuppliers()

const orders = ref<PurchaseOrderWithSupplier[]>([])
const refreshing = ref(false)
const filterVisible = ref(false)
const filterSupplierId = ref<string>('')
const filterDateFrom = ref('')
const filterDateTo = ref('')

const hasActiveFilter = computed(() => !!filterSupplierId.value || !!filterDateFrom.value || !!filterDateTo.value)

const filters = computed<PurchaseOrderListFilters | undefined>(() => {
  const s = filterSupplierId.value || undefined
  const from = filterDateFrom.value || undefined
  const to = filterDateTo.value || undefined
  if (!s && !from && !to) return undefined
  return { supplier_id: s, date_from: from, date_to: to }
})

function getSupplierName(row: PurchaseOrderWithSupplier): string {
  const s = row.suppliers
  if (!s) return '—'
  if (Array.isArray(s)) return s[0]?.name ?? '—'
  return s.name ?? '—'
}

function formatAmount(n: number): string {
  return `¥${Number(n).toFixed(2)}`
}

function formatDate(s: string): string {
  if (!s) return '—'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function statusText(status: string): string {
  return status === 'draft' ? '草稿' : '已确认'
}

async function loadList() {
  try {
    const data = await list(filters.value)
    orders.value = data
  } catch {
    showToast({ type: 'fail', message: '加载失败，请重试' })
    orders.value = []
  }
}

async function onRefresh() {
  refreshing.value = true
  try {
    await loadList()
  } catch {
    showToast({ type: 'fail', message: '刷新失败，请重试' })
  } finally {
    refreshing.value = false
  }
}

function applyFilter() {
  filterVisible.value = false
  void loadList()
}

function clearFilter() {
  filterSupplierId.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  filterVisible.value = false
  void loadList()
}

async function openFilterPopup() {
  filterVisible.value = true
  if (suppliers.value.length === 0) {
    try {
      await fetchAll()
    } catch {
      showToast({ type: 'fail', message: '加载供应商列表失败' })
    }
  }
}

function goToDetail(id: string) {
  router.push(`/purchase-orders/${id}`)
}

function goToNew() {
  router.push('/purchase-orders/new')
}

onMounted(() => {
  void loadList()
})
</script>

<template>
  <div class="purchase-order-list">
    <div class="toolbar">
      <van-button size="small" class="filter-btn" @click="openFilterPopup">
        筛选
        <span v-if="hasActiveFilter" class="filter-dot" />
      </van-button>
      <van-button type="primary" size="small" class="new-btn" @click="goToNew">
        新建进货单
      </van-button>
    </div>
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list :loading="loading" :finished="true" finished-text="">
        <template v-if="orders.length">
          <van-cell
            v-for="row in orders"
            :key="row.id"
            :title="row.order_no"
            :label="getSupplierName(row)"
            class="order-cell"
            is-link
            @click="goToDetail(row.id)"
          >
            <template #value>
              <div class="cell-value">
                <span class="amount">{{ formatAmount(Number(row.total_amount)) }}</span>
                <span class="meta">{{ formatDate(row.created_at) }} · {{ statusText(row.status) }}</span>
              </div>
            </template>
          </van-cell>
        </template>
        <div v-else class="empty">
          <p>暂无进货单</p>
          <p class="hint">点击「新建进货单」创建第一单</p>
        </div>
      </van-list>
    </van-pull-refresh>

    <van-popup v-model:show="filterVisible" position="bottom" round class="filter-popup">
      <div class="filter-header">
        <span>筛选</span>
        <van-button size="small" type="primary" plain @click="clearFilter">清除</van-button>
      </div>
      <van-cell-group inset>
        <van-cell title="供应商">
          <template #value>
            <select v-model="filterSupplierId" class="filter-select">
              <option value="">全部供应商</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </template>
        </van-cell>
        <van-cell title="日期起">
          <template #value>
            <input v-model="filterDateFrom" type="date" class="filter-date" />
          </template>
        </van-cell>
        <van-cell title="日期止">
          <template #value>
            <input v-model="filterDateTo" type="date" class="filter-date" />
          </template>
        </van-cell>
      </van-cell-group>
      <div class="filter-actions">
        <van-button type="primary" block round @click="applyFilter">确定</van-button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.purchase-order-list {
  padding-bottom: 2rem;
  font-size: 16px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--van-background);
  border-bottom: 1px solid var(--van-border-color);
}
.filter-btn {
  position: relative;
}
.filter-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--van-danger-color);
}
.new-btn {
  margin-left: auto;
}
.order-cell {
  min-height: 52px;
  align-items: flex-start;
}
.cell-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 14px;
}
.cell-value .amount {
  font-weight: 600;
  color: var(--van-text-color);
}
.cell-value .meta {
  color: var(--van-gray-6);
  font-size: 12px;
  margin-top: 2px;
}
.empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--van-gray-6);
}
.empty .hint {
  margin-top: 8px;
  font-size: 14px;
}
.filter-popup {
  padding-bottom: env(safe-area-inset-bottom);
}
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-weight: 600;
}
.filter-select {
  font-size: 14px;
  padding: 4px 8px;
  border: 1px solid var(--van-border-color);
  border-radius: 4px;
  background: var(--van-background);
}
.filter-date {
  font-size: 14px;
  padding: 4px 8px;
  border: 1px solid var(--van-border-color);
  border-radius: 4px;
  background: var(--van-background);
}
.filter-actions {
  padding: 16px;
}
</style>
