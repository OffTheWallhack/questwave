import { DEMO } from './supabase'
import { GANG_COLOR, GANGS, type Gang, type Lang, type Mood, type Profile } from './types'

/** Po koľkých splnených questoch sa odomknú gangy (v deme skôr, aby sa dalo ukázať). */
export const GANG_UNLOCK = DEMO ? 2 : 5

/** Kto nie je v gangu, patrí celému svetu — zlatá. */
export const WORLD_COLOR = '#FFB21E'

/** Nálada questov, ktoré človek robí najčastejšie → gang, ktorý mu sedí. */
export const MOOD_GANG: Record<Mood, Gang> = {
  pomoc: 'builders',
  adrenalin: 'speedrunners',
  nuda: 'looters',
  cakanie: 'nightcrawlers',
}

export function recommendGang(moods: (Mood | null | undefined)[]): Gang | null {
  const count: Partial<Record<Mood, number>> = {}
  for (const m of moods) if (m) count[m] = (count[m] ?? 0) + 1
  const ranked = (Object.entries(count) as [Mood, number][]).sort((a, b) => b[1] - a[1])
  if (!ranked.length) return null
  if (ranked[1] && ranked[1][1] === ranked[0][1]) return null // remíza — nič nenanucujeme
  return MOOD_GANG[ranked[0][0]]
}

/** Vzhľad hráčskej karty — gang, alebo "Svet" pre tých bez gangu. */
export function identity(profile: Pick<Profile, 'gang'>, lang: Lang) {
  if (!profile.gang) {
    return { color: WORLD_COLOR, name: lang === 'sk' ? 'Svet' : 'World', mood: 'pomoc', env: 'hocikde' }
  }
  const g = GANGS.find((x) => x.id === profile.gang)!
  const art: Record<Gang, { mood: string; env: string }> = {
    speedrunners: { mood: 'adrenalin', env: 'mesto' },
    builders: { mood: 'pomoc', env: 'doma' },
    looters: { mood: 'nuda', env: 'vonku' },
    nightcrawlers: { mood: 'cakanie', env: 'mesto' },
  }
  return { color: GANG_COLOR[profile.gang], name: g.name, ...art[profile.gang] }
}
