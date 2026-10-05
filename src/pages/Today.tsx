import { motion } from 'framer-motion'
import { Camera, Clock, Flame, Mic, Video } from 'lucide-react'
import { setSwirl } from '../components/Swirl'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Celebration from '../components/Celebration'
import Countdown from '../components/Countdown'
import QuestStats from '../components/QuestStats'
import Globe from '../components/Globe'
import ProofMedia from '../components/ProofMedia'
import ProofSheet from '../components/ProofSheet'
import { completeQuest } from '../lib/complete'
import { dailyText, fetchDaily } from '../lib/daily'
import { GANG_UNLOCK } from '../lib/gangs'
import { utcToday } from '../lib/date'
import { questNumber } from '../lib/progress'
import { useSession } from '../lib/session'
import { LOCAL, supabase } from '../lib/supabase'
import { GANG_COLOR, type Completion, type DailyQuest, type ProofKind, type Quest, type QuestStats as Stats } from '../lib/types'
import { myLocation, useLivePings } from '../lib/world'
import { BRAND } from '../lib/brand'

const COPY = {
  sk: {
    world: 'Svetový quest',
    people: 'ľudí',
    cities: 'miest',
    reward: 'Odmena',
    newIn: 'Nový o',
    cta: 'Splniť quest',
    signIn: 'Prihlás sa a pridaj sa',
    done: 'Splnené. Tvoja bodka svieti na mape.',
    none: 'Na dnes ešte nie je svetový quest. Vytiahni si jeden zo zásobníka.',
    toLibrary: 'Otvoriť zásobník',
    photo: 'Fotka',
    video: 'Video',
    voice: 'Hlasovka',
    min: 'min',
    keep: (n: number) => `Nestrať ${n}-dňovú sériu!`,
    left: 'Zostáva',
    starter: 'Začni tu · 5 minút · hocikde',
    starterCta: 'Splniť prvý quest',
    first: 'Prvý quest',
    beta: 'Beta · ostatní hráči a čísla sveta sú zatiaľ ukážkové',
  },
  en: {
    world: 'World quest',
    people: 'people',
    cities: 'cities',
    reward: 'Reward',
    newIn: 'New in',
    cta: 'Take the quest',
    signIn: 'Sign in to join',
    done: 'Done. Your dot is live on the map.',
    none: 'No world quest for today yet. Draw one from the library.',
    toLibrary: 'Open the library',
    photo: 'Photo',
    video: 'Video',
    voice: 'Voice note',
    min: 'min',
    keep: (n: number) => `Don't lose your ${n}-day streak!`,
    left: 'Time left',
    starter: 'Start here · 5 minutes · anywhere',
    starterCta: 'Do your first quest',
    first: 'First quest',
    beta: 'Beta · other players and world numbers are samples for now',
  },
}

interface Party {
  xp: number
  streak: number | null
  rank: number | null
  note?: string
  story: { label: string; title: string; proofUrl: string; proofType: ProofKind }
}

