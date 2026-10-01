export type Mood = 'pomoc' | 'adrenalin' | 'nuda' | 'cakanie'
export type Gang = 'builders' | 'speedrunners' | 'nightcrawlers' | 'looters'
export type ProofKind = 'photo' | 'video' | 'voice'
export type Lang = 'sk' | 'en'

export interface Quest {
  id: string
  slug: string
  title_sk: string
  title_en: string
  description_sk: string
  description_en: string
  mood: Mood
  gang: Gang
  environment: string
  difficulty: number
  duration_min: number
  xp: number
  proof_type: ProofKind
}

export interface DailyQuest {
  quest_date: string
  quest_id: string | null
  custom_title_sk: string | null
  custom_title_en: string | null
  custom_desc_sk: string | null
  custom_desc_en: string | null
  proof_type: ProofKind
  xp: number
  sponsor_name: string | null
  sponsor_logo_url: string | null
  sponsor_url: string | null
  metric_sk?: string | null
  metric_en?: string | null
  metric_max?: number
  world_goal?: number | null
  quests?: Quest | null
}

export interface Profile {
  id: string
  username: string
  gang: Gang | null
  lang: Lang
  country: string | null
  xp: number
  streak_current: number
  streak_best: number
  last_done_date: string | null
  is_adult_16: boolean
  is_admin?: boolean
}

export interface Completion {
  id: string
  user_id: string
  quest_id: string | null
  quest_date: string | null
  proof_url: string
  proof_type: ProofKind
  note: string | null
  rating: number | null
  hype_count: number
  created_at: string
  city?: string | null
  profiles?: { username: string; gang: Gang | null } | null
  quests?: { title_sk: string; title_en: string; mood?: Mood } | null
}

export const GANGS: { id: Gang; name: string; color: string; sk: string; en: string }[] = [
  {
    id: 'builders',
    name: 'Builders',
    color: '#FFD400',
    sk: 'Robia veci, z ktorých má úžitok niekto iný.',
    en: 'They do things someone else benefits from.',
  },
  {
    id: 'speedrunners',
    name: 'Speedrunners',
    color: '#39FF7A',
    sk: 'Rýchlo, naplno, bez rozmýšľania nad tým.',
    en: 'Fast, full send, no overthinking.',
  },
  {
    id: 'nightcrawlers',
    name: 'Nightcrawlers',
    color: '#B26BFF',
    sk: 'Hovoria s ľuďmi, ktorých nepoznajú.',
    en: 'They talk to people they do not know.',
  },
  {
    id: 'looters',
    name: 'Looters',
    color: '#FF7A1A',
    sk: 'Hľadajú, čo ostatní prehliadli.',
    en: 'They find what everyone else walked past.',
  },
]

export const GANG_COLOR: Record<Gang, string> = {
  builders: '#FFD400',
  speedrunners: '#39FF7A',
  nightcrawlers: '#B26BFF',
  looters: '#FF7A1A',
}

export function questTitle(q: { title_sk: string; title_en: string }, lang: Lang) {
  return lang === 'sk' ? q.title_sk : q.title_en
}

export function questDesc(q: { description_sk: string; description_en: string }, lang: Lang) {
  return lang === 'sk' ? q.description_sk : q.description_en
}

export interface Board {
  key: string
  total: number
  people: number
  avg: number
}

export interface QuestStats {
  quest_date: string
  total: number
  people: number
  avg: number
  median: number
  record: { username: string; amount: number; city: string | null } | null
  by_gang: Board[]
  by_country: Board[]
  by_region: Board[]
  by_city: Board[]
  me: { amount: number; rank: number; of: number; beaten: number } | null
}
