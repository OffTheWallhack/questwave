import { supabase } from './supabase'
import type { DailyQuest, Lang } from './types'

/** Dnešný svetový quest aj s questom zo zásobníka, ak je naň naviazaný. Funguje aj bez prihlásenia. */
export async function fetchDaily(): Promise<DailyQuest | null> {
  const { data: dq } = await supabase.rpc('ensure_daily_quest')
  const row = (Array.isArray(dq) ? dq[0] : dq) as DailyQuest | null
  if (!row?.quest_id) return row
  const { data: q } = await supabase.from('quests').select('*').eq('id', row.quest_id).maybeSingle()
  return { ...row, quests: q ?? null }
}

/** Názov a popis svetového questu v jazyku hráča. */
export function dailyText(daily: DailyQuest | null, lang: Lang) {
  const pick = (sk?: string | null, en?: string | null) => (lang === 'sk' ? sk : en ?? sk) ?? ''
  const title = daily?.custom_title_sk
    ? pick(daily.custom_title_sk, daily.custom_title_en)
    : pick(daily?.quests?.title_sk, daily?.quests?.title_en)
  const desc = daily?.custom_desc_sk
    ? pick(daily.custom_desc_sk, daily.custom_desc_en)
    : pick(daily?.quests?.description_sk, daily?.quests?.description_en)
  return { title, desc }
}
