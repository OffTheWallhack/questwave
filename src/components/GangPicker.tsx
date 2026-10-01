import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { haptic } from '../lib/confetti'
import { MOOD_GANG } from '../lib/gangs'
import { useSession } from '../lib/session'
import { supabase } from '../lib/supabase'
import { GANGS, type Gang, type Mood } from '../lib/types'
import Sheet from './Sheet'

const WHY: Record<Mood, { sk: string; en: string }> = {
  pomoc: { sk: 'najčastejšie berieš questy, kde pomáhaš', en: 'you mostly take quests where you help' },
  adrenalin: { sk: 'najčastejšie ideš do adrenalínu', en: 'you mostly go for adrenaline' },
  nuda: { sk: 'najčastejšie objavuješ a skúšaš nové veci', en: 'you mostly explore and try new things' },
  cakanie: { sk: 'najčastejšie využívaš chvíle a ľudí okolo seba', en: 'you mostly use small moments and people around you' },
}

interface Props {
  open: boolean
  onClose: () => void
  recommended: Gang | null
}

/** Výber gangu — dobrovoľný, s odporúčaním a rovnocennou možnosťou ostať vo svete. */
export default function GangPicker({ open, onClose, recommended }: Props) {
  const { profile, lang, refresh } = useSession()
  const [pick, setPick] = useState<Gang | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPick(profile?.gang ?? recommended)
      setError(null)
    }
  }, [open, profile?.gang, recommended])

  const why = recommended ? (Object.entries(MOOD_GANG).find(([, g]) => g === recommended)?.[0] as Mood) : null

  async function choose(g: Gang | null) {
    setBusy(true)
    const { error: err } = await supabase.rpc('choose_gang', { p_gang: g })
    setBusy(false)
    if (err) return setError(err.message)
    haptic(25)
    await refresh()
    onClose()
  }

  const chosen = GANGS.find((g) => g.id === pick)

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="space-y-3 px-4 pt-2">
        <h2 className="display text-[44px]">{lang === 'sk' ? 'Gangy' : 'Gangs'}</h2>
        <p className="text-[21px] leading-tight text-fog">
          {lang === 'sk'
            ? 'Gang je hra navyše — body za tvoje questy idú aj jemu. Svetový quest robíš vždy so všetkými.'
            : 'A gang is a bonus game — your quests also score for it. You always do the world quest with everyone.'}
        </p>

        {GANGS.map((g, i) => {
          const on = pick === g.id
          const rec = recommended === g.id
          return (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                haptic()
                setPick(g.id)
              }}
              className="flex w-full items-center gap-3 rounded-[12px] p-4 text-left"
              style={{
                background: on ? `linear-gradient(120deg, ${g.color}55, #37304F 70%)` : '#37304F',
                border: `3px solid ${on ? g.color : '#120E20'}`,
                boxShadow: '0 5px 0 rgba(0,0,0,0.45)',
              }}
            >
              <div className="flex-1">
                <p className="flex items-center gap-2">
                  <span className="display text-[34px]" style={{ color: g.color }}>
                    {g.name}
                  </span>
                  {rec && (
                    <span className="chip-box rounded-[6px] bg-gold px-1.5 pt-0.5 text-[16px] text-ink [text-shadow:none]">
                      {lang === 'sk' ? 'Sedí ti' : 'Fits you'}
                    </span>
                  )}
                </p>
                <p className="text-[19px] leading-tight text-chalk/75">{lang === 'sk' ? g.sk : g.en}</p>
                {rec && why && (
                  <p className="mt-1 text-[17px] leading-tight text-gold">
                    {lang === 'sk' ? 'Lebo ' : 'Because '}
                    {WHY[why][lang]}.
                  </p>
                )}
              </div>
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border-[3px] border-ink"
                style={{ background: on ? g.color : '#241E3A', color: '#120E20' }}
              >
                {on && <Check size={16} strokeWidth={3.5} />}
              </span>
            </motion.button>
          )
        })}

        {error && <p className="text-[20px] text-mult">{error}</p>}

        <button className="btn btn-iri w-full" disabled={!pick || busy || pick === profile?.gang} onClick={() => choose(pick)}>
          {chosen ? (lang === 'sk' ? `Pridať sa k ${chosen.name}` : `Join ${chosen.name}`) : lang === 'sk' ? 'Vyber gang' : 'Pick a gang'}
        </button>
        <button className="btn btn-ghost w-full" disabled={busy} onClick={() => (profile?.gang ? choose(null) : onClose())}>
          {profile?.gang ? (lang === 'sk' ? 'Odísť a patriť celému svetu' : 'Leave and belong to the world') : lang === 'sk' ? 'Ostať vo svete' : 'Stay in the world'}
        </button>
      </div>
    </Sheet>
  )
}
