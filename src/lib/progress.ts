import type { Lang } from './types'

/** Úroveň rastie pomaly: 0, 100, 300, 600, 1000, 1500 XP… */
export function levelFromXp(xp: number) {
  let level = 1
  let need = 100
  let floor = 0
  while (xp >= floor + need) {
    floor += need
    level += 1
    need = level * 100
  }
  return { level, into: xp - floor, need, progress: (xp - floor) / need }
}

const TITLES = {
  sk: ['Nováčik', 'Pouličný skaut', 'Miestna legenda', 'Tvorca chaosu', 'Mestský mýtus', 'Svetová trieda'],
  en: ['Rookie', 'Street Scout', 'Local Legend', 'Chaos Bringer', 'Urban Myth', 'World Class'],
}

export function titleForLevel(level: number, lang: Lang) {
  const list = TITLES[lang]
  return list[Math.min(list.length - 1, Math.floor((level - 1) / 2))]
}

export function timeAgo(iso: string, lang: Lang) {
  const min = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000))
  if (min < 60) return lang === 'sk' ? `pred ${min} min` : `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return lang === 'sk' ? `pred ${h} h` : `${h} h ago`
  const d = Math.round(h / 24)
  return lang === 'sk' ? `pred ${d} d` : `${d} d ago`
}

/** Poradové číslo svetového questu — od spustenia appky. */
export const LAUNCH = '2026-09-01'
export function questNumber(date: string) {
  return Math.floor((Date.parse(date) - Date.parse(LAUNCH)) / 86400000) + 1
}
