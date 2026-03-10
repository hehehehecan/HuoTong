import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface Supplier {
  id: string
  name: string
  contact: string | null
  phone: string | null
  category: string | null
  created_at: string
  updated_at: string
}

export interface SupplierInput {
  name: string
  contact?: string
  phone?: string
  category?: string
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

export function useSuppliers() {
  const suppliers = ref<Supplier[]>([])
  const loading = ref(false)
  let latestQueryId = 0

  async function fetchAll() {
    const queryId = ++latestQueryId
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      const nextSuppliers = (data ?? []) as Supplier[]
      if (queryId === latestQueryId) {
        suppliers.value = nextSuppliers
      }
      return nextSuppliers
    } finally {
      loading.value = false
    }
  }

  async function search(keyword: string): Promise<Supplier[]> {
    const k = keyword.trim()
    if (!k) return fetchAll()
    const queryId = ++latestQueryId
    loading.value = true
    try {
      const pattern = `%${escapeIlike(k)}%`
      const quoted = `"${pattern.replace(/"/g, '""')}"`
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .or(`name.ilike.${quoted},contact.ilike.${quoted}`)
        .order('name', { ascending: true })
      if (error) throw error
      const nextSuppliers = (data ?? []) as Supplier[]
      if (queryId === latestQueryId) {
        suppliers.value = nextSuppliers
      }
      return nextSuppliers
    } finally {
      loading.value = false
    }
  }

  async function create(input: SupplierInput): Promise<Supplier | null> {
    const payload = {
      name: input.name.trim(),
      contact: input.contact?.trim() ?? null,
      phone: input.phone?.trim() ?? null,
      category: input.category?.trim() ?? null,
    }
    if (!payload.name) {
      throw new Error('供应商名称不能为空')
    }
    const result = await withRetry(async () => {
      const r = await supabase.from('suppliers').insert(payload).select().single()
      if (r.error) throw r.error
      return r.data as Supplier
    })
    return result
  }

  async function getById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as Supplier
  }

  async function update(id: string, input: Partial<SupplierInput>): Promise<Supplier | null> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (input.name !== undefined) payload.name = input.name.trim()
    if (input.contact !== undefined) payload.contact = input.contact?.trim() ?? null
    if (input.phone !== undefined) payload.phone = input.phone?.trim() ?? null
    if (input.category !== undefined) payload.category = input.category?.trim() ?? null
    if (payload.name === '') {
      throw new Error('供应商名称不能为空')
    }
    const result = await withRetry(async () => {
      const r = await supabase.from('suppliers').update(payload).eq('id', id).select().single()
      if (r.error) throw r.error
      return r.data as Supplier
    })
    return result
  }

  async function remove(id: string): Promise<void> {
    await withRetry(async () => {
      const r = await supabase.from('suppliers').delete().eq('id', id)
      if (r.error) throw r.error
    })
  }

  return { suppliers, loading, fetchAll, search, create, getById, update, remove }
}
