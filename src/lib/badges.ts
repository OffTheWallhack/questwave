import type { Lang, Mood, ProofKind } from './types'
import { levelFromXp } from './progress'

/** Čo o hráčovi vieme — stačí profil a história splnených questov. */
export interface BadgeInput {
  xp: number
  streakBest: number
  total: number
  /** počet splnení podľa typu dôkazu */
  proofs: Partial<Record<ProofKind, number>>
  /** počet splnení podľa nálady questu */
  moods: Partial<Record<Mood, number>>
  /** počet rôznych miest, z ktorých hráč splnil quest */
  cities: number
  /** hodina (0–23, lokálny čas) všetkých splnení */
  hours: number[]
}

export interface BadgeDef {
  id: string
  icon: string
  sk: string
  en: string
  hintSk: string
  hintEn: string
  /** 0–1 — ako blízko je hráč k odznaku (pre ukazovateľ pokroku) */
  progress: (i: BadgeInput) => number
}

const ratio = (a: number, b: number) => Math.max(0, Math.min(1, a / b))
const moodsDone = (i: BadgeInput) => (['pomoc', 'adrenalin', 'nuda', 'cakanie'] as Mood[]).filter((m) => (i.moods[m] ?? 0) > 0).length

export const BADGES: BadgeDef[] = [
  { id: 'first', icon: '★', sk: 'Prvý krok', en: 'First step', hintSk: 'Splň prvý quest', hintEn: 'Complete your first quest', progress: (i) => ratio(i.total, 1) },
  { id: 'five', icon: '5', sk: 'Rozbeh', en: 'Warm-up', hintSk: 'Splň 5 questov', hintEn: 'Complete 5 quests', progress: (i) => ratio(i.total, 5) },
  { id: 'twenty', icon: '20', sk: 'Štamgast', en: 'Regular', hintSk: 'Splň 20 questov', hintEn: 'Complete 20 quests', progress: (i) => ratio(i.total, 20) },
  { id: 'fifty', icon: '50', sk: 'Polstovka', en: 'Half a hundred', hintSk: 'Splň 50 questov', hintEn: 'Complete 50 quests', progress: (i) => ratio(i.total, 50) },
  { id: 'hundred', icon: '100', sk: 'Stovka', en: 'Centurion', hintSk: 'Splň 100 questov', hintEn: 'Complete 100 quests', progress: (i) => ratio(i.total, 100) },
  { id: 'streak3', icon: '3🔥', sk: 'Zapaľovač', en: 'Spark', hintSk: '3 dni v sérii', hintEn: '3-day streak', progress: (i) => ratio(i.streakBest, 3) },
  { id: 'streak7', icon: '7🔥', sk: 'Týždeň v kuse', en: 'Full week', hintSk: '7 dní v sérii', hintEn: '7-day streak', progress: (i) => ratio(i.streakBest, 7) },
  { id: 'streak14', icon: '14🔥', sk: 'Dva týždne', en: 'Two weeks', hintSk: '14 dní v sérii', hintEn: '14-day streak', progress: (i) => ratio(i.streakBest, 14) },
  { id: 'streak30', icon: '30🔥', sk: 'Mesačný maratón', en: 'Monthly marathon', hintSk: '30 dní v sérii', hintEn: '30-day streak', progress: (i) => ratio(i.streakBest, 30) },
  { id: 'streak100', icon: '100🔥', sk: 'Neuveriteľné', en: 'Unreal', hintSk: '100 dní v sérii', hintEn: '100-day streak', progress: (i) => ratio(i.streakBest, 100) },
  { id: 'xp1000', icon: '1K', sk: 'Tisícovka', en: 'The thousand', hintSk: 'Nazbieraj 1 000 XP', hintEn: 'Earn 1,000 XP', progress: (i) => ratio(i.xp, 1000) },
  { id: 'lv5', icon: 'L5', sk: 'Úroveň 5', en: 'Level 5', hintSk: 'Dosiahni úroveň 5', hintEn: 'Reach level 5', progress: (i) => ratio(levelFromXp(i.xp).level, 5) },
  { id: 'lv10', icon: 'L10', sk: 'Úroveň 10', en: 'Level 10', hintSk: 'Dosiahni úroveň 10', hintEn: 'Reach level 10', progress: (i) => ratio(levelFromXp(i.xp).level, 10) },
  { id: 'allmoods', icon: '◆', sk: 'Všestranný', en: 'All-rounder', hintSk: 'Splň quest z každej nálady', hintEn: 'Complete a quest of every mood', progress: (i) => moodsDone(i) / 4 },
  { id: 'trio', icon: '▣', sk: 'Trojhra', en: 'Triple threat', hintSk: 'Fotka, video aj hlasovka', hintEn: 'A photo, a video and a voice note', progress: (i) => (['photo', 'video', 'voice'] as ProofKind[]).filter((p) => (i.proofs[p] ?? 0) > 0).length / 3 },
  { id: 'photos10', icon: '◉', sk: 'Fotograf', en: 'Photographer', hintSk: '10 fotiek ako dôkaz', hintEn: '10 photo proofs', progress: (i) => ratio(i.proofs.photo ?? 0, 10) },
  { id: 'voice', icon: '♪', sk: 'Hlas ľudu', en: 'Voice of the people', hintSk: '5 hlasoviek', hintEn: '5 voice notes', progress: (i) => ratio(i.proofs.voice ?? 0, 5) },
  { id: 'night', icon: '☾', sk: 'Nočná zmena', en: 'Night shift', hintSk: 'Quest po 22:00 alebo pred 5:00', hintEn: 'A quest after 10 pm or before 5 am', progress: (i) => (i.hours.some((h) => h >= 22 || h < 5) ? 1 : 0) },
  { id: 'early', icon: '☀', sk: 'Ranné vtáča', en: 'Early bird', hintSk: 'Quest medzi 5:00 a 8:00', hintEn: 'A quest between 5 and 8 am', progress: (i) => (i.hours.some((h) => h >= 5 && h < 8) ? 1 : 0) },
  { id: 'traveler', icon: '✈', sk: 'Cestovateľ', en: 'Traveler', hintSk: 'Quest z 3 rôznych miest', hintEn: 'Quests from 3 different places', progress: (i) => ratio(i.cities, 3) },
]

export const badgeUnlocked = (b: BadgeDef, i: BadgeInput) => b.progress(i) >= 1

export function unlockedBadges(i: BadgeInput): string[] {
  return BADGES.filter((b) => badgeUnlocked(b, i)).map((b) => b.id)
}

export const badgeName = (b: BadgeDef, lang: Lang) => (lang === 'sk' ? b.sk : b.en)
export const badgeHint = (b: BadgeDef, lang: Lang) => (lang === 'sk' ? b.hintSk : b.hintEn)

/** Najbližší cieľ série — pre hlášku „ešte 3 dni do 7-dňovej série". */
export const STREAK_GOALS = [3, 7, 14, 30, 50, 100, 200, 365]
export function nextStreakGoal(streak: number): { goal: number; left: number } | null {
  const goal = STREAK_GOALS.find((g) => g > streak)
  return goal ? { goal, left: goal - streak } : null
}
