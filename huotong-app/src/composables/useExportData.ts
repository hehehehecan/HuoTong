import { supabase } from '../lib/supabase'

const PAGE_SIZE = 1000

async function fetchAllFromTable<T>(table: string): Promise<T[]> {
  const rows: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data?.length) break
    rows.push(...(data as T[]))
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return rows
}

/**
 * 导出当前用户可见的全部业务数据为 JSON（Epic 7.5）
 * 包含：products, customers, suppliers, sale_orders, sale_order_items, purchase_orders, purchase_order_items, receivables, payables, stock_logs
 */
export async function exportDataAsJson(): Promise<void> {
  const [products, customers, suppliers, saleOrders, saleOrderItems, purchaseOrders, purchaseOrderItems, receivables, payables, stockLogs] =
    await Promise.all([
      fetchAllFromTable('products'),
      fetchAllFromTable('customers'),
      fetchAllFromTable('suppliers'),
      fetchAllFromTable('sale_orders'),
      fetchAllFromTable('sale_order_items'),
      fetchAllFromTable('purchase_orders'),
      fetchAllFromTable('purchase_order_items'),
      fetchAllFromTable('receivables'),
      fetchAllFromTable('payables'),
      fetchAllFromTable('stock_logs'),
    ])

  const payload = {
    exportedAt: new Date().toISOString(),
    products: products ?? [],
    customers: customers ?? [],
    suppliers: suppliers ?? [],
    sale_orders: saleOrders ?? [],
    sale_order_items: saleOrderItems ?? [],
    purchase_orders: purchaseOrders ?? [],
    purchase_order_items: purchaseOrderItems ?? [],
    receivables: receivables ?? [],
    payables: payables ?? [],
    stock_logs: stockLogs ?? [],
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const a = document.createElement('a')
  a.href = url
  a.download = `huotong-export-${datePart}-${timePart}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
