import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface Receivable {
  id: string
  sale_order_id: string
  customer_id: string
  amount: number
  paid_amount: number
  status: 'unpaid' | 'partial' | 'paid'
  created_at: string
  updated_at: string
}

export interface ReceivableWithOrder extends Receivable {
  sale_orders?: { order_no: string }[] | { order_no: string } | null
}

export interface ReceivableWithCustomer extends Receivable {
  customers?: { name: string }[] | { name: string } | null
  sale_orders?: { order_no: string }[] | { order_no: string } | null
}

export interface CustomerReceivableSummary {
  customer_id: string
  customer_name: string
  total_amount: number
  total_paid: number
  total_unpaid: number
  unpaid_count: number
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

export function useReceivables() {
  const loading = ref(false)

  /**
   * 获取所有未付/部分付的应收记录，按客户分组汇总
   * 返回按总欠款降序排列的客户汇总列表
   */
  async function listGroupedByCustomer(): Promise<CustomerReceivableSummary[]> {
    loading.value = true
    try {
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from('receivables')
          .select('id, sale_order_id, customer_id, amount, paid_amount, status, created_at, customers(name)')
          .in('status', ['unpaid', 'partial'])
          .order('created_at', { ascending: false })

        if (error) throw error

        const records = (data ?? []) as unknown as ReceivableWithCustomer[]

        const groupMap = new Map<string, CustomerReceivableSummary>()

        for (const r of records) {
          const customerId = r.customer_id
          const customersData = r.customers
          const customerName = Array.isArray(customersData)
            ? (customersData[0]?.name ?? '未知客户')
            : (customersData?.name ?? '未知客户')
          const unpaidAmount = Number(r.amount) - Number(r.paid_amount)

          if (groupMap.has(customerId)) {
            const summary = groupMap.get(customerId)!
            summary.total_amount += Number(r.amount)
            summary.total_paid += Number(r.paid_amount)
            summary.total_unpaid += unpaidAmount
            summary.unpaid_count += 1
          } else {
            groupMap.set(customerId, {
              customer_id: customerId,
              customer_name: customerName,
              total_amount: Number(r.amount),
              total_paid: Number(r.paid_amount),
              total_unpaid: unpaidAmount,
              unpaid_count: 1,
            })
          }
        }

        const summaries = Array.from(groupMap.values())
        summaries.sort((a, b) => b.total_unpaid - a.total_unpaid)

        return summaries
      })
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取指定客户的所有未付/部分付应收记录
   * 按日期倒序排列，包含关联的出货单号
   */
  async function listByCustomer(customerId: string): Promise<ReceivableWithOrder[]> {
    loading.value = true
    try {
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from('receivables')
          .select('id, sale_order_id, customer_id, amount, paid_amount, status, created_at, updated_at, sale_orders(order_no)')
          .eq('customer_id', customerId)
          .in('status', ['unpaid', 'partial'])
          .order('created_at', { ascending: false })

        if (error) throw error

        return (data ?? []) as unknown as ReceivableWithOrder[]
      })
    } finally {
      loading.value = false
    }
  }

  return { loading, listGroupedByCustomer, listByCustomer }
}
