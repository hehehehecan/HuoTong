-- payables 表与 confirm_purchase_order 函数（Epic 5 Story 5.2）
-- 可复现 SQL：用于在新环境回放该 Story 的数据库变更

CREATE TABLE IF NOT EXISTS public.payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  paid_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status text NOT NULL DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payables_select_authenticated" ON public.payables;
CREATE POLICY "payables_select_authenticated"
  ON public.payables FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "payables_insert_authenticated" ON public.payables;
CREATE POLICY "payables_insert_authenticated"
  ON public.payables FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "payables_update_authenticated" ON public.payables;
CREATE POLICY "payables_update_authenticated"
  ON public.payables FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payables_delete_authenticated" ON public.payables;
CREATE POLICY "payables_delete_authenticated"
  ON public.payables FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.confirm_purchase_order(order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row public.purchase_orders%ROWTYPE;
  item_row RECORD;
  new_balance integer;
BEGIN
  SELECT *
    INTO order_row
  FROM public.purchase_orders
  WHERE id = order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF order_row.status = 'confirmed' THEN
    RAISE EXCEPTION 'ORDER_ALREADY_CONFIRMED';
  END IF;

  IF order_row.status <> 'draft' THEN
    RAISE EXCEPTION 'ORDER_NOT_DRAFT';
  END IF;

  UPDATE public.purchase_orders
  SET status = 'confirmed',
      updated_at = now()
  WHERE id = order_id;

  FOR item_row IN
    SELECT poi.product_id, poi.quantity
    FROM public.purchase_order_items poi
    WHERE poi.order_id = order_id
  LOOP
    UPDATE public.products p
    SET stock = COALESCE(p.stock, 0) + item_row.quantity,
        updated_at = now()
    WHERE p.id = item_row.product_id
    RETURNING stock INTO new_balance;

    INSERT INTO public.stock_logs (product_id, change, reason, reference_id, balance)
    VALUES (item_row.product_id, item_row.quantity, 'purchase_order', order_id, new_balance);
  END LOOP;

  INSERT INTO public.payables (purchase_order_id, supplier_id, amount, paid_amount, status)
  VALUES (order_id, order_row.supplier_id, order_row.total_amount, 0, 'unpaid');
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_purchase_order(uuid) TO authenticated;