const dayBefore = (d: string) => new Date(Date.parse(d + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10)

/** Prvý quest pre nováčika: do 5 minút, dá sa splniť hocikde a dôkaz je fotka. */
async function fetchStarter(seed: string): Promise<Quest | null> {
  const { data } = await supabase
    .from('quests')
    .select('*')
    .eq('is_active', true)
    .eq('environment', 'hocikde')
    .eq('difficulty', 1)
    .eq('proof_type', 'photo')
    .lte('duration_min', 5)
  const list = (data as Quest[] | null) ?? []
  if (!list.length) return null
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return list[h % list.length]
}

export default function Today() {
  const { session, profile, lang, refresh } = useSession()
  const c = COPY[lang]
  const [daily, setDaily] = useState<DailyQuest | null>(null)
  const [baseCount, setBaseCount] = useState(0)
  const [baseCities, setBaseCities] = useState(0)
  const [mine, setMine] = useState<Completion | null>(null)
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [starter, setStarter] = useState<Quest | null>(null)
  const [starterSheet, setStarterSheet] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [party, setParty] = useState<Party | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [width, setWidth] = useState(Math.min(innerWidth, 448))

  const today = utcToday()
  const { pings, count } = useLivePings(baseCount)
  const loc = myLocation()

  useEffect(() => {
    const on = () => setWidth(Math.min(innerWidth, 448))
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])

  const load = useCallback(async () => {
    const row = await fetchDaily()
    setDaily(row)

    if (row?.metric_sk) {
      const { data: st } = await supabase.rpc('quest_stats')
      setStats((st as Stats) ?? null)
    } else {
      setStats(null)
    }

    const { data: counter } = await supabase.from('daily_counter').select('*').eq('quest_date', today).maybeSingle()
    setBaseCount((counter as { done_count?: number } | null)?.done_count ?? 0)
    setBaseCities((counter as { city_count?: number } | null)?.city_count ?? 0)

    if (session?.user.id) {
      const { data: own } = await supabase
        .from('completions')
        .select('*')
        .eq('quest_date', today)
        .eq('user_id', session.user.id)
        .maybeSingle()
      setMine((own as Completion) ?? null)

      const { count: total } = await supabase
        .from('completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
      setStarter(total === 0 ? await fetchStarter(session.user.id) : null)
    }
    setLoading(false)
  }, [today, session?.user.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!daily?.metric_sk) return
    const id = setInterval(async () => {
      const { data: st } = await supabase.rpc('quest_stats')
      if (st) setStats(st as Stats)
    }, 20000)
    return () => clearInterval(id)
  }, [daily?.metric_sk])

  useEffect(() => {
    setSwirl(['#1B1530', '#5B2E9E', '#0E5A63'])
  }, [])

  const { title, desc } = dailyText(daily, lang)

  const unit = daily?.metric_sk ? (lang === 'sk' ? daily.metric_sk : daily.metric_en || daily.metric_sk) : null

  const ProofIcon = daily?.proof_type === 'video' ? Video : daily?.proof_type === 'voice' ? Mic : Camera
  const globeSize = Math.round(width * 0.6)
  const cities = baseCities + Math.floor((count - baseCount) / 6)

  async function submit(file: File, rating: number, amount: number | null) {
    if (!profile || !daily) return
    const { streak, rank, url } = await completeQuest({
      profile,
      file,
      proofType: daily.proof_type,
      rating,
      questId: daily.quest_id,
      daily: true,
      amount,
    })
    setSheet(false)
    if (!profile.gang) {
      const { count: total } = await supabase.from('completions').select('id', { count: 'exact', head: true }).eq('user_id', profile.id)
      setUnlocked(total === GANG_UNLOCK)
    }
    let note: string | undefined
    if (amount !== null && unit) {
      const { data: st } = await supabase.rpc('quest_stats')
      const fresh = st as Stats | null
      if (fresh) {
        setStats(fresh)
        note =
          lang === 'sk'
            ? `+${amount} ${unit}. Svet má spolu ${fresh.total.toLocaleString('sk')}.`
            : `+${amount} ${unit}. The world has ${fresh.total.toLocaleString('en')} together.`
      }
    }
    setParty({
      xp: daily.xp,
      streak,
      rank: Math.max(rank, count + 1),
      note,
      story: { label: `${c.world} #${questNumber(today)}`, title, proofUrl: url, proofType: daily.proof_type },
    })
    await refresh()
    await load()
  }

  async function submitStarter(file: File, rating: number) {
    if (!profile || !starter) return
    const { url } = await completeQuest({ profile, file, proofType: starter.proof_type, rating, questId: starter.id, daily: false })
    setStarterSheet(false)
    const starterTitle = lang === 'sk' ? starter.title_sk : starter.title_en
    setParty({ xp: starter.xp, streak: null, rank: null, story: { label: c.first, title: starterTitle, proofUrl: url, proofType: starter.proof_type } })
    await refresh()
    await load()
  }

  const gangColor = profile?.gang ? GANG_COLOR[profile.gang] : '#FFB21E'
  // séria platí, len kým hráč nevynechal deň
  const alive = profile?.last_done_date === today || profile?.last_done_date === dayBefore(today)
  const streak = alive ? profile?.streak_current ?? 0 : 0
  const atRisk = Boolean(profile && !loading && !mine && streak > 0 && profile.last_done_date === dayBefore(today))

  return (
    <div className="pb-32">
      <header className="flex items-center justify-between px-4 pt-4">
        <span className="display wave text-[40px] tracking-[0.03em]" aria-label={BRAND.name}>
          {BRAND.wordmark.split('').map((ch, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.12}s` }}>
              {ch}
            </span>
          ))}
        </span>
        {profile && (
          <span className="chip-box inline-flex items-center gap-1.5 rounded-[10px] bg-looters px-3 pb-0.5 pt-1 text-[26px] leading-none">
            <Flame size={20} fill="#FFF8EA" className="text-chalk" />
            {streak}
          </span>
        )}
      </header>

      <section className="relative mt-1 flex justify-center">
        <div className="bob">
          <Globe size={globeSize} pings={pings} mine={mine ? loc : null} />
        </div>
      </section>

      {/* skóre dňa: ľudia × mestá */}
      <section className="-mt-3 flex items-stretch justify-center gap-2 px-4">
        <motion.div
          key={'c' + count}
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 8, stiffness: 400 }}
          className="chip-box min-w-[46%] rounded-[12px] bg-chips px-3 pb-2 pt-2 text-right"
        >
          <p className="num text-[46px]">{loading ? '—' : count.toLocaleString(lang === 'sk' ? 'sk' : 'en')}</p>
          <p className="flex items-center justify-end gap-1.5 text-[18px] text-chalk/85">
            <span className="live-dot h-2 w-2 bg-chalk" /> {c.people}
          </p>
        </motion.div>
        <span className="display self-center text-[34px] text-mult">×</span>
        <div className="chip-box min-w-[30%] rounded-[12px] bg-mult px-3 pb-2 pt-2">
          <p className="num text-[46px]">{loading ? '—' : cities}</p>
          <p className="text-[18px] text-chalk/85">{c.cities}</p>
        </div>
      </section>

      {LOCAL && <p className="px-4 pt-2 text-center text-[16px] leading-tight text-fog">{c.beta}</p>}

      {atRisk && (
        <motion.section
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="px-3 pt-4"
        >
          <div className="chip-box flex items-center gap-3 rounded-[12px] bg-looters px-4 pb-2 pt-2.5">
            <Flame size={30} fill="#FFF8EA" className="shrink-0 text-chalk" />
            <div className="min-w-0 flex-1">
              <p className="display text-[30px] leading-none">{c.keep(streak)}</p>
              <p className="text-[19px] text-chalk/90">
                {c.left} <Countdown />
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {starter && !mine && (
        <section className="px-3 pt-4">
          <div className="panel rounded-[12px] p-4">
            <p className="text-[20px] text-gold">{c.starter}</p>
            <p className="display mt-1 text-[36px] leading-none">{lang === 'sk' ? starter.title_sk : starter.title_en}</p>
            <p className="mt-1.5 text-[20px] leading-[1.05] text-fog">
              {lang === 'sk' ? starter.description_sk : starter.description_en}
            </p>
            <button className="btn btn-blue mt-3 w-full" onClick={() => setStarterSheet(true)}>
              {c.starterCta}
            </button>
          </div>
        </section>
      )}

      <section className="px-3 pt-5">
        {!loading && !title ? (
          <div className="panel space-y-4 rounded-[12px] p-5">
            <p className="text-fog">{c.none}</p>
            <Link to="/library" className="btn btn-ghost w-full">
              {c.toLibrary}
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, delay: 0.1 }}
            className="panel overflow-hidden rounded-[12px]"
          >
            <div className="iri-bg flex items-center justify-between border-b-[3px] border-ink px-4 pb-1 pt-2 text-ink [text-shadow:none]">
              <p className="text-[24px]">
                {c.world} #{questNumber(today)}
              </p>
              <p className="text-[22px] tabular-nums">
                {c.newIn} <Countdown onExpire={load} />
              </p>
            </div>

            <div className="p-4">
              <h1 className="display text-[46px]">{title || ' '}</h1>
              {desc && (
                <p className="mt-2 rounded-[8px] bg-cream px-3 py-2 text-[21px] leading-[1.05] text-ink [text-shadow:none]">{desc}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[19px]">
                <span className="text-fog">{c.reward}</span>
                <span className="chip-box rounded-[8px] bg-mult px-2.5 pb-0.5 pt-1">+{daily?.xp ?? 0} XP</span>
                <span className="inline-flex items-center gap-1 text-fog">
                  <ProofIcon size={15} /> {c[daily?.proof_type ?? 'photo']}
                </span>
                <span className="inline-flex items-center gap-1 text-fog">
                  <Clock size={15} /> ~{daily?.quests?.duration_min ?? 15} {c.min}
                </span>
              </div>

              {daily?.sponsor_name && (
                <p className="mt-3 text-[19px] text-fog">
                  {lang === 'sk' ? 'Dnešný quest prináša' : "Today's quest by"} <span className="text-gold">{daily.sponsor_name}</span>
                </p>
              )}

              <div className="mt-4">
                {!session ? (
                  <Link to="/signin" className="btn btn-iri w-full">
                    {c.signIn}
                  </Link>
                ) : mine ? (
                  <div className="flex items-center gap-3 rounded-[10px] bg-ink/40 p-2">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[8px] border-[3px] border-ink">
                      <ProofMedia url={mine.proof_url} type={mine.proof_type} color={gangColor} className="h-16" />
                    </div>
                    <p className="text-[24px] leading-none">{c.done}</p>
                  </div>
                ) : (
                  <button className="btn btn-iri w-full" onClick={() => setSheet(true)}>
                    {c.cta}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {stats && unit && (
        <section className="px-3 pt-4">
          <QuestStats stats={stats} unit={unit} goal={daily?.world_goal ?? null} />
        </section>
      )}

      {daily && (
        <ProofSheet
          open={sheet}
          onClose={() => setSheet(false)}
          questTitle={title}
          proofType={daily.proof_type}
          xp={daily.xp}
          metric={unit ? { label: unit, max: daily.metric_max ?? 500 } : null}
          onSubmit={submit}
        />
      )}

      {starter && (
        <ProofSheet
          open={starterSheet}
          onClose={() => setStarterSheet(false)}
          questTitle={lang === 'sk' ? starter.title_sk : starter.title_en}
          proofType={starter.proof_type}
          xp={starter.xp}
          metric={null}
          onSubmit={submitStarter}
        />
      )}

      <Celebration
        open={Boolean(party)}
        xp={party?.xp ?? 0}
        streak={party?.streak ?? null}
        rank={party?.rank ?? null}
        note={party?.note}
        story={party?.story}
        unlocked={unlocked}
        onClose={() => setParty(null)}
      />
    </div>
  )
}
