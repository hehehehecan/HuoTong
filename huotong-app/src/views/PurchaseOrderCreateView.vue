<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useSuppliers } from '../composables/useSuppliers'
import { useProducts } from '../composables/useProducts'
import { usePurchaseOrders } from '../composables/usePurchaseOrders'
import type { Supplier } from '../composables/useSuppliers'
import type { Product } from '../composables/useProducts'

interface OrderItemRow {
  product_id: string
  name: string
  spec: string
  buy_price: number
  quantity: number
  unit_price: number
}

const { fetchAll: fetchSuppliers, search: searchSuppliers } = useSuppliers()
const { search: searchProducts, fetchAll: fetchProducts } = useProducts()
const { createDraft, loading: saving, recognizeFromImage } = usePurchaseOrders()
const router = useRouter()

const recognizing = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const supplierPopupVisible = ref(false)
const productPopupVisible = ref(false)
const supplierSearchKeyword = ref('')
const productSearchKeyword = ref('')
const supplierList = ref<Supplier[]>([])
const productList = ref<Product[]>([])
const selectedSupplier = ref<Supplier | null>(null)
const unmatchedSupplierName = ref('')
const items = ref<OrderItemRow[]>([])
const quantityInput = ref('')
const unitPriceInput = ref('')
const selectedProductForQty = ref<Product | null>(null)
const replaceItemIndex = ref<number | null>(null)

