<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button as VanButton, showToast } from 'vant'
import { useProducts } from '../composables/useProducts'
import type { ProductInput } from '../composables/useProducts'
import { platformConfig } from '../lib/platform'

const router = useRouter()
const { createBatch } = useProducts()

const DESKTOP_BREAKPOINT = 768
const isDesktop = ref(window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches)
let mediaQueryList: MediaQueryList | null = null
let onDesktopChange: ((event: MediaQueryListEvent) => void) | null = null

interface Row {
  name: string
  spec: string
  sell_price: string
  buy_price: string
}

const rows = ref<Row[]>([
  { name: '', spec: '', sell_price: '', buy_price: '' },
])
const submitting = ref(false)
const errorRowIndices = ref<Set<number>>(new Set())

function addRow() {
  rows.value.push({ name: '', spec: '', sell_price: '', buy_price: '' })
  errorRowIndices.value = new Set()
}

function removeRow(index: number) {
  if (rows.value.length <= 1) return
  rows.value.splice(index, 1)
  errorRowIndices.value = new Set()
}

function toProductInput(r: Row): ProductInput {
  return {
    name: r.name.trim(),
    spec: r.spec.trim() || undefined,
    sell_price: parseFloat(r.sell_price) || 0,
    buy_price: parseFloat(r.buy_price) || 0,
  }
}

function validate(): number[] {
  const invalid: number[] = []
  rows.value.forEach((r, i) => {
    if (!r.name.trim()) invalid.push(i + 1)
  })
  return invalid
}

async function onBatchSave() {
  if (submitting.value) return
  const invalid = validate()
  if (invalid.length > 0) {
    errorRowIndices.value = new Set(invalid)
    const first = invalid[0]
    showToast({ type: 'fail', message: `第 ${first} 行：请填写商品名称` })
    return
  }
  errorRowIndices.value = new Set()

  const items = rows.value
    .map(toProductInput)
    .filter((x) => x.name.length > 0)
  if (items.length === 0) {
    showToast({ type: 'fail', message: '请至少填写一行商品名称' })
    return
  }

  submitting.value = true
  try {
    const { count } = await createBatch(items)
    showToast({ type: 'success', message: `成功录入 ${count} 件商品` })
    router.push('/products')
  } catch {
    showToast({ type: 'fail', message: '保存失败，请检查网络后重试' })
  } finally {
    submitting.value = false
  }
}

function isErrorRow(index: number) {
  return errorRowIndices.value.has(index + 1)
}

function clearErrorRow(index: number) {
  errorRowIndices.value = new Set([...errorRowIndices.value].filter((i) => i !== index + 1))
}

onMounted(() => {
  if (!platformConfig.desktopBatchImportEnabled) {
    showToast(platformConfig.featureTips.batchImport)
    router.replace('/products')
    return
  }
  mediaQueryList = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
  isDesktop.value = mediaQueryList.matches
  if (!mediaQueryList.matches) {
    showToast('批量录入请使用电脑端')
    router.replace('/products/new')
    return
  }
  onDesktopChange = (event: MediaQueryListEvent) => {
    isDesktop.value = event.matches
    if (!event.matches) {
      showToast('批量录入请使用电脑端')
      router.replace('/products/new')
    }
  }
  mediaQueryList.addEventListener('change', onDesktopChange)
})

onUnmounted(() => {
  if (mediaQueryList && onDesktopChange) {
    mediaQueryList.removeEventListener('change', onDesktopChange)
  }
  mediaQueryList = null
  onDesktopChange = null
})
</script>

<template>
  <div v-if="isDesktop" class="batch-import">
    <div class="table-wrap">
      <table class="batch-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>规格</th>
            <th>售价</th>
            <th>进价</th>
            <th class="th-action" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="index"
            :class="{ 'error-row': isErrorRow(index) }"
          >
            <td>
              <input
                v-model="row.name"
                type="text"
                placeholder="必填"
                class="cell-input"
                @input="clearErrorRow(index)"
              />
            </td>
            <td>
              <input
                v-model="row.spec"
                type="text"
                placeholder="—"
                class="cell-input"
              />
            </td>
            <td>
              <input
                v-model="row.sell_price"
                type="number"
                placeholder="0"
                class="cell-input"
              />
            </td>
            <td>
              <input
                v-model="row.buy_price"
                type="number"
                placeholder="0"
                class="cell-input"
              />
            </td>
            <td class="td-action">
              <button
                type="button"
                class="btn-remove"
                :disabled="rows.length <= 1"
                @click="removeRow(index)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="actions">
      <van-button
        type="primary"
        plain
        class="btn-add"
        @click="addRow"
      >
        添加一行
      </van-button>
      <van-button
        type="primary"
        class="btn-save"
        :loading="submitting"
        :disabled="submitting"
        @click="onBatchSave"
      >
        批量保存
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.batch-import {
  padding: 1rem;
  font-size: 16px;
}
.table-wrap {
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid var(--van-border-color, #ebedf0);
  border-radius: 8px;
}
.batch-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 480px;
}
.batch-table th,
.batch-table td {
  padding: 10px 8px;
  text-align: left;
  border-bottom: 1px solid var(--van-border-color, #ebedf0);
}
.batch-table thead {
  position: sticky;
  top: 0;
  background: var(--van-background-2, #f7f8fa);
}
.batch-table tbody tr.error-row {
  background: rgba(255, 0, 0, 0.08);
}
.batch-table tbody tr:last-child td {
  border-bottom: none;
}
.th-action,
.td-action {
  width: 72px;
  text-align: center;
}
.cell-input {
  width: 100%;
  min-width: 0;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid var(--van-border-color, #ebedf0);
  border-radius: 4px;
  box-sizing: border-box;
}
.cell-input:focus {
  outline: none;
  border-color: var(--van-primary-color, #1989fa);
}
.btn-remove {
  padding: 4px 8px;
  font-size: 12px;
  color: var(--van-danger-color, #ee0a24);
  background: none;
  border: none;
  cursor: pointer;
}
.btn-remove:disabled {
  color: var(--van-gray-5, #c8c9cc);
  cursor: not-allowed;
}
.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.btn-add {
  min-height: 44px;
}
.btn-save {
  min-height: 44px;
}
</style>
