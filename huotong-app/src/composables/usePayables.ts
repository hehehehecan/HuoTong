import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface Payable {
  id: string
  purchase_order_id: string
  supplier_id: string
  amount: number
  paid_amount: number
  status: 'unpaid' | 'partial' | 'paid'
  created_at: string
  updated_at: string
}

export interface PayableWithOrder extends Payable {
  purchase_orders?: { order_no: string }[] | { order_no: string } | null
}

export interface PayableWithSupplier extends Payable {
  suppliers?: { name: string }[] | { name: string } | null
  purchase_orders?: { order_no: string }[] | { order_no: string } | null
}

export interface SupplierPayableSummary {
  supplier_id: string
  supplier_name: string
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

export function usePayables() {
  const loading = ref(false)

  /**
   * 获取所有未付/部分付的应付记录，按供应商分组汇总
   * 返回按总欠款降序排列的供应商汇总列表
   */
  async function listGroupedBySupplier(): Promise<SupplierPayableSummary[]> {
    loading.value = true
    try {
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from('payables')
          .select('id, purchase_order_id, supplier_id, amount, paid_amount, status, created_at, suppliers(name)')
          .in('status', ['unpaid', 'partial'])
          .order('created_at', { ascending: false })

        if (error) throw error

        const records = (data ?? []) as unknown as PayableWithSupplier[]

        const groupMap = new Map<string, SupplierPayableSummary>()

        for (const r of records) {
          const supplierId = r.supplier_id
          const suppliersData = r.suppliers
          const supplierName = Array.isArray(suppliersData)
            ? (suppliersData[0]?.name ?? '未知供应商')
            : (suppliersData?.name ?? '未知供应商')
          const unpaidAmount = Number(r.amount) - Number(r.paid_amount)

          if (groupMap.has(supplierId)) {
            const summary = groupMap.get(supplierId)!
            summary.total_amount += Number(r.amount)
            summary.total_paid += Number(r.paid_amount)
            summary.total_unpaid += unpaidAmount
            summary.unpaid_count += 1
          } else {
            groupMap.set(supplierId, {
              supplier_id: supplierId,
              supplier_name: supplierName,
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
   * 获取指定供应商的所有未付/部分付应付记录
   * 按日期倒序排列，包含关联的进货单号
   */
  async function listBySupplier(supplierId: string): Promise<PayableWithOrder[]> {
    loading.value = true
    try {
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from('payables')
          .select('id, purchase_order_id, supplier_id, amount, paid_amount, status, created_at, updated_at, purchase_orders(order_no)')
          .eq('supplier_id', supplierId)
          .in('status', ['unpaid', 'partial'])
          .order('created_at', { ascending: false })

        if (error) throw error

        return (data ?? []) as unknown as PayableWithOrder[]
      })
    } finally {
      loading.value = false
    }
  }

  return { loading, listGroupedBySupplier, listBySupplier }
}
