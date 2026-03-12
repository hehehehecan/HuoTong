<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button as VanButton, showToast } from 'vant'
import { useProducts } from '../composables/useProducts'
import { useAppResumeRefresh } from '../composables/useAppResumeRefresh'
import { platformConfig } from '../lib/platform'

const router = useRouter()
const { products, loading, fetchAll, search } = useProducts()
const refreshing = ref(false)
const searchKeyword = ref('')

const DESKTOP_BREAKPOINT = 768
const isDesktop = ref(false)
let mediaQueryList: MediaQueryList | null = null
let onDesktopChange: ((event: MediaQueryListEvent) => void) | null = null

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function runSearch(options?: { silent?: boolean }): Promise<void> {
  const silent = options?.silent ?? false
  const k = searchKeyword.value.trim()
  const task = k ? search(k) : fetchAll()
  return task.then(() => undefined).catch((error) => {
    if (!silent) {
      showToast({ type: 'fail', message: k ? '搜索失败，请重试' : '加载商品失败，请下拉重试' })
    }
    throw error
  })
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

function goToNew() {
  router.push('/products/new')
}

function goToEdit(id: string) {
  router.push(`/products/${id}`)
}

function goToBatchImport() {
  if (!platformConfig.desktopBatchImportEnabled) {
    showToast(platformConfig.featureTips.batchImport)
    return
  }
  router.push('/products/batch')
}

function formatPrice(n: number) {
  return Number(n).toFixed(2)
}

const isSearchEmpty =
  computed(() => searchKeyword.value.trim() !== '' && products.value.length === 0)

useAppResumeRefresh(
  () => runSearch({ silent: true }),
  () => showToast({ type: 'fail', message: '前台恢复后刷新失败，请下拉重试' })
)

onMounted(() => {
  mediaQueryList = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
  isDesktop.value = mediaQueryList.matches
  onDesktopChange = (event: MediaQueryListEvent) => {
    isDesktop.value = event.matches
  }
  mediaQueryList.addEventListener('change', onDesktopChange)
  void runSearch()
})

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  if (mediaQueryList && onDesktopChange) {
    mediaQueryList.removeEventListener('change', onDesktopChange)
  }
  mediaQueryList = null
  onDesktopChange = null
})
</script>

<template>
  <div class="product-list">
    <van-search
      v-model="searchKeyword"
      placeholder="搜索商品名称或规格"
      shape="round"
      @update:model-value="onSearchInput"
    />
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list :loading="loading" :finished="true" finished-text="">
        <template v-if="products.length">
          <van-cell
            v-for="p in products"
            :key="p.id"
            :title="p.name"
            :label="p.spec || '—'"
            :value="`¥${formatPrice(p.sell_price)}`"
            class="product-cell"
            clickable
            @click="goToEdit(p.id)"
          />
        </template>
        <div v-else-if="isSearchEmpty" class="empty">
          <p>没有找到相关商品</p>
        </div>
        <div v-else class="empty">
          <p>暂无商品，点击右上角新增</p>
        </div>
      </van-list>
    </van-pull-refresh>
    <div class="fab-wrap">
      <van-button
        v-if="isDesktop && platformConfig.desktopBatchImportEnabled"
        type="primary"
        plain
        round
        class="fab fab-batch"
        @click="goToBatchImport"
      >
        批量录入
      </van-button>
      <van-button
        type="primary"
        round
        class="fab"
        @click="goToNew"
      >
        新增商品
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.product-list {
  padding-bottom: 4rem;
  font-size: 16px;
}
.product-cell {
  min-height: 44px;
}
.empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--van-gray-6, #969799);
}
.fab-wrap {
  position: fixed;
  right: 1rem;
  bottom: 4rem;
  z-index: 10;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.fab {
  min-height: 44px;
  min-width: 44px;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.fab-batch {
  min-width: auto;
}
</style>
