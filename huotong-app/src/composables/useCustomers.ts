import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface Customer {
  id: string
  name: string
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface CustomerInput {
  name: string
  phone?: string
  address?: string
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

function escapeIlike(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

export function useCustomers() {
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  let latestQueryId = 0

  async function fetchAll() {
    const queryId = ++latestQueryId
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      const nextCustomers = (data ?? []) as Customer[]
      if (queryId === latestQueryId) {
        customers.value = nextCustomers
      }
      return nextCustomers
    } finally {
      loading.value = false
    }
  }

  async function search(keyword: string): Promise<Customer[]> {
    const k = keyword.trim()
    if (!k) return fetchAll()
    const queryId = ++latestQueryId
    loading.value = true
    try {
      const pattern = `%${escapeIlike(k)}%`
      const quoted = `"${pattern.replace(/"/g, '""')}"`
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.${quoted},phone.ilike.${quoted}`)
        .order('name', { ascending: true })
      if (error) throw error
      const nextCustomers = (data ?? []) as Customer[]
      if (queryId === latestQueryId) {
        customers.value = nextCustomers
      }
      return nextCustomers
    } finally {
      loading.value = false
    }
  }

  async function create(input: CustomerInput): Promise<Customer | null> {
    const payload = {
      name: input.name.trim(),
      phone: input.phone?.trim() ?? null,
      address: input.address?.trim() ?? null,
    }
    if (!payload.name) {
      throw new Error('客户姓名不能为空')
    }
    const result = await withRetry(async () => {
      const r = await supabase.from('customers').insert(payload).select().single()
      if (r.error) throw r.error
      return r.data as Customer
    })
    return result
  }

  return { customers, loading, fetchAll, search, create }
}
