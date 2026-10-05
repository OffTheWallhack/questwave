/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DEMO?: string
  readonly VITE_GOOGLE?: string
  readonly VITE_LOCAL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
