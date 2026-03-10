<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useProducts } from '../composables/useProducts'
import { adjustStock, getStockLogs, type StockLogWithOrderNo } from '../composables/useInventory'
import type { Product } from '../composables/useProducts'

const router = useRouter()
const { products, loading, fetchAll, search } = useProducts()
const refreshing = ref(false)
const searchKeyword = ref('')

const adjustPopupVisible = ref(false)
const adjustProduct = ref<Product | null>(null)
const adjustNewStock = ref(0)
const adjustReason = ref('')
const adjustSubmitting = ref(false)

const logsPopupVisible = ref(false)
const logsProduct = ref<Product | null>(null)
const logsList = ref<StockLogWithOrderNo[]>([])
const logsLoading = ref(false)

function openAdjust(product: Product) {
  adjustProduct.value = product
  adjustNewStock.value = product.stock
  adjustReason.value = ''
  adjustPopupVisible.value = true
}

function closeAdjustPopup() {
  adjustPopupVisible.value = false
  adjustProduct.value = null
  adjustReason.value = ''
}

async function submitAdjust() {
  const product = adjustProduct.value
  if (!product) return
  const reason = adjustReason.value.trim()
  if (!reason) {
    showToast({ type: 'fail', message: '请填写调整原因' })
    return
  }
  const newStock = Math.floor(Number(adjustNewStock.value))
  if (Number.isNaN(newStock) || newStock < 0) {
    showToast({ type: 'fail', message: '请输入有效的库存数量（≥0）' })
    return
  }
  adjustSubmitting.value = true
  try {
    await adjustStock(product.id, newStock, reason)
    showToast({ type: 'success', message: '调整成功' })
    closeAdjustPopup()
    await runSearch({ silent: true })
  } catch (e) {
    showToast({ type: 'fail', message: (e as Error)?.message || '调整失败，请重试' })
  } finally {
    adjustSubmitting.value = false
  }
}

function openLogs(product: Product) {
  logsProduct.value = product
  logsList.value = []
  logsPopupVisible.value = true
}

async function loadLogs() {
  const product = logsProduct.value
  if (!product) return
  logsLoading.value = true
  try {
    logsList.value = await getStockLogs(product.id)
  } catch (e) {
    showToast({ type: 'fail', message: (e as Error)?.message || '加载变动记录失败' })
    logsList.value = []
  } finally {
    logsLoading.value = false
  }
}

function closeLogsPopup() {
  logsPopupVisible.value = false
  logsProduct.value = null
  logsList.value = []
}

watch(logsPopupVisible, (visible) => {
  if (visible && logsProduct.value) void loadLogs()
})

function formatLogTime(createdAt: string): string {
  const d = new Date(createdAt)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatChange(change: number): string {
  return change >= 0 ? `+${change}` : `${change}`
}

function formatReason(reason: StockLogWithOrderNo['reason']): string {
  const map = { sale_order: '出货', purchase_order: '进货', manual: '手动' }
  return map[reason] ?? reason
}

function goToOrder(log: StockLogWithOrderNo) {
  if (!log.reference_id) return
  if (log.reason === 'sale_order') {
    router.push({ name: 'sale-order-detail', params: { id: log.reference_id } })
  } else if (log.reason === 'purchase_order') {
    router.push({ name: 'purchase-order-detail', params: { id: log.reference_id } })
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
async function runSearch(options?: { silent?: boolean }): Promise<void> {
  const silent = options?.silent ?? false
  const k = searchKeyword.value.trim()
  const task = k ? search(k) : fetchAll()
  try {
    await task
  } catch (error) {
    if (!silent) {
      showToast({ type: 'fail', message: k ? '搜索失败，请重试' : '加载失败，请下拉重试' })
    }
    throw error
  }
}

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    void runSearch()
  }, 300)
}

async function onRefresh() {
  refreshing.value = true
  try {
    await runSearch({ silent: true })
  } catch {
    showToast({ type: 'fail', message: '刷新失败，请重试' })
  } finally {
    refreshing.value = false
  }
}

const isSearchEmpty = computed(
  () => searchKeyword.value.trim() !== '' && products.value.length === 0
)

onMounted(() => {
  void runSearch()
})

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
})
</script>

