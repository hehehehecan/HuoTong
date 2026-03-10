-- suppliers 表与 RLS（Epic 3 Story 3.3）
-- 已通过 Supabase apply_migration 应用，此文件仅作留存复现

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  phone text,
  category text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select_authenticated"
  ON public.suppliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "suppliers_insert_authenticated"
  ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "suppliers_update_authenticated"
  ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "suppliers_delete_authenticated"
  ON public.suppliers FOR DELETE TO authenticated USING (true);
