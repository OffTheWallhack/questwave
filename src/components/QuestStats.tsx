import { motion } from 'framer-motion'
import { Crown, Target, TrendingUp, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { identity } from '../lib/gangs'
import { useSession } from '../lib/session'
import type { Board, Gang, QuestStats as Stats } from '../lib/types'
import { countryName, flag, myCountry, myLocation, myRegion, regionName } from '../lib/world'

type Tab = 'gang' | 'country' | 'region' | 'city'

const COPY = {
  sk: {
    title: 'Svet dnes',
    together: 'spolu',
    goal: 'cieľ',
    people: 'ľudí',
    avg: 'Ø na človeka',
    record: 'rekord dňa',
    you: 'Ty',
    of: 'z',
    better: 'lepší než',
    vsAvg: '× priemer',
    aboveAvg: 'Si nad svetovým priemerom.',
    toAvg: (n: number) => `Ešte ${n} a si na svetovom priemere.`,
    first: 'Si dnes na prvom mieste na svete.',
    notYet: 'Splň quest a uvidíš, kde si medzi ostatnými.',
    tabs: { gang: 'Gangy', country: 'Krajiny', region: 'Svetadiely', city: 'Mestá' },
    perMember: 'Ø na člena',
    fairNote: 'Gangy sa porovnávajú podľa priemeru na člena — veľkosť gangu nerozhoduje.',
    empty: 'Zatiaľ tu nič nie je. Buď prvý.',
    goalDone: 'Cieľ splnený! Svet to dal.',
  },
  en: {
    title: 'World today',
    together: 'together',
    goal: 'goal',
    people: 'people',
    avg: 'avg per person',
    record: 'record today',
    you: 'You',
    of: 'of',
    better: 'better than',
    vsAvg: '× average',
    aboveAvg: 'You are above the world average.',
    toAvg: (n: number) => `${n} more and you hit the world average.`,
    first: 'You are number one in the world today.',
    notYet: 'Do the quest to see where you stand.',
    tabs: { gang: 'Gangs', country: 'Countries', region: 'Continents', city: 'Cities' },
    perMember: 'avg per member',
    fairNote: 'Gangs are ranked by average per member — size does not matter.',
    empty: 'Nothing here yet. Be the first.',
    goalDone: 'Goal reached! The world did it.',
  },
}

interface Props {
  stats: Stats
  unit: string
  goal: number | null
}

/** Štatistiky svetového questu — motivačné a súťažné, ale férové. */
export default function QuestStats({ stats, unit, goal }: Props) {
  const { profile, lang } = useSession()
  const c = COPY[lang]
  const [tab, setTab] = useState<Tab>('country')
  const fmt = (n: number) => Number(n).toLocaleString(lang === 'sk' ? 'sk' : 'en', { maximumFractionDigits: 1 })

  const progress = goal ? Math.min(1, stats.total / goal) : 0
  const me = stats.me
  const ratio = me && stats.avg > 0 ? me.amount / stats.avg : 0
  const pctBetter = me && me.of > 1 ? Math.round((me.beaten / (me.of - 1)) * 100) : 0

  const boards: Record<Tab, Board[]> = {
    gang: stats.by_gang,
    country: stats.by_country,
    region: stats.by_region,
    city: stats.by_city,
  }
  const rows = boards[tab]
  const byAvg = tab === 'gang'
  const maxVal = Math.max(1, ...rows.map((r) => (byAvg ? r.avg : r.total)))

  // čo je "moje" v rebríčku
  const mineKey: Record<Tab, string | null> = {
    gang: profile?.gang ?? 'world',
    country: myCountry(),
    region: myRegion(),
    city: myLocation().city,
  }

  function label(key: string) {
    if (tab === 'country') return `${flag(key)} ${countryName(key, lang)}`
    if (tab === 'region') return regionName(key, lang)
    if (tab === 'gang') return identity({ gang: key === 'world' ? null : (key as Gang) }, lang).name
    return key
  }
  function color(key: string) {
    return tab === 'gang' ? identity({ gang: key === 'world' ? null : (key as Gang) }, lang).color : '#FFB21E'
  }

  return (
    <section className="panel overflow-hidden rounded-[12px]">
      <div className="flex items-center justify-between border-b-[3px] border-ink bg-chips px-4 pb-1 pt-2">
        <p className="text-[24px]">{c.title}</p>
        <p className="text-[19px] text-chalk/85">{unit}</p>
      </div>

      <div className="space-y-3 p-4">
        {/* svetový súčet + cieľ */}
        <div className="chip-box rounded-[12px] bg-gold px-4 pb-3 pt-3 text-ink [text-shadow:none]">
          <div className="flex items-baseline justify-between gap-2">
            <motion.p key={stats.total} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="num text-[60px]">
              {fmt(stats.total)}
            </motion.p>
            <p className="text-right text-[19px] leading-tight">
              {unit}
              <br />
              {c.together}
            </p>
          </div>
          {goal && (
            <>
              <div className="mt-2 h-5 overflow-hidden rounded-[6px] border-[3px] border-ink bg-ink/30">
                <motion.div
                  className="h-full bg-mult"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, progress * 100)}%` }}
                  transition={{ type: 'spring', damping: 20 }}
                />
              </div>
              <p className="mt-1 flex items-center gap-1 text-[18px]">
                <Target size={15} />
                {progress >= 1 ? c.goalDone : `${Math.floor(progress * 100)} % · ${c.goal} ${fmt(goal)}`}
              </p>
            </>
          )}
        </div>

        {/* základné čísla */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="chip-box rounded-[10px] bg-chips px-1 pb-1.5 pt-2">
            <p className="num text-[32px]">{fmt(stats.people)}</p>
            <p className="flex items-center justify-center gap-1 text-[15px] text-chalk/90">
              <Users size={12} /> {c.people}
            </p>
          </div>
          <div className="chip-box rounded-[10px] bg-mult px-1 pb-1.5 pt-2">
            <p className="num text-[32px]">{fmt(stats.avg)}</p>
            <p className="text-[15px] text-chalk/90">{c.avg}</p>
          </div>
          <div className="chip-box rounded-[10px] bg-nightcrawlers px-1 pb-1.5 pt-2">
            <p className="num text-[32px]">{stats.record ? fmt(stats.record.amount) : '—'}</p>
            <p className="flex items-center justify-center gap-1 text-[15px] text-chalk/90">
              <Crown size={12} /> {c.record}
            </p>
          </div>
        </div>
        {stats.record && (
          <p className="-mt-1 text-center text-[17px] text-fog">
            {c.record}: <span className="text-chalk">{stats.record.username}</span>
            {stats.record.city ? `, ${stats.record.city}` : ''}
          </p>
        )}

        {/* ty vs svet */}
        <div className="panel-dark rounded-[12px] p-3">
          {me ? (
            <>
              <div className="flex items-center gap-3">
                <span className="chip-box rounded-[10px] bg-mint px-3 pb-1 pt-2 text-center">
                  <span className="num block text-[38px]">#{fmt(me.rank)}</span>
                  <span className="block text-[14px] text-chalk/90">
                    {c.of} {fmt(me.of)}
                  </span>
                </span>
                <div className="flex-1 text-[20px] leading-tight">
                  <p>
                    {c.you}: <span className="text-gold">{fmt(me.amount)}</span> {unit}
                  </p>
                  {me.of > 1 && (
                    <p className="text-fog">
                      {c.better} <span className="text-chalk">{pctBetter} %</span> ·{' '}
                      <span className="text-chalk">{fmt(Math.round(ratio * 10) / 10)}</span>
                      {c.vsAvg}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[19px] text-gold">
                <TrendingUp size={16} />
                {me.rank === 1
                  ? c.first
                  : me.amount >= stats.avg
                    ? c.aboveAvg
                    : c.toAvg(Math.ceil(stats.avg - me.amount))}
              </p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-[20px] text-fog">
              <Trophy size={18} /> {c.notYet}
            </p>
          )}
        </div>

        {/* rebríčky */}
        <div className="flex gap-1 rounded-[10px] border-[3px] border-ink bg-ink/40 p-1">
          {(Object.keys(c.tabs) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={'flex-1 rounded-[7px] pb-0.5 pt-1 text-[18px] ' + (tab === t ? 'bg-chips text-chalk' : 'text-fog')}
            >
              {c.tabs[t]}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="text-[19px] text-fog">{c.empty}</p>
        ) : (
          <ol className="space-y-1.5">
            {rows.map((r, i) => {
              const mine = mineKey[tab] === r.key
              const val = byAvg ? r.avg : r.total
              return (
                <li
                  key={r.key}
                  className="rounded-[8px] px-2 py-1.5"
                  style={mine ? { background: 'rgba(255,178,30,0.16)', boxShadow: 'inset 0 0 0 2px #FFB21E' } : undefined}
                >
                  <div className="flex items-baseline gap-2 text-[20px]">
                    <span className="w-6 text-fog">{i + 1}.</span>
                    <span className="min-w-0 flex-1 truncate" style={tab === 'gang' ? { color: color(r.key) } : undefined}>
                      {label(r.key)}
                    </span>
                    <span className="tabular-nums">{fmt(val)}</span>
                  </div>
                  <div className="ml-8 mt-1 flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-[3px] bg-ink/50">
                      <div className="h-full" style={{ width: `${(val / maxVal) * 100}%`, background: color(r.key) }} />
                    </div>
                    <span className="shrink-0 text-[15px] text-fog">
                      {byAvg ? `${fmt(r.total)} · ${fmt(r.people)} ${c.people}` : `Ø ${fmt(r.avg)} · ${fmt(r.people)} ${c.people}`}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        {tab === 'gang' && <p className="text-[16px] leading-tight text-fog">{c.fairNote}</p>}
      </div>
    </section>
  )
}
