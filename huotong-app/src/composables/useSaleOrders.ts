import { ref } from 'vue'
import { supabase } from '../lib/supabase'
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

export interface SaleOrderItemInput {
  product_id: string
  quantity: number
  unit_price: number
}

export interface SaleOrderDraftInput {
  customer_id: string
  items: SaleOrderItemInput[]
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

  return { loading, createDraft, getById, getItemsByOrderId }
}
