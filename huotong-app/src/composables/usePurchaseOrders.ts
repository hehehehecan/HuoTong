import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

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

export interface PurchaseOrderItemInput {
  product_id: string
  quantity: number
  unit_price: number
}

export interface PurchaseOrderDraftInput {
  supplier_id: string
  items: PurchaseOrderItemInput[]
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
  if (msg.includes('order_already_confirmed')) return true
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
  return `PO${y}${m}${d}-${random}`
}

export function usePurchaseOrders() {
  const loading = ref(false)

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
      return await withRetry(async () => {
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
        await withRetry(async () => {
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

  return {
    loading,
    createDraft,
    getById,
    getItemsWithProduct,
    confirm,
    parseConfirmError,
  }
}
