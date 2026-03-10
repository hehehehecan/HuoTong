<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { usePurchaseOrders } from '../composables/usePurchaseOrders'
import { useSuppliers } from '../composables/useSuppliers'
import type { PurchaseOrder } from '../composables/usePurchaseOrders'

const route = useRoute()
const orderId = computed(() => route.params.id as string)

const { getById, loading } = usePurchaseOrders()
const { getById: getSupplierById } = useSuppliers()

const order = ref<PurchaseOrder | null>(null)
const supplierName = ref('')

async function loadOrder() {
  const id = orderId.value
  if (!id) return
  try {
    const o = await getById(id)
    order.value = o
    if (o) {
      const sup = await getSupplierById(o.supplier_id)
      supplierName.value = sup?.name ?? '—'
    }
  } catch {
    showToast({ type: 'fail', message: '加载失败，请重试' })
    order.value = null
  }
}

function formatPrice(n: number) {
  return Number(n).toFixed(2)
}

onMounted(() => {
  void loadOrder()
})
</script>

<template>
  <div class="purchase-order-detail">
    <van-loading v-if="loading && !order" class="loading" />
    <template v-else-if="order">
      <van-cell-group inset>
        <van-cell title="单号" :value="order.order_no" />
        <van-cell title="供应商" :value="supplierName" />
        <van-cell title="总金额" :value="'¥' + formatPrice(order.total_amount)" />
        <van-cell title="状态" :value="order.status === 'draft' ? '草稿' : '已确认'" />
      </van-cell-group>
      <p class="tip">完整明细与确认功能将在后续 Story 中实现。</p>
    </template>
    <van-empty v-else description="未找到该进货单" />
  </div>
</template>

<style scoped>
.purchase-order-detail {
  padding: 16px;
  font-size: 16px;
}
.loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
}
.tip {
  margin-top: 1rem;
  color: var(--van-gray-6);
  font-size: 14px;
}
</style>
