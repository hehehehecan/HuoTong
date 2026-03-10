<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { showToast } from 'vant'
import { useProducts } from '../composables/useProducts'

const { products, loading, fetchAll, search } = useProducts()
const refreshing = ref(false)
const searchKeyword = ref('')

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
          >
            <template #title>
              <span class="product-name">{{ p.name }}</span>
              <van-tag v-if="p.stock === 0" type="danger" size="medium" class="low-tag">库存不足</van-tag>
            </template>
            <template #label>
              <span class="product-spec">{{ p.spec || '—' }}</span>
            </template>
            <template #value>
              <span :class="{ 'stock-zero': p.stock === 0 }" class="stock-value">{{ p.stock }}</span>
              <span class="stock-unit">件</span>
            </template>
          </van-cell>
        </van-cell-group>
    </van-pull-refresh>
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

.empty-hint {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 16px;
  color: #969799;
}
</style>
