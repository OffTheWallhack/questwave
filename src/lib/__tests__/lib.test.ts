import { describe, expect, it } from 'vitest'
import { BADGES, badgeUnlocked, nextStreakGoal, unlockedBadges, type BadgeInput } from '../badges'
import { reminderIcs } from '../ics'
import { levelFromXp } from '../progress'
import { computeStats, weekdayOf } from '../stats'
import type { Completion } from '../types'

const base: BadgeInput = { xp: 0, streakBest: 0, total: 0, proofs: {}, moods: {}, cities: 0, hours: [] }

const comp = (date: string, over: Partial<Completion> = {}): Completion => ({
  id: date + Math.random(),
  user_id: 'u',
  quest_id: null,
  quest_date: date,
  proof_url: 'x',
  proof_type: 'photo',
  note: null,
  rating: null,
  hype_count: 0,
  created_at: date + 'T10:00:00Z',
  ...over,
})

describe('levelFromXp', () => {
  it('začína na úrovni 1 a rastie po 100, 200, 300…', () => {
    expect(levelFromXp(0).level).toBe(1)
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(300).level).toBe(3)
    expect(levelFromXp(600).level).toBe(4)
  })
})

describe('odznaky', () => {
  it('nový hráč nemá nič', () => {
    expect(unlockedBadges(base)).toEqual([])
  })
  it('prvý quest odomkne Prvý krok, päť Rozbeh', () => {
    expect(unlockedBadges({ ...base, total: 1 })).toEqual(['first'])
    expect(unlockedBadges({ ...base, total: 5 })).toContain('five')
  })
  it('séria sa počíta z najlepšej, nie aktuálnej', () => {
    const ids = unlockedBadges({ ...base, streakBest: 7 })
    expect(ids).toContain('streak3')
    expect(ids).toContain('streak7')
    expect(ids).not.toContain('streak30')
  })
  it('Všestranný chce všetky štyri nálady', () => {
    const b = BADGES.find((x) => x.id === 'allmoods')!
    expect(badgeUnlocked(b, { ...base, moods: { pomoc: 1, adrenalin: 1, nuda: 1 } })).toBe(false)
    expect(badgeUnlocked(b, { ...base, moods: { pomoc: 1, adrenalin: 1, nuda: 1, cakanie: 2 } })).toBe(true)
  })
  it('Nočná zmena a Ranné vtáča idú podľa hodiny', () => {
    expect(unlockedBadges({ ...base, total: 1, hours: [23] })).toContain('night')
    expect(unlockedBadges({ ...base, total: 1, hours: [6] })).toContain('early')
    expect(unlockedBadges({ ...base, total: 1, hours: [14] })).not.toContain('night')
  })
  it('každý odznak má unikátne id a pokrok 0–1', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length)
    const full: BadgeInput = { xp: 99999, streakBest: 999, total: 999, proofs: { photo: 10, video: 10, voice: 10 }, moods: { pomoc: 1, adrenalin: 1, nuda: 1, cakanie: 1 }, cities: 9, hours: [23, 6] }
    for (const b of BADGES) {
      expect(b.progress(base)).toBeGreaterThanOrEqual(0)
      expect(b.progress(full)).toBe(1)
    }
  })
})

describe('cieľ série', () => {
  it('ukáže najbližší cieľ', () => {
    expect(nextStreakGoal(0)).toEqual({ goal: 3, left: 3 })
    expect(nextStreakGoal(3)).toEqual({ goal: 7, left: 4 })
    expect(nextStreakGoal(99)).toEqual({ goal: 100, left: 1 })
  })
  it('po poslednom cieli už nič', () => {
    expect(nextStreakGoal(365)).toBeNull()
  })
})

describe('štatistiky', () => {
  it('pondelok je 0, nedeľa 6', () => {
    expect(weekdayOf('2026-11-09')).toBe(0) // pondelok
    expect(weekdayOf('2026-11-15')).toBe(6) // nedeľa
  })
  it('spočíta dni, dôkazy, nálady a mestá', () => {
    const s = computeStats(
      [
        comp('2026-11-09', { city: 'Bratislava', quests: { title_sk: 'a', title_en: 'a', mood: 'pomoc' } }),
        comp('2026-11-16', { city: 'Viedeň', proof_type: 'video', quests: { title_sk: 'b', title_en: 'b', mood: 'pomoc' } }),
        comp('2026-11-10', { city: 'Bratislava' }),
      ],
      Date.parse('2026-11-23T00:00:00Z'),
    )
    expect(s.total).toBe(3)
    expect(s.byWeekday[0]).toBe(2)
    expect(s.bestWeekday).toBe(0)
    expect(s.proofs).toEqual({ photo: 2, video: 1 })
    expect(s.topMood).toBe('pomoc')
    expect(s.cities).toBe(2)
    expect(s.firstDate).toBe('2026-11-09')
    expect(s.perWeek).toBe(1.5)
  })
  it('prázdna história nespadne', () => {
    const s = computeStats([])
    expect(s.total).toBe(0)
    expect(s.bestWeekday).toBeNull()
    expect(s.perWeek).toBe(0)
  })
})

describe('pripomienka .ics', () => {
  const now = new Date(2026, 10, 10, 8, 0, 0) // 10. 11. 2026, 8:00 lokálne
  it('je platný kalendár s opakovaním každý deň', () => {
    const ics = reminderIcs('18:00', 'sk', 'https://pomenato.app/', now)
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('DTSTART:20261110T180000')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics.includes('\r\n')).toBe(true)
  })
  it('ak čas dnes už prešiel, začne zajtra', () => {
    const ics = reminderIcs('07:30', 'sk', 'https://pomenato.app/', now)
    expect(ics).toContain('DTSTART:20261111T073000')
  })
  it('text v angličtine', () => {
    expect(reminderIcs('18:00', 'en', 'https://pomenato.app/', now)).toContain("today's quest is waiting")
  })
})
