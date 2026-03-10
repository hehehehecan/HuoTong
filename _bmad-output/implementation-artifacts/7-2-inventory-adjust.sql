-- Epic 7 Story 7.2: 手动库存调整（盘点校正）
-- 可复现 SQL：用于在新环境回放该 Story 的数据库变更（若未使用 migrations 则手动执行）

CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_product_id uuid,
  p_new_stock integer,
  p_reason_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_stock integer;
BEGIN
  IF p_new_stock < 0 THEN
    RAISE EXCEPTION 'adjust_stock: 库存不能为负数 (got %)', p_new_stock;
  END IF;

  SELECT COALESCE(stock, 0) INTO old_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'adjust_stock: 商品不存在 (id: %)', p_product_id;
  END IF;

  UPDATE public.products
  SET stock = p_new_stock,
      updated_at = now()
  WHERE id = p_product_id;

  INSERT INTO public.stock_logs (product_id, change, reason, reference_id, balance)
  VALUES (p_product_id, p_new_stock - old_stock, 'manual', NULL, p_new_stock);
END;
$$;

COMMENT ON FUNCTION public.adjust_stock(uuid, integer, text) IS 'Epic 7.2: 手动调整商品库存并记录变动（reason=manual）';

GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text) TO service_role;
