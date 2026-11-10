import { useMemo } from 'react'
import { computeStats } from '../lib/stats'
import type { Completion, Lang, Mood } from '../lib/types'

const DAYS = {
  sk: ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
}
const DAYS_LONG = {
  sk: ['pondelok', 'utorok', 'stredu', 'štvrtok', 'piatok', 'sobotu', 'nedeľu'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}
const MOOD_NAME: Record<Mood, { sk: string; en: string }> = {
  pomoc: { sk: 'pomáhanie', en: 'helping' },
  adrenalin: { sk: 'adrenalín', en: 'adrenaline' },
  nuda: { sk: 'nuda', en: 'boredom' },
  cakanie: { sk: 'čakanie', en: 'waiting' },
}

/** Osobné čísla z histórie — žiadne porovnávanie s inými, len ty a tvoje dni. */
export default function StatsPanel({ history, xp, lang, color }: { history: Completion[]; xp: number; lang: Lang; color: string }) {
  const s = useMemo(() => computeStats(history), [history])
  if (!s.total) return null
  const max = Math.max(...s.byWeekday, 1)
  const photos = s.proofs.photo ?? 0
  const videos = s.proofs.video ?? 0
  const voices = s.proofs.voice ?? 0

  const tiles: { value: string; label: string }[] = [
    { value: String(s.total), label: lang === 'sk' ? 'splnených questov' : 'quests done' },
    { value: xp.toLocaleString(lang), label: 'XP' },
    { value: String(s.perWeek), label: lang === 'sk' ? 'questov týždenne' : 'quests a week' },
  ]

  return (
    <section className="panel mx-3 rounded-[12px] p-4">
      <p className="display-md text-[30px]">{lang === 'sk' ? 'Tvoje čísla' : 'Your numbers'}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-[10px] border-[3px] border-ink bg-[#241E3A] px-2 pb-1.5 pt-2 text-center">
            <p className="num text-[34px]" style={{ color }}>
              {t.value}
            </p>
            <p className="text-[15px] leading-none text-fog">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex h-[72px] items-end gap-1.5" role="img" aria-label={lang === 'sk' ? 'Splnené questy podľa dňa v týždni' : 'Quests by weekday'}>
        {s.byWeekday.map((n, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div
              className="w-full rounded-t-[4px] border-[3px] border-b-0 border-ink"
              style={{ height: `${Math.max(4, (n / max) * 52)}px`, background: n === max && n > 0 ? color : '#4B4170' }}
            />
            <span className="text-[15px] leading-none text-fog">{DAYS[lang][i]}</span>
          </div>
        ))}
      </div>

      <ul className="mt-3 space-y-1 text-[19px] leading-tight text-fog">
        {s.bestWeekday !== null && (
          <li>
            {lang === 'sk' ? 'Najviac questov dávaš v ' : 'You do most quests on '}
            <span className="text-chalk">{DAYS_LONG[lang][s.bestWeekday]}</span>.
          </li>
        )}
        {s.topMood && (
          <li>
            {lang === 'sk' ? 'Najčastejšia nálada: ' : 'Most common mood: '}
            <span className="text-chalk">{MOOD_NAME[s.topMood][lang]}</span>.
          </li>
        )}
        <li>
          {lang === 'sk' ? 'Dôkazy: ' : 'Proofs: '}
          <span className="text-chalk">
            {photos} {lang === 'sk' ? 'fotiek' : 'photos'}, {videos} video, {voices} {lang === 'sk' ? 'hlasoviek' : 'voice notes'}
          </span>
          .
        </li>
        {s.cities > 1 && (
          <li>
            {lang === 'sk' ? 'Miest, z ktorých si hral: ' : 'Places you played from: '}
            <span className="text-chalk">{s.cities}</span>.
          </li>
        )}
      </ul>
    </section>
  )
}
