import { supabase } from '../lib/supabase'

/**
 * 库存变动记录（含关联单据号，Epic 7.3）
 */
export interface StockLogWithOrderNo {
  id: string
  product_id: string
  change: number
  reason: 'sale_order' | 'purchase_order' | 'manual'
  reference_id: string | null
  balance: number
  created_at: string
  orderNo?: string
}

/**
 * 获取某商品的库存变动列表（Epic 7.3）
 * 按 created_at 倒序；sale_order/purchase_order 时批量查 order_no 填入 orderNo
 */
export async function getStockLogs(productId: string): Promise<StockLogWithOrderNo[]> {
  const { data: logs, error: logsError } = await supabase
    .from('stock_logs')
    .select('id, product_id, change, reason, reference_id, balance, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (logsError) throw logsError
  if (!logs?.length) return []

  const saleOrderIds = [...new Set(
    logs
      .filter((r) => r.reason === 'sale_order' && r.reference_id)
      .map((r) => r.reference_id as string)
  )]
  const purchaseOrderIds = [...new Set(
    logs
      .filter((r) => r.reason === 'purchase_order' && r.reference_id)
      .map((r) => r.reference_id as string)
  )]

  let saleOrderNos: Record<string, string> = {}
  let purchaseOrderNos: Record<string, string> = {}

  if (saleOrderIds.length > 0) {
    const { data: saleRows, error: saleError } = await supabase
      .from('sale_orders')
      .select('id, order_no')
      .in('id', saleOrderIds)
    if (saleError) throw saleError
    saleOrderNos = Object.fromEntries((saleRows ?? []).map((r) => [r.id, r.order_no ?? '']))
  }
  if (purchaseOrderIds.length > 0) {
    const { data: purchaseRows, error: purchaseError } = await supabase
      .from('purchase_orders')
      .select('id, order_no')
      .in('id', purchaseOrderIds)
    if (purchaseError) throw purchaseError
    purchaseOrderNos = Object.fromEntries((purchaseRows ?? []).map((r) => [r.id, r.order_no ?? '']))
  }

  return logs.map((row) => ({
    ...row,
    reason: row.reason as StockLogWithOrderNo['reason'],
    orderNo:
      row.reason === 'sale_order' && row.reference_id
        ? saleOrderNos[row.reference_id] ?? '—'
        : row.reason === 'purchase_order' && row.reference_id
          ? purchaseOrderNos[row.reference_id] ?? '—'
          : '—',
  }))
}

/**
 * 手动调整商品库存（Epic 7.2）
 * 调用 RPC adjust_stock：原子更新 products.stock 并插入 stock_logs（reason=manual）
 */
export async function adjustStock(
  productId: string,
  newStock: number,
  reasonNote: string
): Promise<void> {
  const { error } = await supabase.rpc('adjust_stock', {
    p_product_id: productId,
    p_new_stock: newStock,
    p_reason_note: reasonNote.trim() || null,
  })
  if (error) throw error
}
