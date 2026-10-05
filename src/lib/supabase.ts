import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createMockClient } from './mock'

export const DEMO = import.meta.env.VITE_DEMO === '1'
/** Beta bez servera: postup sa ukladá v telefóne, ostatní hráči sú zatiaľ ukážkoví. */
export const LOCAL = import.meta.env.VITE_LOCAL === '1'
/** Appka nepotrebuje databázu (demo alebo beta). */
export const OFFLINE = DEMO || LOCAL

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const CONFIGURED = Boolean(url && key)

if (!OFFLINE && (!url || !key)) {
  console.warn('Chýbajú premenné VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY. Skopíruj .env.example do .env.')
}

export const supabase: SupabaseClient = OFFLINE
  ? (createMockClient({ local: LOCAL }) as SupabaseClient)
  : createClient(url || 'https://missing.supabase.co', key || 'missing')
