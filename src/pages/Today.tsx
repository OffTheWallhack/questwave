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
import { GANG_UNLOCK } from '../lib/gangs'
import { utcToday } from '../lib/date'
import { questNumber } from '../lib/progress'
import { useSession } from '../lib/session'
import { supabase } from '../lib/supabase'
import { GANG_COLOR, type Completion, type DailyQuest, type QuestStats as Stats } from '../lib/types'
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
  },
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
  const [unlocked, setUnlocked] = useState(false)
  const [party, setParty] = useState<{ streak: number; rank: number; note?: string } | null>(null)
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
    const { data: dq } = await supabase.rpc('ensure_daily_quest')
    let row = (Array.isArray(dq) ? dq[0] : dq) as DailyQuest | null
    if (row?.quest_id) {
      const { data: q } = await supabase.from('quests').select('*').eq('id', row.quest_id).maybeSingle()
      row = { ...row, quests: q ?? null }
    }
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

  const pick = (sk?: string | null, en?: string | null) => (lang === 'sk' ? sk : en ?? sk) ?? ''
  const title = daily?.custom_title_sk
    ? pick(daily.custom_title_sk, daily.custom_title_en)
    : pick(daily?.quests?.title_sk, daily?.quests?.title_en)
  const desc = daily?.custom_desc_sk
    ? pick(daily.custom_desc_sk, daily.custom_desc_en)
    : pick(daily?.quests?.description_sk, daily?.quests?.description_en)

  const unit = daily?.metric_sk ? (lang === 'sk' ? daily.metric_sk : daily.metric_en || daily.metric_sk) : null

  const ProofIcon = daily?.proof_type === 'video' ? Video : daily?.proof_type === 'voice' ? Mic : Camera
  const globeSize = Math.round(width * 0.6)
  const cities = baseCities + Math.floor((count - baseCount) / 6)

  async function submit(file: File, rating: number, amount: number | null) {
    if (!profile || !daily) return
    const { streak, rank } = await completeQuest({
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
    setParty({ streak, rank: Math.max(rank, count + 1), note })
    await refresh()
    await load()
  }

  const gangColor = profile?.gang ? GANG_COLOR[profile.gang] : '#FFB21E'

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
            {profile.streak_current}
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

      <Celebration
        open={Boolean(party)}
        xp={daily?.xp ?? 0}
        streak={party?.streak ?? null}
        rank={party?.rank ?? null}
        note={party?.note}
        unlocked={unlocked}
        onClose={() => setParty(null)}
      />
    </div>
  )
}
