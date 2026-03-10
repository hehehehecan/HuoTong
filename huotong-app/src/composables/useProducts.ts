import { ref } from 'vue'
import { supabase } from '../lib/supabase'
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

export function useProducts() {
  const products = ref<Product[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      products.value = (data ?? []) as Product[]
      return products.value
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

  return { products, loading, fetchAll, create }
}