<template>
  <div class="inventory-page">
    <van-search
      v-model="searchKeyword"
      placeholder="搜索商品名称或规格"
      shape="round"
      @update:model-value="onSearchInput"
    />
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-loading v-if="loading && products.length === 0" class="page-loading" />

      <van-empty v-else-if="products.length === 0 && !searchKeyword.trim()" description="暂无商品数据" />

      <div v-else-if="isSearchEmpty" class="empty-hint">没有找到相关商品</div>

      <van-cell-group v-else inset>
          <van-cell
            v-for="p in products"
            :key="p.id"
            :class="{ 'cell-low-stock': p.stock === 0 }"
            class="inventory-cell"
            clickable
            @click="openAdjust(p)"
          >
            <template #title>
              <span class="product-name">{{ p.name }}</span>
              <van-tag v-if="p.stock === 0" type="danger" size="medium" class="low-tag">库存不足</van-tag>
            </template>
            <template #label>
              <span class="product-spec">{{ p.spec || '—' }}</span>
              <span class="action-links">
                <span class="adjust-link" @click.stop="openAdjust(p)">调整库存</span>
                <span class="adjust-link" @click.stop="openLogs(p)">变动记录</span>
              </span>
            </template>
            <template #value>
              <span :class="{ 'stock-zero': p.stock === 0 }" class="stock-value">{{ p.stock }}</span>
              <span class="stock-unit">件</span>
            </template>
          </van-cell>
        </van-cell-group>
    </van-pull-refresh>

    <van-popup
      v-model:show="adjustPopupVisible"
      position="bottom"
      round
      :style="{ padding: '16px 16px 24px' }"
      @closed="closeAdjustPopup"
    >
      <div v-if="adjustProduct" class="adjust-popup">
        <div class="adjust-title">调整库存</div>
        <div class="adjust-info">
          <div class="adjust-row">
            <span class="adjust-label">商品</span>
            <span class="adjust-value">{{ adjustProduct.name }}</span>
          </div>
          <div class="adjust-row">
            <span class="adjust-label">规格</span>
            <span class="adjust-value">{{ adjustProduct.spec || '—' }}</span>
          </div>
          <div class="adjust-row">
            <span class="adjust-label">当前库存</span>
            <span class="adjust-value">{{ adjustProduct.stock }} 件</span>
          </div>
        </div>
        <van-field
          v-model="adjustNewStock"
          type="number"
          label="调整后库存"
          placeholder="请输入数量"
          :min="0"
          :disabled="adjustSubmitting"
        />
        <van-field
          v-model="adjustReason"
          type="textarea"
          label="调整原因"
          placeholder="请填写调整原因（必填）"
          rows="2"
          :disabled="adjustSubmitting"
        />
        <div class="adjust-buttons">
          <van-button block type="default" @click="closeAdjustPopup">取消</van-button>
          <van-button block type="primary" :loading="adjustSubmitting" class="adjust-confirm" @click="submitAdjust">
            确认
          </van-button>
        </div>
      </div>
    </van-popup>

    <van-popup
      v-model:show="logsPopupVisible"
      position="bottom"
      round
      :style="{ maxHeight: '70vh', padding: '16px 16px 24px' }"
      @closed="closeLogsPopup"
    >
      <div v-if="logsProduct" class="logs-popup">
        <div class="logs-title">变动记录 · {{ logsProduct.name }}</div>
        <van-loading v-if="logsLoading" class="logs-loading" />
        <van-empty v-else-if="logsList.length === 0" description="暂无变动记录" />
        <van-cell-group v-else inset class="logs-list">
          <van-cell
            v-for="log in logsList"
            :key="log.id"
            class="log-cell"
          >
            <template #title>
              <span class="log-time">{{ formatLogTime(log.created_at) }}</span>
              <span class="log-change" :class="{ 'change-positive': log.change > 0, 'change-negative': log.change < 0 }">
                {{ formatChange(log.change) }}
              </span>
              <span class="log-balance">余额 {{ log.balance }}</span>
            </template>
            <template #label>
              <span class="log-reason">{{ formatReason(log.reason) }}</span>
              <span class="log-order-label">单据号：</span>
              <span
                v-if="log.reason !== 'manual' && log.reference_id"
                class="log-order-link"
                @click="goToOrder(log)"
              >{{ log.orderNo ?? '—' }}</span>
              <span v-else class="log-order-muted">—</span>
            </template>
          </van-cell>
        </van-cell-group>
        <div class="logs-close">
          <van-button block type="default" @click="closeLogsPopup">关闭</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.inventory-page {
  min-height: 60vh;
  padding-bottom: 20px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.inventory-cell {
  font-size: 16px;
}

.product-name {
  font-weight: 500;
  color: #323233;
}

.cell-low-stock .product-name {
  color: #ee0a24;
}

.product-spec {
  font-size: 14px;
  color: #969799;
}

.stock-value {
  font-weight: 600;
  color: #323233;
}

.stock-value.stock-zero {
  color: #ee0a24;
}

.stock-unit {
  margin-left: 2px;
  font-size: 14px;
  color: #969799;
}

.low-tag {
  margin-left: 8px;
  vertical-align: middle;
}

.action-links {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.adjust-link {
  font-size: 13px;
  color: var(--van-primary-color);
}

.logs-popup {
  padding-bottom: env(safe-area-inset-bottom);
}

.logs-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 12px;
}

.logs-loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.logs-list {
  max-height: 50vh;
  overflow-y: auto;
}

.log-cell .log-time {
  font-size: 14px;
  color: var(--van-text-color);
}

.log-cell .log-change {
  margin-left: 8px;
  font-weight: 600;
}

.log-cell .change-positive {
  color: #07c160;
}

.log-cell .change-negative {
  color: #ee0a24;
}

.log-cell .log-balance {
  margin-left: 8px;
  font-size: 14px;
  color: var(--van-gray-6);
}

.log-reason,
.log-order-label {
  font-size: 13px;
  color: var(--van-gray-6);
}

.log-order-link {
  color: var(--van-primary-color);
  text-decoration: underline;
  cursor: pointer;
}

.log-order-muted {
  color: var(--van-gray-6);
}

.logs-close {
  margin-top: 12px;
}

.adjust-popup {
  padding-bottom: env(safe-area-inset-bottom);
}

.adjust-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 12px;
}

.adjust-info {
  margin-bottom: 12px;
  padding: 12px;
  background: var(--van-gray-1);
  border-radius: 8px;
}

.adjust-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.adjust-row:last-child {
  margin-bottom: 0;
}

.adjust-label {
  color: var(--van-gray-6);
  font-size: 14px;
}

.adjust-value {
  font-size: 14px;
  color: var(--van-text-color);
}

.adjust-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.adjust-confirm {
  margin-top: 4px;
}

.empty-hint {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 16px;
  color: #969799;
}
</style>
