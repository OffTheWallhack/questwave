import { useEffect, useMemo, useState } from 'react'
import { BADGES, badgeHint, badgeName, badgeUnlocked, type BadgeInput } from '../lib/badges'
import { getPref, setPref } from '../lib/prefs'
import type { Lang } from '../lib/types'

/** Odznaky: odomknuté svietia v farbe gangu, ostatné ukazujú, koľko im chýba. */
export default function BadgesPanel({ input, lang, color }: { input: BadgeInput; lang: Lang; color: string }) {
  const [open, setOpen] = useState<string | null>(null)
  const unlocked = useMemo(() => BADGES.filter((b) => badgeUnlocked(b, input)).map((b) => b.id), [input])
  const [seen, setSeen] = useState<string[]>(() => getPref('badges-seen', '').split(',').filter(Boolean))
  const fresh = unlocked.filter((id) => !seen.includes(id))

  // nové odznaky sa označia ako videné až keď hráč odíde z profilu
  useEffect(
    () => () => {
      if (unlocked.length) setPref('badges-seen', unlocked.join(','))
    },
    [unlocked],
  )
  useEffect(() => {
    if (!fresh.length) return
    const id = setTimeout(() => setSeen(unlocked), 6000)
    return () => clearTimeout(id)
  }, [fresh.length, unlocked])

  const sel = BADGES.find((b) => b.id === open) ?? null

  return (
    <section className="panel mx-3 rounded-[12px] p-4">
      <div className="flex items-baseline justify-between">
        <p className="display-md text-[30px]">{lang === 'sk' ? 'Odznaky' : 'Badges'}</p>
        <p className="text-sm text-fog tabular-nums">
          {unlocked.length} / {BADGES.length}
        </p>
      </div>
      <ul className="mt-3 grid grid-cols-4 gap-2">
        {BADGES.map((b) => {
          const got = unlocked.includes(b.id)
          const isNew = fresh.includes(b.id)
          const p = b.progress(input)
          return (
            <li key={b.id}>
              <button
                aria-label={badgeName(b, lang)}
                aria-pressed={open === b.id}
                onClick={() => setOpen(open === b.id ? null : b.id)}
                className="relative flex aspect-square w-full flex-col items-center justify-center rounded-[10px] border-[3px] border-ink text-[26px] leading-none transition-transform active:translate-y-[2px]"
                style={{
                  background: got ? color : '#241E3A',
                  color: got ? '#120E20' : '#6F668F',
                  boxShadow: got ? 'inset 0 -4px 0 rgba(0,0,0,0.22)' : undefined,
                  textShadow: 'none',
                }}
              >
                <span>{b.icon}</span>
                {!got && p > 0 && (
                  <span className="absolute inset-x-1.5 bottom-1.5 h-1.5 overflow-hidden rounded-[2px] bg-ink">
                    <span className="block h-full" style={{ width: `${Math.round(p * 100)}%`, background: color }} />
                  </span>
                )}
                {isNew && (
                  <span className="absolute -right-1.5 -top-2 rounded-[6px] border-2 border-ink bg-mult px-1 pb-px pt-0.5 text-[13px] leading-none text-chalk">
                    {lang === 'sk' ? 'NOVÉ' : 'NEW'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 min-h-[40px] text-[19px] leading-tight text-fog" aria-live="polite">
        {sel ? (
          <>
            <span className="text-chalk">{badgeName(sel, lang)}</span> · {badgeHint(sel, lang)}
            {badgeUnlocked(sel, input) ? ' ✓' : ` · ${Math.round(sel.progress(input) * 100)} %`}
          </>
        ) : lang === 'sk' ? (
          'Ťukni na odznak a uvidíš, ako ho získať.'
        ) : (
          'Tap a badge to see how to get it.'
        )}
      </p>
    </section>
  )
}
