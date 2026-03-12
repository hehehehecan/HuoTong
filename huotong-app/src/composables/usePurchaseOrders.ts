import { ref, onScopeDispose } from 'vue'
import { supabase } from '../lib/supabase'
import { subscribeTable } from '../lib/realtime'
import { platformConfig } from '../lib/platform'
import { withNetworkRetry } from '../lib/networkRetry'

export interface PurchaseOrder {
  id: string
  order_no: string
  supplier_id: string
  total_amount: number
  status: 'draft' | 'confirmed'
  note: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface PurchaseOrderItemWithProduct extends PurchaseOrderItem {
  products?: { name: string; spec: string } | null
}

/** 列表项：订单 + 供应商名（join suppliers） */
export interface PurchaseOrderWithSupplier extends PurchaseOrder {
  suppliers?: { name: string }[] | { name: string } | null
}

export interface PurchaseOrderListFilters {
  supplier_id?: string
  date_from?: string
  date_to?: string
}

export interface PurchaseOrderItemInput {
  product_id: string
  quantity: number
  unit_price: number
}

export interface PurchaseOrderDraftInput {
  supplier_id: string
  items: PurchaseOrderItemInput[]
}

/** 识图结果：与 Edge Function recognize-receipt 返回格式一致（本 Story 使用 supplier_name、items、total） */
export interface RecognizeReceiptResult {
  supplier_name: string | null
  items: { name: string; quantity: number; unit_price: number }[]
  total: number | null
}

function toMoney(value: number): number {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return 0
  return Math.round(normalized * 100) / 100
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function isNonDraftError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase()
  if (msg.includes('order_already_confirmed')) return true
  if (msg.includes('不是') && msg.includes('draft')) return true
  if (msg.includes('not') && msg.includes('draft')) return true
  return false
}

function generateOrderNo(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).slice(2, 8)
  return `PO${y}${m}${d}-${random}`
}

export function usePurchaseOrders() {
  const loading = ref(false)
  const invalidateFns = new Set<() => void>()
  onScopeDispose(
    subscribeTable('purchase_orders', () => {
      invalidateFns.forEach((fn) => {
        try {
          fn()
        } catch (_) {}
      })
    })
  )
  function onInvalidate(fn: () => void): () => void {
    invalidateFns.add(fn)
    return () => invalidateFns.delete(fn)
  }

  async function createDraft(input: PurchaseOrderDraftInput): Promise<PurchaseOrder | null> {
    if (!input.supplier_id || !input.items.length) {
      throw new Error('请选择供应商并至少添加一件商品')
    }
    const items = input.items
      .map((i) => ({
        product_id: i.product_id,
        quantity: Math.max(1, Math.floor(Number(i.quantity)) || 1),
        unit_price: Math.max(0, toMoney(i.unit_price)),
      }))
      .filter((i) => i.quantity > 0 && i.unit_price >= 0)
    if (items.length === 0) {
      throw new Error('请至少添加一件商品')
    }
    const total_amount = items.reduce(
      (sum, i) => sum + i.quantity * i.unit_price,
      0
    )
    const order_no = generateOrderNo()

    loading.value = true
    try {
      return await withNetworkRetry(async () => {
        const { data: orderData, error: orderError } = await supabase
          .from('purchase_orders')
          .insert({
            order_no,
            supplier_id: input.supplier_id,
            total_amount: toMoney(total_amount),
            status: 'draft',
            note: null,
          })
          .select()
          .single()
        if (orderError) throw orderError
        const order = orderData as PurchaseOrder

        const rows = items.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: toMoney(i.quantity * i.unit_price),
        }))
        const { error: itemsError } = await supabase.from('purchase_order_items').insert(rows)
        if (itemsError) {
          await supabase.from('purchase_orders').delete().eq('id', order.id)
          throw itemsError
        }
        return order
      })
    } finally {
      loading.value = false
    }
  }

  async function getById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as PurchaseOrder
  }

  /** 列表：按创建时间倒序，可选供应商/日期范围筛选 */
  async function list(filters?: PurchaseOrderListFilters): Promise<PurchaseOrderWithSupplier[]> {
    loading.value = true
    try {
      return await withNetworkRetry(async () => {
        let q = supabase
          .from('purchase_orders')
          .select('id, order_no, supplier_id, total_amount, status, note, created_at, updated_at, suppliers(name)')
          .order('created_at', { ascending: false })
        if (filters?.supplier_id) {
          q = q.eq('supplier_id', filters.supplier_id)
        }
        if (filters?.date_from) {
          const start = new Date(filters.date_from + 'T00:00:00').toISOString()
          q = q.gte('created_at', start)
        }
        if (filters?.date_to) {
          const end = new Date(filters.date_to + 'T23:59:59.999').toISOString()
          q = q.lte('created_at', end)
        }
        const { data, error } = await q
        if (error) throw error
        return (data ?? []) as unknown as PurchaseOrderWithSupplier[]
      })
    } finally {
      loading.value = false
    }
  }

  async function getItemsWithProduct(orderId: string): Promise<PurchaseOrderItemWithProduct[]> {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .select('*, products(name, spec)')
      .eq('order_id', orderId)
      .order('id')
    if (error) throw error
    return (data ?? []) as PurchaseOrderItemWithProduct[]
  }

  async function confirm(orderId: string): Promise<void> {
    loading.value = true
    try {
      try {
        await withNetworkRetry(async () => {
          const { error } = await supabase.rpc('confirm_purchase_order', {
            order_id: orderId,
          })
          if (error) throw error
        })
      } catch (e) {
        // 网络重试后可能命中“非 draft”错误，回查状态避免误报失败。
        if (isNonDraftError(e)) {
          const latest = await getById(orderId)
          if (latest?.status === 'confirmed') return
        }
        throw e
      }
    } finally {
      loading.value = false
    }
  }

  function parseConfirmError(err: unknown): string | null {
    if (isNonDraftError(err)) return '该进货单已不是草稿，请刷新后重试'
    return null
  }

  /** 拍照识别：调用 recognize-receipt Edge Function，返回 supplier_name、items、total */
  async function recognizeFromImage(imageBase64: string): Promise<RecognizeReceiptResult | null> {
    if (!platformConfig.receiptRecognitionEnabled) {
      return null
    }

    try {
      const { data, error } = await withNetworkRetry(() =>
        supabase.functions.invoke('recognize-receipt', {
          body: { image_base64: imageBase64 },
        })
      )
      if (error) throw error
      const raw = data as string | { supplier_name?: string | null; items?: unknown; total?: number | null } | undefined
      if (raw === undefined || raw === null) return null
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as RecognizeReceiptResult) : raw
      const items = Array.isArray(parsed.items)
        ? parsed.items.map((i: { name?: string; quantity?: number; unit_price?: number }) => ({
            name: typeof i?.name === 'string' ? i.name : '',
            quantity: Number(i?.quantity) || 0,
            unit_price: Number(i?.unit_price) || 0,
          }))
        : []
      return {
        supplier_name: parsed.supplier_name ?? null,
        items,
        total: typeof parsed.total === 'number' ? parsed.total : null,
      }
    } catch {
      return null
    }
  }

  return {
    loading,
    createDraft,
    getById,
    list,
    getItemsWithProduct,
    confirm,
    parseConfirmError,
    recognizeFromImage,
    onInvalidate,
  }
}
