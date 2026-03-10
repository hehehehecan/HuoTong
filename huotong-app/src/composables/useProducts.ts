import { ref, onScopeDispose } from 'vue'
import { supabase } from '../lib/supabase'
import { subscribeTable } from '../lib/realtime'
import type { PostgrestError } from '@supabase/supabase-js'

export interface Product {
  id: string
  name: string
  spec: string
  sell_price: number
  buy_price: number
  stock: number
  created_at: string
  updated_at: string
}

export interface ProductInput {
  name: string
  spec?: string
  sell_price?: number
  buy_price?: number
  stock?: number
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

/** Escape % and _ for use in Supabase ilike pattern (literal match). */
function escapeIlike(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

export function useProducts() {
  const products = ref<Product[]>([])
  const loading = ref(false)
  let latestQueryId = 0
  let currentKeyword = ''

  function refreshByCurrentQuery(): Promise<Product[]> {
    return currentKeyword ? search(currentKeyword) : fetchAll()
  }

  async function fetchAll() {
    const queryId = ++latestQueryId
    currentKeyword = ''
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      const nextProducts = (data ?? []) as Product[]
      if (queryId === latestQueryId) {
        products.value = nextProducts
      }
      return nextProducts
    } finally {
      loading.value = false
    }
  }

  async function create(input: ProductInput): Promise<Product | null> {
    const payload = {
      name: input.name.trim(),
      spec: input.spec?.trim() ?? '',
      sell_price: input.sell_price ?? 0,
      buy_price: input.buy_price ?? 0,
      stock: input.stock ?? 0,
    }
    const result = await withRetry(async () => {
      const r = await supabase.from('products').insert(payload).select().single()
      if (r.error) throw r.error
      return r.data as Product
    })
    return result
  }

  async function search(keyword: string): Promise<Product[]> {
    const k = keyword.trim()
    if (!k) return fetchAll()
    currentKeyword = k
    const queryId = ++latestQueryId
    loading.value = true
    try {
      const pattern = `%${escapeIlike(k)}%`
      const quoted = `"${pattern.replace(/"/g, '""')}"`
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.${quoted},spec.ilike.${quoted}`)
        .order('name', { ascending: true })
      if (error) throw error
      const nextProducts = (data ?? []) as Product[]
      if (queryId === latestQueryId) {
        products.value = nextProducts
      }
      return nextProducts
    } finally {
      loading.value = false
    }
  }

  async function getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Product
  }

  async function update(
    id: string,
    input: Partial<ProductInput>
  ): Promise<Product | null> {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name.trim()
    if (input.spec !== undefined) payload.spec = input.spec?.trim() ?? ''
    if (input.sell_price !== undefined) payload.sell_price = input.sell_price
    if (input.buy_price !== undefined) payload.buy_price = input.buy_price
    const result = await withRetry(async () => {
      const r = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (r.error) throw r.error
      return r.data as Product
    })
    return result
  }

  async function remove(id: string): Promise<void> {
    await withRetry(async () => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    })
  }

  async function createBatch(items: ProductInput[]): Promise<{ count: number }> {
    if (items.length === 0) return { count: 0 }
    const rows = items.map((input) => ({
      name: input.name.trim(),
      spec: input.spec?.trim() ?? '',
      sell_price: input.sell_price ?? 0,
      buy_price: input.buy_price ?? 0,
      stock: input.stock ?? 0,
    }))
    const result = await withRetry(async () => {
      const { data, error } = await supabase.from('products').insert(rows).select('id')
      if (error) throw error
      return { count: (data ?? []).length }
    })
    return result
  }

  onScopeDispose(subscribeTable('products', () => { void refreshByCurrentQuery() }))

  return { products, loading, fetchAll, search, create, createBatch, getById, update, remove }
}
