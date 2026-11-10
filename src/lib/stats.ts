import type { BadgeInput } from './badges'
import type { Completion, Mood, Profile, ProofKind } from './types'

/** Poradie dní: pondelok = 0 … nedeľa = 6 (podľa UTC dátumu questu). */
export function weekdayOf(date: string): number {
  return (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7
}

export interface ProfileStats {
  total: number
  byWeekday: number[]
  bestWeekday: number | null
  proofs: Partial<Record<ProofKind, number>>
  moods: Partial<Record<Mood, number>>
  topMood: Mood | null
  cities: number
  firstDate: string | null
  /** priemerne splnených questov na týždeň od prvého splnenia */
  perWeek: number
}

export function computeStats(history: Completion[], now = Date.now()): ProfileStats {
  const byWeekday = [0, 0, 0, 0, 0, 0, 0]
  const proofs: Partial<Record<ProofKind, number>> = {}
  const moods: Partial<Record<Mood, number>> = {}
  const cities = new Set<string>()
  let first: string | null = null

  for (const h of history) {
    const date = h.quest_date ?? h.created_at.slice(0, 10)
    byWeekday[weekdayOf(date)] += 1
    proofs[h.proof_type] = (proofs[h.proof_type] ?? 0) + 1
    const m = h.quests?.mood
    if (m) moods[m] = (moods[m] ?? 0) + 1
    if (h.city) cities.add(h.city)
    if (!first || date < first) first = date
  }

  const max = Math.max(...byWeekday)
  const rankedMoods = (Object.entries(moods) as [Mood, number][]).sort((a, b) => b[1] - a[1])
  const weeks = first ? Math.max(1, (now - Date.parse(first + 'T00:00:00Z')) / (7 * 86400000)) : 1

  return {
    total: history.length,
    byWeekday,
    bestWeekday: max > 0 ? byWeekday.indexOf(max) : null,
    proofs,
    moods,
    topMood: rankedMoods[0]?.[0] ?? null,
    cities: cities.size,
    firstDate: first,
    perWeek: history.length ? Math.round((history.length / weeks) * 10) / 10 : 0,
  }
}

export function badgeInput(profile: Pick<Profile, 'xp' | 'streak_best'>, history: Completion[]): BadgeInput {
  const s = computeStats(history)
  return {
    xp: profile.xp,
    streakBest: profile.streak_best,
    total: history.length,
    proofs: s.proofs,
    moods: s.moods,
    cities: s.cities,
    hours: history.map((h) => new Date(h.created_at).getHours()),
  }
}
