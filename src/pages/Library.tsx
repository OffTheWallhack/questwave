import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Shuffle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { setSwirl, shade } from '../components/Swirl'
import Celebration from '../components/Celebration'
import MotionChip from '../components/MotionChip'
import ProofSheet from '../components/ProofSheet'
import { MOOD_STYLE, QuestCardBack, QuestCardFront, QuestInfo } from '../components/QuestCard'
import { completeQuest } from '../lib/complete'
import { GANG_UNLOCK } from '../lib/gangs'
import { haptic } from '../lib/confetti'
import { MOODS } from '../lib/i18n'
import { useSession } from '../lib/session'
import { DEMO, supabase } from '../lib/supabase'
import { questTitle, type Mood, type Quest } from '../lib/types'

const COPY = {
  sk: {
    title: 'Aký máš teraz stav?',
    sub: 'Otvor balíček a vytiahni si quest navyše.',
    count: 'kariet',
    pack: 'Balíček',
    accept: 'Beriem',
    again: 'Ťahať znova',
    back: 'Späť',
  },
  en: {
    title: 'What is your state right now?',
    sub: 'Open a pack and draw an extra quest.',
    count: 'cards',
    pack: 'Pack',
    accept: 'I\'m in',
    again: 'Draw again',
    back: 'Back',
  },
}

export default function Library() {
  const { profile, lang, refresh } = useSession()
  const c = COPY[lang]
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [mood, setMood] = useState<Mood | null>(null)
  const [pool, setPool] = useState<Quest[]>([])
  const [quest, setQuest] = useState<Quest | null>(null)
  const [draws, setDraws] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [party, setParty] = useState(false)

  useEffect(() => {
    if (!mood) setSwirl(['#1B1530', '#5B2E9E', '#0E5A63'])
    else {
      const m = MOOD_STYLE[mood]
      setSwirl(['#1B1530', m.bg, shade(m.color, 0.42)])
    }
  }, [mood])

  useEffect(() => {
    supabase
      .from('quests')
      .select('mood')
      .eq('is_active', true)
      .then(({ data }) => {
        const m: Record<string, number> = {}
        for (const r of (data as { mood: string }[]) ?? []) m[r.mood] = (m[r.mood] ?? 0) + 1
        setCounts(m)
      })
  }, [])

  async function open(m: Mood) {
    haptic()
    setMood(m)
    setQuest(null)
    const { data } = await supabase.from('quests').select('*').eq('mood', m).eq('is_active', true)
    const list = (data as Quest[]) ?? []
    setPool(list)
    draw(list)
  }

  function draw(list = pool) {
    if (!list.length) return
    haptic()
    // v deme sa rarity striedajú, aby bolo hneď vidno všetky tri dizajny
    const tierPool = DEMO ? list.filter((q) => q.difficulty === [2, 1, 3][draws % 3]) : list
    const from = tierPool.length ? tierPool : list
    let next = from[Math.floor(Math.random() * from.length)]
    if (from.length > 1) while (next.id === quest?.id) next = from[Math.floor(Math.random() * from.length)]
    setQuest(next)
    setDraws((d) => d + 1)
  }

  async function submit(file: File, rating: number, _amount: number | null = null) {
    void _amount
    if (!profile || !quest) return
    await completeQuest({
      profile,
      file,
      proofType: quest.proof_type,
      rating,
      questId: quest.id,
      daily: false,
    })
    setSheet(false)
    if (!profile.gang) {
      const { count: total } = await supabase.from('completions').select('id', { count: 'exact', head: true }).eq('user_id', profile.id)
      setUnlocked(total === GANG_UNLOCK)
    }
    setParty(true)
    await refresh()
  }

  if (!mood) {
    return (
      <div className="space-y-7 px-5 pb-32 pt-5">
        <div>
          <h1 className="display text-[54px]">{c.title}</h1>
          <p className="mt-3 max-w-[32ch] text-fog">{c.sub}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {MOODS.map((m, i) => {
            const { color, bg, Icon } = MOOD_STYLE[m.id]
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 30, rotate: i % 2 ? 4 : -4 }}
                animate={{ opacity: 1, y: 0, rotate: i % 2 ? 2 : -2 }}
                transition={{ delay: i * 0.07, type: 'spring', damping: 12 }}
                whileTap={{ scale: 0.94, rotate: 0 }}
                onClick={() => open(m.id)}
                className="bob relative flex aspect-[3/4] flex-col overflow-hidden rounded-[12px] border-[3px] border-ink text-left"
                style={{
                  animationDelay: `${i * 0.4}s`,
                  background: `linear-gradient(160deg, ${color}, ${bg})`,
                  boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.25), 0 7px 0 rgba(0,0,0,0.5)',
                }}
              >
                {/* zúbkovaný okraj balíčka */}
                <span
                  className="absolute inset-x-0 top-0 h-3"
                  style={{ background: 'repeating-linear-gradient(90deg, #120E20 0 6px, transparent 6px 12px)' }}
                />
                <span className="absolute inset-x-3 top-6 grid h-[46%] place-items-center rounded-[8px] border-[3px] border-ink bg-ink/30">
                  <Icon size={54} strokeWidth={2.4} style={{ color: '#FFF8EA', filter: 'drop-shadow(3px 3px 0 rgba(0,0,0,0.5))' }} />
                </span>
                <span className="relative mt-auto p-3 pb-4">
                  <span className="block text-[16px] text-chalk/80">{c.pack}</span>
                  <span className="display block text-[28px] leading-[0.85]">{lang === 'sk' ? m.sk : m.en}</span>
                  <span className="mt-1 block text-[16px] text-chalk/80">
                    {counts[m.id] ?? '—'} {c.count}
                  </span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  const { color } = MOOD_STYLE[mood]

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-32 pt-4" style={{ ['--gang' as string]: color }}>
      <button onClick={() => setMood(null)} className="inline-flex h-10 items-center gap-2 self-start text-fog">
        <ArrowLeft size={18} /> {c.back}
      </button>

      <div className="mx-auto mt-1 w-[62%] [perspective:1400px]">
        <AnimatePresence mode="wait">
          {quest && (
            <motion.div
              key={draws}
              className="relative"
              initial={{ rotateY: 180, scale: 0.86, y: 40 }}
              animate={{ rotateY: 0, scale: 1, y: 0 }}
              exit={{ x: -120, rotate: -10, opacity: 0, transition: { duration: 0.22 } }}
              transition={{ type: 'spring', damping: 19, stiffness: 120 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                <QuestCardFront quest={quest} lang={lang} />
              </div>
              <div
                className="absolute inset-0"
                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <QuestCardBack />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {quest && (
        <motion.div key={'i' + draws} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-5">
          <QuestInfo quest={quest} lang={lang} />
        </motion.div>
      )}

      <div className="mt-3">
        <MotionChip />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
        <button className="btn btn-iri" disabled={!profile || !quest} onClick={() => setSheet(true)}>
          {c.accept}
        </button>
        <button className="btn btn-ghost aspect-square px-0" aria-label={c.again} onClick={() => draw()}>
          <Shuffle size={20} />
        </button>
      </div>

      {quest && (
        <ProofSheet
          open={sheet}
          onClose={() => setSheet(false)}
          questTitle={questTitle(quest, lang)}
          proofType={quest.proof_type}
          xp={quest.xp}
          onSubmit={submit}
        />
      )}

      <Celebration
        open={party}
        xp={quest?.xp ?? 0}
        streak={null}
        rank={null}
        unlocked={unlocked}
        onClose={() => {
          setParty(false)
          draw()
        }}
      />
    </div>
  )
}