function normalizeMoney(value: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function normalizeQuantity(value: number): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

function rowSubtotal(row: OrderItemRow): number {
  return normalizeMoney(normalizeQuantity(row.quantity) * normalizeMoney(row.unit_price))
}

const totalAmount = computed(() =>
  normalizeMoney(items.value.reduce((sum, i) => sum + rowSubtotal(i), 0))
)
const canSave = computed(
  () =>
    selectedSupplier.value &&
    items.value.length > 0 &&
    items.value.every((i) => normalizeQuantity(i.quantity) > 0 && normalizeMoney(i.unit_price) >= 0) &&
    items.value.every((i) => i.product_id)
)

async function loadSuppliers() {
  const k = supplierSearchKeyword.value.trim()
  if (k) {
    supplierList.value = await searchSuppliers(k)
  } else {
    supplierList.value = await fetchSuppliers()
  }
}

async function loadProducts() {
  const k = productSearchKeyword.value.trim()
  if (k) {
    productList.value = await searchProducts(k)
  } else {
    productList.value = await fetchProducts()
  }
}

function openSupplierPopup() {
  supplierSearchKeyword.value = ''
  supplierPopupVisible.value = true
  void loadSuppliers()
}

function selectSupplier(s: Supplier) {
  selectedSupplier.value = s
  unmatchedSupplierName.value = ''
  supplierPopupVisible.value = false
}

function openProductPopup() {
  productSearchKeyword.value = ''
  selectedProductForQty.value = null
  quantityInput.value = ''
  unitPriceInput.value = ''
  replaceItemIndex.value = null
  productPopupVisible.value = true
  void loadProducts()
}

function openProductPopupForReplace(index: number) {
  productSearchKeyword.value = ''
  selectedProductForQty.value = null
  quantityInput.value = ''
  unitPriceInput.value = ''
  replaceItemIndex.value = index
  productPopupVisible.value = true
  void loadProducts()
}

function selectProductForQuantity(p: Product) {
  selectedProductForQty.value = p
  quantityInput.value = p ? '1' : ''
  unitPriceInput.value = p ? String(p.buy_price ?? 0) : ''
}

function confirmAddProduct() {
  const p = selectedProductForQty.value
  const qty = parseInt(quantityInput.value, 10)
  const price = parseFloat(unitPriceInput.value)
  if (!p || !Number.isFinite(qty) || qty <= 0) {
    showToast('请输入有效数量')
    return
  }
  const product = p
  const unitPrice = Number.isFinite(price) && price >= 0 ? normalizeMoney(price) : Math.max(0, product.buy_price ?? 0)
  const idx = replaceItemIndex.value
  if (idx !== null && idx >= 0 && idx < items.value.length) {
    items.value[idx] = {
      product_id: product.id,
      name: product.name,
      spec: product.spec,
      buy_price: product.buy_price ?? 0,
      quantity: normalizeQuantity(qty),
      unit_price: unitPrice,
    }
    replaceItemIndex.value = null
  } else {
    const existing = items.value.find((i) => i.product_id === product.id)
    if (existing) {
      existing.quantity += normalizeQuantity(qty)
      existing.unit_price = unitPrice
    } else {
      items.value.push({
        product_id: product.id,
        name: product.name,
        spec: product.spec,
        buy_price: product.buy_price ?? 0,
        quantity: normalizeQuantity(qty),
        unit_price: unitPrice,
      })
    }
  }
  productPopupVisible.value = false
  selectedProductForQty.value = null
  quantityInput.value = ''
  unitPriceInput.value = ''
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function clampItemQuantity(row: OrderItemRow) {
  row.quantity = normalizeQuantity(row.quantity)
}

function clampItemUnitPrice(row: OrderItemRow) {
  row.unit_price = Math.max(0, normalizeMoney(row.unit_price))
}

async function saveDraft() {
  if (!canSave.value) {
    if (!selectedSupplier.value) {
      showToast(unmatchedSupplierName.value ? '请先手动选择供应商' : '请选择供应商')
      return
    }
    if (items.value.some((i) => !i.product_id)) {
      showToast('请为「需手动选择」的条目选择商品')
      return
    }
    if (items.value.length === 0 || !items.value.every((i) => i.quantity > 0)) {
      showToast('请至少添加一件商品')
      return
    }
  }
  try {
    const order = await createDraft({
      supplier_id: selectedSupplier.value!.id,
      items: items.value
        .filter((i) => i.product_id)
        .map((i) => ({
        product_id: i.product_id,
        quantity: normalizeQuantity(i.quantity),
        unit_price: Math.max(0, normalizeMoney(i.unit_price)),
      })),
    })
    if (order) {
      showToast({ type: 'success', message: '已保存' })
      router.push(`/purchase-orders/${order.id}`)
      selectedSupplier.value = null
      items.value = []
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '保存失败，请检查网络后重试'
    showToast({ type: 'fail', message: msg })
  }
}

function formatPrice(n: number) {
  return Number(n).toFixed(2)
}

/** 将图片压缩到 < 1MB 并返回 base64（data URL 去掉前缀） */
function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const estimateBase64Bytes = (dataUrl: string) => {
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
      return Math.floor((base64.length * 3) / 4) - padding
    }
    const toJpegDataUrl = (canvas: HTMLCanvasElement, quality: number) =>
      canvas.toDataURL('image/jpeg', quality)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxBytes = 1024 * 1024
      let w = Math.max(1, img.width)
      let h = Math.max(1, img.height)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      let quality = 0.85
      let attempts = 0
      let dataUrl = ''
      while (attempts < 12) {
        canvas.width = w
        canvas.height = h
        ctx.clearRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        dataUrl = toJpegDataUrl(canvas, quality)
        if (estimateBase64Bytes(dataUrl) <= maxBytes) {
          const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
          resolve(base64)
          return
        }
        if (quality > 0.4) {
          quality = Math.max(0.4, quality - 0.1)
        } else {
          w = Math.max(1, Math.floor(w * 0.85))
          h = Math.max(1, Math.floor(h * 0.85))
        }
        attempts += 1
      }
      reject(new Error('Image too large after compression'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

function triggerPhotoRecognize() {
  fileInputRef.value?.click()
}

async function onPhotoFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) {
    showToast('请选择图片文件')
    return
  }
  recognizing.value = true
  try {
    const base64 = await compressImageToBase64(file)
    const result = await recognizeFromImage(base64)
    if (!result) {
      showToast('识别失败，请重新拍照或手动录入')
      return
    }
    if (result.supplier_name) {
      const suppliers = await searchSuppliers(result.supplier_name)
      const first = suppliers[0]
      if (first) {
        selectedSupplier.value = first
        unmatchedSupplierName.value = ''
      } else {
        selectedSupplier.value = null
        unmatchedSupplierName.value = result.supplier_name
        showToast(`未匹配到供应商「${result.supplier_name}」，请手动选择`)
      }
    } else {
      unmatchedSupplierName.value = ''
    }
    for (const it of result.items) {
      if (!it.name) continue
      const products = await searchProducts(it.name)
      const qty = normalizeQuantity(it.quantity)
      const price = Math.max(0, normalizeMoney(it.unit_price))
      if (products.length > 0) {
        const prod = products[0]!
        const existing = items.value.find((i) => i.product_id === prod.id)
        if (existing) {
          existing.quantity += qty
          existing.unit_price = price || (prod.buy_price ?? 0)
        } else {
          items.value.push({
            product_id: prod.id,
            name: prod.name,
            spec: prod.spec,
            buy_price: prod.buy_price ?? 0,
            quantity: qty,
            unit_price: price || (prod.buy_price ?? 0),
          })
        }
      } else {
        items.value.push({
          product_id: '',
          name: `需手动选择：${it.name}`,
          spec: '',
          buy_price: price,
          quantity: qty,
          unit_price: price,
        })
      }
    }
  } catch {
    showToast('识别失败，请重新拍照或手动录入')
  } finally {
    recognizing.value = false
  }
}

onMounted(() => {
  void loadSuppliers().catch(() => {})
  void loadProducts().catch(() => {})
})
</script>

<template>
  <div class="purchase-order-create">
    <van-cell-group inset>
      <van-cell
        title="选择供应商"
        :value="selectedSupplier?.name ?? (unmatchedSupplierName ? `需手动选择：${unmatchedSupplierName}` : '请选择')"
        is-link
        @click="openSupplierPopup"
      />
    </van-cell-group>

    <div class="section-title">商品明细</div>
    <van-cell-group v-if="items.length" inset>
      <van-cell
        v-for="(row, index) in items"
        :key="row.product_id ? row.product_id + '-' + index : 'unmatched-' + index"
        :title="row.name"
        :label="row.product_id ? (row.spec || '—') : '点击下方选择商品'"
      >
        <template #value>
          <div class="item-row">
            <div class="item-fields">
              <input
                v-model.number="row.quantity"
                type="number"
                min="1"
                class="qty-input"
                @blur="clampItemQuantity(row)"
              />
              <input
                v-model.number="row.unit_price"
                type="number"
                min="0"
                step="0.01"
                class="price-input"
                placeholder="进价"
                @blur="clampItemUnitPrice(row)"
              />
            </div>
            <div class="subtotal">小计 ¥{{ formatPrice(rowSubtotal(row)) }}</div>
            <template v-if="row.product_id">
              <van-button size="small" type="danger" plain class="remove-btn" @click="removeItem(index)">
                删除
              </van-button>
            </template>
            <van-button
              v-else
              size="small"
              type="primary"
              plain
              class="remove-btn"
              @click="openProductPopupForReplace(index)"
            >
              选择商品
            </van-button>
          </div>
        </template>
      </van-cell>
    </van-cell-group>
    <div v-else class="empty-tip">暂无商品，请点击下方添加商品</div>

    <div class="footer-actions">
      <div class="total">合计：¥{{ formatPrice(totalAmount) }}</div>
      <div class="buttons">
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden-file-input"
          @change="onPhotoFileChange"
        />
        <van-button
          type="primary"
          plain
          round
          class="add-btn"
          :loading="recognizing"
          :disabled="recognizing"
          @click="triggerPhotoRecognize"
        >
          拍照识别
        </van-button>
        <van-button
          type="primary"
          plain
          round
          class="add-btn"
          @click="openProductPopup"
        >
          添加商品
        </van-button>
        <van-button
          type="primary"
          round
          :loading="saving"
          :disabled="!canSave"
          class="save-btn"
          @click="saveDraft"
        >
          保存
        </van-button>
      </div>
    </div>

    <!-- 选择供应商弹窗 -->
    <van-popup v-model:show="supplierPopupVisible" position="bottom" round style="height: 70%;">
      <div class="popup-header">选择供应商</div>
      <van-search
        v-model="supplierSearchKeyword"
        placeholder="搜索供应商名称或联系人"
        shape="round"
        @update:model-value="loadSuppliers"
      />
      <div class="popup-list">
        <van-cell
          v-for="s in supplierList"
          :key="s.id"
          :title="s.name"
          :label="s.contact || s.phone || '—'"
          clickable
          @click="selectSupplier(s)"
        />
        <div v-if="supplierList.length === 0" class="empty">暂无供应商</div>
      </div>
    </van-popup>

    <!-- 选择商品并输入数量、进价弹窗 -->
    <van-popup v-model:show="productPopupVisible" position="bottom" round style="height: 80%;">
      <div class="popup-header">添加商品</div>
      <van-search
        v-model="productSearchKeyword"
        placeholder="搜索商品名称或规格"
        shape="round"
        @update:model-value="loadProducts"
      />
      <div v-if="!selectedProductForQty" class="popup-list">
        <van-cell
          v-for="p in productList"
          :key="p.id"
          :title="p.name"
          :label="p.spec || '—'"
          :value="`进价 ¥${formatPrice(p.buy_price ?? 0)}`"
          clickable
          @click="selectProductForQuantity(p)"
        />
        <div v-if="productList.length === 0" class="empty">暂无商品</div>
      </div>
      <div v-else class="quantity-step">
        <van-cell :title="selectedProductForQty?.name" :label="selectedProductForQty?.spec" />
        <van-field
          v-model="quantityInput"
          type="number"
          label="数量"
          placeholder="请输入数量"
          :min="1"
        />
        <van-field
          v-model="unitPriceInput"
          type="number"
          label="进价"
          placeholder="请输入进价"
          :min="0"
        />
        <van-button type="primary" block round class="confirm-add" @click="confirmAddProduct">
          确认添加
        </van-button>
        <van-button block plain @click="selectedProductForQty = null; quantityInput = ''; unitPriceInput = ''">
          返回选择商品
        </van-button>
      </div>
    </van-popup>

    <van-overlay :show="recognizing">
      <div class="recognize-loading">
        <van-loading type="spinner" size="32" vertical>正在识别...</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<style scoped>
.purchase-order-create {
  padding-bottom: calc(12rem + var(--app-tabbar-height, 50px) + env(safe-area-inset-bottom));
  font-size: 16px;
}
.section-title {
  padding: 12px 16px 8px;
  font-weight: 600;
  color: var(--van-text-color);
}
.item-row {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.item-row .item-fields {
  display: flex;
  gap: 8px;
  align-items: center;
}
.qty-input,
.price-input {
  padding: 4px 8px;
  width: 72px;
  font-size: 14px;
  border: 1px solid var(--van-border-color);
  border-radius: 4px;
}
.item-row .subtotal {
  font-size: 14px;
  font-weight: 500;
}
.remove-btn {
  min-height: 28px;
}
.empty-tip {
  padding: 1rem 16px;
  color: var(--van-gray-6);
  text-align: center;
}
.footer-actions {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: calc(var(--app-tabbar-height, 50px) + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  width: min(100%, var(--app-content-max-width, 1200px));
  padding: 12px 16px;
  box-sizing: border-box;
  background: var(--van-background);
  border-top: 1px solid var(--van-border-color);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.06);
  z-index: 11;
}
.footer-actions .total {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
}
.footer-actions .buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.add-btn,
.save-btn {
  min-width: 0;
  min-height: 44px;
}
.save-btn {
  grid-column: 1 / -1;
}
.popup-header {
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}
.popup-list {
  max-height: 50vh;
  overflow-y: auto;
}
.popup-list .empty,
.quantity-step {
  padding: 16px;
}
.confirm-add {
  margin-top: 12px;
  margin-bottom: 8px;
}
.hidden-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.recognize-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

@media (min-width: 640px) {
  .purchase-order-create {
    padding-bottom: calc(8.5rem + var(--app-tabbar-height, 50px) + env(safe-area-inset-bottom));
  }

  .footer-actions .total {
    text-align: left;
  }

  .footer-actions .buttons {
    display: flex;
    flex-wrap: nowrap;
  }

  .add-btn,
  .save-btn {
    flex: 1;
  }

  .save-btn {
    grid-column: auto;
  }
}
</style>
