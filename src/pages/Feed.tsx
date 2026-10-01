import { motion } from 'framer-motion'
import { Flag, Sparkles } from 'lucide-react'
import { setSwirl } from '../components/Swirl'
import { useEffect, useState } from 'react'
import Avatar from '../components/Avatar'
import ProofMedia from '../components/ProofMedia'
import { burst, haptic } from '../lib/confetti'
import { timeAgo } from '../lib/progress'
import { useSession } from '../lib/session'
import { supabase } from '../lib/supabase'
import { GANG_COLOR, GANGS, type Completion } from '../lib/types'

const COPY = {
  sk: { title: 'Feed', world: 'Celý svet', gang: 'Môj gang', empty: 'Zatiaľ tu nič nie je. Splň dnešný quest a buď prvý.' },
  en: { title: 'Feed', world: 'Whole world', gang: 'My gang', empty: 'Nothing here yet. Do today\'s quest and be first.' },
}

export default function Feed() {
  const { session, profile, lang } = useSession()
  const c = COPY[lang]
  const [rows, setRows] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)
  const [hyped, setHyped] = useState<Set<string>>(new Set())
  const [scope, setScope] = useState<'world' | 'gang'>('world')
  const [reporting, setReporting] = useState<string | null>(null)
  const [reported, setReported] = useState<Set<string>>(new Set())

  async function report(id: string) {
    if (!session?.user.id) return
    if (reporting !== id) return setReporting(id)
    setReporting(null)
    setReported(new Set(reported).add(id))
    await supabase.from('quest_submissions').insert({
      submitted_by: session.user.id,
      kind: 'report',
      body: lang === 'sk' ? 'Nahlásený príspevok vo feede' : 'Reported feed post',
      target_completion: id,
    })
  }
  useEffect(() => {
    setSwirl(['#1B1530', '#5A1B3E', '#173A6E'])
  }, [])


  useEffect(() => {
    supabase
      .from('completions')
      .select('*, profiles(username, gang), quests(title_sk, title_en)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRows((data as Completion[]) ?? [])
        setLoading(false)
      })
  }, [])

  async function hype(id: string, color: string, e: React.MouseEvent) {
    if (!session?.user.id || hyped.has(id)) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    burst(r.left + 24, r.top + r.height / 2, [color, '#F3F1EA'], 22, 0.7)
    haptic()
    setHyped(new Set(hyped).add(id))
    setRows((list) => list.map((x) => (x.id === id ? { ...x, hype_count: x.hype_count + 1 } : x)))
    await supabase.from('hypes').insert({ completion_id: id, user_id: session.user.id })
  }

  const shown = scope === 'gang' && profile?.gang ? rows.filter((r) => r.profiles?.gang === profile.gang) : rows
  const myGang = GANGS.find((g) => g.id === profile?.gang)

  return (
    <div className="space-y-6 pb-32">
      <header className="flex items-end justify-between px-5 pt-5">
        <h1 className="display text-[54px]">{c.title}</h1>
        {myGang && (
        <div className="panel flex rounded-[12px] p-1 text-[20px]">
          {(['world', 'gang'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={
                'rounded-[8px] px-3 pb-0.5 pt-1 transition ' +
                (scope === s ? 'bg-chips text-chalk' : 'text-fog')
              }
            >
              {s === 'world' ? c.world : myGang?.name ?? c.gang}
            </button>
          ))}
        </div>
        )}
      </header>

      {!loading && !shown.length && <p className="px-5 text-fog">{c.empty}</p>}

      <div className="space-y-5">
        {shown.map((row, i) => {
          const gang = row.profiles?.gang ?? null
          const color = gang ? GANG_COLOR[gang] : '#F3F1EA'
          const title = row.quests ? (lang === 'sk' ? row.quests.title_sk : row.quests.title_en) : ''
          const done = hyped.has(row.id)
          return (
            <motion.article
              key={row.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 5) * 0.05 }}
              className="panel mx-3 rounded-[12px] p-3"
            >
              <div className="flex items-center gap-3 px-1">
                <Avatar name={row.profiles?.username ?? '?'} gang={gang} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{row.profiles?.username ?? '—'}</p>
                  <p className="truncate text-[18px] text-fog">
                    {row.city ? row.city + ', ' : ''}
                    {timeAgo(row.created_at, lang)}
                  </p>
                </div>
              </div>

              <p className="display mt-2 px-1 text-[30px]">{title}</p>

              <div className="mt-2 overflow-hidden rounded-[10px] border-[3px] border-ink bg-cream p-[6px]">
                <ProofMedia
                  url={row.proof_url}
                  type={row.proof_type}
                  color={color}
                  className={(row.proof_type === 'voice' ? '' : 'aspect-[4/5] ') + 'rounded-[6px]'}
                />
              </div>

              <div className="mt-3 flex items-center gap-3 px-1">
                <button
                  onClick={(e) => hype(row.id, color, e)}
                  disabled={!session}
                  className="btn h-12 px-4 text-[24px]"
                  style={{ background: done ? '#FF4B4B' : '#4A4268' }}
                >
                  <motion.span animate={done ? { rotate: [0, -18, 14, 0], scale: [1, 1.35, 1] } : {}}>
                    <Sparkles size={18} fill={done ? 'currentColor' : 'none'} />
                  </motion.span>
                  Hype
                  <span className="tabular-nums opacity-70">{row.hype_count}</span>
                </button>
                {row.user_id !== session?.user.id && (
                  <button
                    onClick={() => report(row.id)}
                    disabled={reported.has(row.id)}
                    className="ml-auto inline-flex h-10 items-center gap-1.5 px-2 text-[19px] text-fog"
                  >
                    <Flag size={15} />
                    {reported.has(row.id)
                      ? lang === 'sk' ? 'Nahlásené' : 'Reported'
                      : reporting === row.id
                        ? lang === 'sk' ? 'Naozaj nahlásiť?' : 'Report for real?'
                        : lang === 'sk' ? 'Nahlásiť' : 'Report'}
                  </button>
                )}
              </div>
            </motion.article>
          )
        })}
      </div>
    </div>
  )
}
