import { supabase } from '../lib/supabase'

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
