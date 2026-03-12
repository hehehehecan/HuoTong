/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_REALTIME_ENABLED?: string
  readonly VITE_RECEIPT_RECOGNITION_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
