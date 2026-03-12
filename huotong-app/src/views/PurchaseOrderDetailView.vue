<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { usePurchaseOrders } from '../composables/usePurchaseOrders'
import { useSuppliers } from '../composables/useSuppliers'
import type { PurchaseOrder } from '../composables/usePurchaseOrders'
import type { PurchaseOrderItemWithProduct } from '../composables/usePurchaseOrders'
import { requestRetryOnNetworkError } from '../lib/networkRetry'

const route = useRoute()
const orderId = computed(() => route.params.id as string)

const { getById, getItemsWithProduct, confirm, parseConfirmError, loading: confirming } = usePurchaseOrders()
const { getById: getSupplierById } = useSuppliers()

const order = ref<PurchaseOrder | null>(null)
const supplierName = ref('')
const items = ref<PurchaseOrderItemWithProduct[]>([])
const loading = ref(true)

async function loadOrder() {
  const id = orderId.value
  if (!id) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const o = await getById(id)
    order.value = o
    if (o) {
      const sup = await getSupplierById(o.supplier_id)
      supplierName.value = sup?.name ?? '—'
      items.value = await getItemsWithProduct(id)
    } else {
      items.value = []
    }
  } catch {
    showToast({ type: 'fail', message: '加载失败，请重试' })
    order.value = null
    items.value = []
  } finally {
    loading.value = false
  }
}

const isDraft = computed(() => order.value?.status === 'draft')
const canConfirm = computed(() => isDraft.value && !!order.value && items.value.length > 0)

const confirmSummary = computed(() => {
  if (!order.value) return ''
  return `供应商：${supplierName.value}\n商品数：${items.value.length} 项\n总金额：¥${Number(order.value.total_amount).toFixed(2)}`
})

async function handleConfirm() {
  if (!order.value || !canConfirm.value) return
  try {
    await showConfirmDialog({
      title: '确认进货',
      message: confirmSummary.value,
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    await confirm(order.value.id)
    showToast({ type: 'success', message: '进货单已确认' })
    await loadOrder()
  } catch (e) {
    const shouldRetry = await requestRetryOnNetworkError(e, {
      title: '网络异常',
      message: '确认进货失败，请检查网络后重试',
      confirmButtonText: '重试确认',
      cancelButtonText: '稍后再试',
    })
    if (shouldRetry) {
      await handleConfirm()
      return
    }
    const msg = parseConfirmError(e) ?? '操作失败，请重试'
    showToast({ type: 'fail', message: msg })
  }
}

function formatPrice(n: number) {
  return Number(n).toFixed(2)
}

function formatDate(s: string) {
  if (!s) return '—'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('zh-CN')
}

onMounted(() => {
  void loadOrder()
})

watch(orderId, () => {
  void loadOrder()
})
</script>

<template>
  <div class="purchase-order-detail">
    <template v-if="loading && !order">
      <van-loading class="loading" type="spinner" />
    </template>
    <template v-else-if="order">
      <van-cell-group inset>
        <van-cell title="单号" :value="order.order_no" />
        <van-cell title="供应商" :value="supplierName" />
        <van-cell title="状态">
          <template #value>
            <span :class="{ 'status-draft': order.status === 'draft', 'status-confirmed': order.status === 'confirmed' }">
              {{ order.status === 'draft' ? '草稿' : '已确认' }}
            </span>
          </template>
        </van-cell>
        <van-cell title="创建时间" :value="formatDate(order.created_at)" />
      </van-cell-group>

      <div class="section-title">商品明细</div>
      <van-cell-group v-if="items.length" inset>
        <van-cell
          v-for="row in items"
          :key="row.id"
          :title="(row.products as { name: string })?.name ?? '—'"
          :label="(row.products as { spec?: string })?.spec || '—'"
        >
          <template #value>
            <div class="item-value">
              <span>{{ row.quantity }} × ¥{{ formatPrice(row.unit_price) }} = ¥{{ formatPrice(row.subtotal) }}</span>
            </div>
          </template>
        </van-cell>
      </van-cell-group>
      <div v-else class="empty-tip">暂无明细</div>

      <div class="footer">
        <div class="total">合计：¥{{ formatPrice(Number(order.total_amount)) }}</div>
        <van-button
          v-if="canConfirm"
          type="primary"
          round
          block
          :loading="confirming"
          class="confirm-btn"
          @click="handleConfirm"
        >
          确认进货
        </van-button>
      </div>
    </template>
    <template v-else>
      <div class="empty">进货单不存在</div>
    </template>
  </div>
</template>

<style scoped>
.purchase-order-detail {
  padding-bottom: 6rem;
  font-size: 16px;
}
.loading {
  padding: 2rem;
  text-align: center;
  color: var(--van-gray-6);
}
.empty {
  padding: 2rem;
  text-align: center;
  color: var(--van-gray-6);
}
.section-title {
  padding: 12px 16px 8px;
  font-weight: 600;
  color: var(--van-text-color);
}
.item-value {
  font-size: 14px;
}
.status-draft {
  color: var(--van-orange);
}
.status-confirmed {
  color: var(--van-green);
}
.empty-tip {
  padding: 1rem 16px;
  color: var(--van-gray-6);
  text-align: center;
}
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: var(--van-background);
  border-top: 1px solid var(--van-border-color);
}
.footer .total {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}
.confirm-btn {
  min-height: 44px;
}
</style>
