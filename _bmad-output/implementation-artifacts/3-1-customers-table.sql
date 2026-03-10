-- 客户表与 RLS（与 create_customers_table_and_rls migration 一致，供复现参考）
-- 若使用 Supabase CLI：supabase migration new create_customers_table_and_rls，再粘贴本内容

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_select_authenticated ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY customers_insert_authenticated ON public.customers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY customers_update_authenticated ON public.customers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY customers_delete_authenticated ON public.customers
  FOR DELETE TO authenticated USING (true);
