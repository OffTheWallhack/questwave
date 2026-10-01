import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createMockClient } from './mock'

export const DEMO = import.meta.env.VITE_DEMO === '1'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const CONFIGURED = Boolean(url && key)

if (!DEMO && (!url || !key)) {
  console.warn('Chýbajú premenné VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY. Skopíruj .env.example do .env.')
}

export const supabase: SupabaseClient = DEMO
  ? (createMockClient() as SupabaseClient)
  : createClient(url || 'https://missing.supabase.co', key || 'missing')
