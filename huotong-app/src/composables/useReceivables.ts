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

function toMoney(value: number): number {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return 0
  return Math.round(normalized * 100) / 100
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

  /**
   * 记录应收付款：更新 paid_amount 与 status（partial/paid）
   * @throws 当付款金额超过剩余未付时抛出错误信息，供上层 Toast 展示
   */
  async function recordPayment(id: string, paymentAmount: number): Promise<void> {
    const amount = toMoney(paymentAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('请输入有效的付款金额')
    }
    return await withRetry(async () => {
      const { data: row, error: fetchError } = await supabase
        .from('receivables')
        .select('amount, paid_amount')
        .eq('id', id)
        .single()

      if (fetchError || !row) throw fetchError || new Error('记录不存在')
      const total = toMoney(Number(row.amount))
      const paid = toMoney(Number(row.paid_amount))
      const remaining = toMoney(total - paid)
      if (remaining <= 0) {
        throw new Error('该记录已结清')
      }
      if (amount > remaining) {
        throw new Error('付款金额不能超过未付金额')
      }
      const newPaid = toMoney(paid + amount)
      const newStatus: 'paid' | 'partial' = newPaid >= total ? 'paid' : 'partial'
      const { error: updateError } = await supabase
        .from('receivables')
        .update({
          paid_amount: newPaid,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError
    })
  }

  return { loading, listGroupedByCustomer, listByCustomer, recordPayment }
}
