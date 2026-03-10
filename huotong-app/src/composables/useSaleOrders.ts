import { ref, onScopeDispose } from 'vue'
import { supabase } from '../lib/supabase'
import { subscribeTable } from '../lib/realtime'
import type { PostgrestError } from '@supabase/supabase-js'

export interface SaleOrder {
  id: string
  order_no: string
  customer_id: string
  total_amount: number
  status: 'draft' | 'confirmed'
  note: string | null
  created_at: string
  updated_at: string
}

export interface SaleOrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface SaleOrderItemWithProduct extends SaleOrderItem {
  products?: { name: string; spec: string } | null
}

/** 列表项：订单 + 客户名（join customers） */
export interface SaleOrderWithCustomer extends SaleOrder {
  customers?: { name: string }[] | { name: string } | null
}

export interface SaleOrderItemInput {
  product_id: string
  quantity: number
  unit_price: number
}

export interface SaleOrderDraftInput {
  customer_id: string
  items: SaleOrderItemInput[]
}

export interface SaleOrderListFilters {
  customer_id?: string
  date_from?: string
  date_to?: string
}

/** 识图结果：与 Edge Function recognize-receipt 返回格式一致 */
export interface RecognizeReceiptResult {
  customer_name: string | null
  supplier_name: string | null
  items: { name: string; quantity: number; unit_price: number }[]
  total: number | null
}

function toMoney(value: number): number {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return 0
  return Math.round(normalized * 100) / 100
}

function isNetworkError(err: PostgrestError | Error): boolean {
  const msg = err?.message?.toLowerCase() ?? ''
  return (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror')
  )
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function isNonDraftError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase()
  if (msg.includes('order_not_draft')) return true
  if (msg.includes('不是') && msg.includes('draft')) return true
  if (msg.includes('not') && msg.includes('draft')) return true
  return false
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (retries > 0 && isNetworkError(e as Error)) {
      return await fn()
    }
    throw e
  }
}

function generateOrderNo(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).slice(2, 8)
  return `SO${y}${m}${d}-${random}`
}

export function useSaleOrders() {
  const loading = ref(false)
  const invalidateFns = new Set<() => void>()
  onScopeDispose(
    subscribeTable('sale_orders', () => {
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

  /** 列表：按创建时间倒序，可选客户/日期范围筛选 */
  async function list(filters?: SaleOrderListFilters): Promise<SaleOrderWithCustomer[]> {
    loading.value = true
    try {
      return await withRetry(async () => {
        let q = supabase
          .from('sale_orders')
          .select('id, order_no, customer_id, total_amount, status, note, created_at, updated_at, customers(name)')
          .order('created_at', { ascending: false })
        if (filters?.customer_id) {
          q = q.eq('customer_id', filters.customer_id)
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
        return (data ?? []) as unknown as SaleOrderWithCustomer[]
      })
    } finally {
      loading.value = false
    }
  }

  async function createDraft(input: SaleOrderDraftInput): Promise<SaleOrder | null> {
    if (!input.customer_id || !input.items.length) {
      throw new Error('请选择客户并至少添加一件商品')
    }
    const items = input.items
      .map((i) => ({
        product_id: i.product_id,
        quantity: Number(i.quantity),
        unit_price: toMoney(i.unit_price),
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
      return await withRetry(async () => {
        const { data: orderData, error: orderError } = await supabase
          .from('sale_orders')
          .insert({
            order_no,
            customer_id: input.customer_id,
            total_amount: toMoney(total_amount),
            status: 'draft',
            note: null,
          })
          .select()
          .single()
        if (orderError) throw orderError
        const order = orderData as SaleOrder

        const rows = items.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: toMoney(i.quantity * i.unit_price),
        }))
        const { error: itemsError } = await supabase.from('sale_order_items').insert(rows)
        if (itemsError) {
          // 避免明细失败后残留孤立主单。
          await supabase.from('sale_orders').delete().eq('id', order.id)
          throw itemsError
        }
        return order
      })
    } finally {
      loading.value = false
    }
  }

  async function getById(id: string): Promise<SaleOrder | null> {
    const { data, error } = await supabase
      .from('sale_orders')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as SaleOrder
  }

  async function getItemsByOrderId(orderId: string): Promise<SaleOrderItem[]> {
    const { data, error } = await supabase
      .from('sale_order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('id')
    if (error) throw error
    return (data ?? []) as SaleOrderItem[]
  }

  async function getItemsWithProduct(orderId: string): Promise<SaleOrderItemWithProduct[]> {
    const { data, error } = await supabase
      .from('sale_order_items')
      .select('*, products(name, spec)')
      .eq('order_id', orderId)
      .order('id')
    if (error) throw error
    return (data ?? []) as SaleOrderItemWithProduct[]
  }

  /** 确认出货：调用 RPC，成功无返回值；失败抛错或携带库存不足信息 */
  async function confirm(orderId: string): Promise<void> {
    loading.value = true
    try {
      try {
        await withRetry(async () => {
          const { error } = await supabase.rpc('confirm_sale_order', {
            order_id: orderId,
          })
          if (error) throw error
        })
      } catch (e) {
        // 网络超时后重试可能命中“非 draft”错误，回查状态避免误判失败。
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

  /** 解析 RPC 错误：若为库存不足返回可展示文案，否则返回 null */
  function parseConfirmError(err: unknown): string | null {
    const msg = getErrorMessage(err)
    const m = msg.match(/INSUFFICIENT_STOCK:(.+)/)
    const payload = m?.[1]
    if (payload) {
      const parts = payload.split(',')
      const name = parts[0] ?? '商品'
      const current = parts[1] ?? '0'
      const need = parts[2] ?? '0'
      return `商品 ${name} 库存不足（当前 ${current} 件，需要 ${need} 件）`
    }
    if (isNonDraftError(err)) {
      return '该出货单已不是草稿，请刷新后重试'
    }
    return null
  }

  /** 拍照识别：调用 Edge Function recognize-receipt，返回解析后的 JSON；失败返回 null 并可由调用方 Toast */
  async function recognizeFromImage(imageBase64: string): Promise<RecognizeReceiptResult | null> {
    try {
      const { data, error } = await withRetry(() =>
        supabase.functions.invoke('recognize-receipt', {
          body: { image_base64: imageBase64 },
        })
      )
      if (error) throw error
      const raw = data as string | RecognizeReceiptResult | undefined
      if (raw === undefined || raw === null) return null
      const parsed =
        typeof raw === 'string'
          ? (JSON.parse(raw) as RecognizeReceiptResult)
          : raw
      if (!Array.isArray(parsed.items)) parsed.items = []
      return {
        customer_name: parsed.customer_name ?? null,
        supplier_name: parsed.supplier_name ?? null,
        items: parsed.items.map((i) => ({
          name: typeof i?.name === 'string' ? i.name : '',
          quantity: Number(i?.quantity) || 0,
          unit_price: Number(i?.unit_price) || 0,
        })),
        total: typeof parsed.total === 'number' ? parsed.total : null,
      }
    } catch {
      return null
    }
  }

  return { loading, list, createDraft, getById, getItemsByOrderId, getItemsWithProduct, confirm, parseConfirmError, recognizeFromImage, onInvalidate }
}
