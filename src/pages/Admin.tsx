import { ArrowLeft, Check, Dices, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Sheet from '../components/Sheet'
import { setSwirl } from '../components/Swirl'
import { utcToday } from '../lib/date'
import { questNumber } from '../lib/progress'
import { useSession } from '../lib/session'
import { supabase } from '../lib/supabase'
import type { DailyQuest, ProofKind, Quest } from '../lib/types'

interface Submission {
  id: string
  kind: string
  body: string
  status: string
  created_at: string
  lang: string | null
  target_completion?: string | null
}

const DAYS = 14

function addDays(date: string, n: number) {
  return new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10)
}

const EMPTY = {
  custom_title_sk: '',
  custom_title_en: '',
  custom_desc_sk: '',
  custom_desc_en: '',
  proof_type: 'photo' as ProofKind,
  xp: 100,
  sponsor_name: '',
  quest_id: null as string | null,
  metric_sk: '',
  metric_en: '',
  metric_max: 500,
  world_goal: '' as string | number,
}

/** Jednoduchý admin: plán svetových questov na 14 dní + návrhy od komunity. */
export default function Admin() {
  const { profile, lang } = useSession()
  const [plan, setPlan] = useState<Record<string, DailyQuest>>({})
  const [library, setLibrary] = useState<Quest[]>([])
  const [subs, setSubs] = useState<Submission[]>([])
  const [stats, setStats] = useState<null | {
    users_total: number
    users_7d: number
    active_7d: number
    done_today: number
    done_total: number
    cities_total: number
    per_day: { day: string; n: number }[]
    top_cities: { city: string; n: number }[]
  }>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = utcToday()

  useEffect(() => setSwirl(['#1B1530', '#3A2A12', '#1B3A2A']), [])

  const load = useCallback(async () => {
    const { data: dq } = await supabase
      .from('daily_quests')
      .select('*')
      .gte('quest_date', today)
      .lte('quest_date', addDays(today, DAYS - 1))
    const map: Record<string, DailyQuest> = {}
    for (const r of (dq as DailyQuest[]) ?? []) map[r.quest_date] = r
    setPlan(map)

    const { data: q } = await supabase.from('quests').select('*').eq('is_daily_eligible', true).eq('is_active', true)
    setLibrary((q as Quest[]) ?? [])

    const { data: s } = await supabase
      .from('quest_submissions')
      .select('*')
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(50)
    setSubs((s as Submission[]) ?? [])

    const { data: st } = await supabase.rpc('admin_stats')
    if (st) setStats(st)
  }, [today])

  useEffect(() => {
    load()
  }, [load])

  if (profile && !profile.is_admin) return <Navigate to="/profile" replace />

  function open(date: string) {
    const row = plan[date]
    setError(null)
    setEditing(date)
    setForm(
      row
        ? {
            custom_title_sk: row.custom_title_sk ?? '',
            custom_title_en: row.custom_title_en ?? '',
            custom_desc_sk: row.custom_desc_sk ?? '',
            custom_desc_en: row.custom_desc_en ?? '',
            proof_type: row.proof_type,
            xp: row.xp,
            sponsor_name: row.sponsor_name ?? '',
            quest_id: row.quest_id,
            metric_sk: row.metric_sk ?? '',
            metric_en: row.metric_en ?? '',
            metric_max: row.metric_max ?? 500,
            world_goal: row.world_goal ?? '',
          }
        : { ...EMPTY },
    )
  }

  function randomFromLibrary() {
    if (!library.length) return
    const q = library[Math.floor(Math.random() * library.length)]
    setForm({
      ...form,
      quest_id: q.id,
      custom_title_sk: q.title_sk,
      custom_title_en: q.title_en,
      custom_desc_sk: q.description_sk,
      custom_desc_en: q.description_en,
      proof_type: q.proof_type,
      xp: q.xp * 2,
    })
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setError(null)
    const row = {
      quest_date: editing,
      quest_id: form.quest_id,
      custom_title_sk: form.custom_title_sk.trim() || null,
      custom_title_en: form.custom_title_en.trim() || form.custom_title_sk.trim() || null,
      custom_desc_sk: form.custom_desc_sk.trim() || null,
      custom_desc_en: form.custom_desc_en.trim() || form.custom_desc_sk.trim() || null,
      proof_type: form.proof_type,
      xp: Number(form.xp) || 100,
      sponsor_name: form.sponsor_name.trim() || null,
      metric_sk: form.metric_sk.trim() || null,
      metric_en: form.metric_en.trim() || form.metric_sk.trim() || null,
      metric_max: Number(form.metric_max) || 500,
      world_goal: Number(form.world_goal) || null,
    }
    const res = plan[editing]
      ? await supabase.from('daily_quests').update(row).eq('quest_date', editing)
      : await supabase.from('daily_quests').insert(row)
    setSaving(false)
    if (res.error) {
      setError(res.error.message)
      return
    }
    setEditing(null)
    await load()
  }

  async function hidePost(s: Submission) {
    setSubs((list) => list.filter((x) => x.id !== s.id))
    await supabase.rpc('hide_completion', { p_id: s.target_completion })
  }

  async function setStatus(id: string, status: 'accepted' | 'rejected') {
    setSubs((list) => list.filter((x) => x.id !== id))
    await supabase.from('quest_submissions').update({ status }).eq('id', id)
  }

  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, i))
  const fmt = (d: string) =>
    new Date(d + 'T12:00:00Z').toLocaleDateString(lang === 'sk' ? 'sk' : 'en', { weekday: 'short', day: 'numeric', month: 'numeric' })

  const field = 'panel-dark w-full rounded-[10px] px-3 py-2 text-[22px] outline-none placeholder:text-fog'

  return (
    <div className="space-y-5 px-3 pb-32 pt-4">
      <Link to="/profile" className="inline-flex h-10 items-center gap-2 text-[22px] text-fog">
        <ArrowLeft size={18} /> Profil
      </Link>
      <h1 className="display text-[54px]">Admin</h1>

      {stats && (
        <section className="panel rounded-[12px] p-4">
          <p className="display text-[34px]">Čísla pre sponzorov</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ['ľudí', stats.users_total, 'bg-chips'],
              ['aktívnych 7 dní', stats.active_7d, 'bg-mult'],
              ['dnes splnili', stats.done_today, 'bg-looters'],
              ['nových 7 dní', stats.users_7d, 'bg-mint'],
              ['splnení spolu', stats.done_total, 'bg-nightcrawlers'],
              ['miest', stats.cities_total, 'bg-gold'],
            ].map(([label, n, bg]) => (
              <div key={label as string} className={'chip-box rounded-[10px] px-1 pb-1.5 pt-2 ' + bg}>
                <p className="num text-[34px]">{(n as number).toLocaleString('sk')}</p>
                <p className="text-[15px] leading-none text-chalk/90">{label}</p>
              </div>
            ))}
          </div>
          {stats.per_day.length > 0 && (
            <div className="mt-4">
              <p className="text-[18px] text-fog">Splnenia za posledných 14 dní</p>
              <div className="mt-1 flex h-20 items-end gap-1">
                {stats.per_day.map((d) => (
                  <div
                    key={d.day}
                    title={`${d.day}: ${d.n}`}
                    className="flex-1 rounded-t-[3px] border-[2px] border-ink bg-gold"
                    style={{ height: `${Math.max(8, (d.n / Math.max(...stats.per_day.map((x) => x.n))) * 100)}%` }}
                  />
                ))}
              </div>
            </div>
          )}
          {stats.top_cities.length > 0 && (
            <p className="mt-3 text-[19px] text-fog">
              Najaktívnejšie mestá: <span className="text-chalk">{stats.top_cities.map((c) => `${c.city} (${c.n})`).join(', ')}</span>
            </p>
          )}
        </section>
      )}

      <section className="panel rounded-[12px] p-4">
        <p className="display text-[34px]">Svetové questy</p>
        <p className="mt-1 text-[19px] text-fog">
          Ťukni na deň a napíš quest. Prázdny deň si appka o polnoci UTC vytiahne sama zo zásobníka.
        </p>
        <ul className="mt-3 space-y-2">
          {days.map((d) => {
            const row = plan[d]
            const title = row?.custom_title_sk ?? library.find((q) => q.id === row?.quest_id)?.title_sk
            return (
              <li key={d}>
                <button
                  onClick={() => open(d)}
                  className="panel-dark flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left"
                >
                  <span className="w-[74px] shrink-0 text-[19px] text-fog">
                    {fmt(d)}
                    <span className="block text-[16px]">#{questNumber(d)}</span>
                  </span>
                  <span className={'flex-1 text-[22px] leading-none ' + (row ? '' : 'text-fog')}>
                    {row ? title : 'automaticky zo zásobníka'}
                  </span>
                  {row?.sponsor_name && (
                    <span className="chip-box rounded-[6px] bg-gold px-1.5 pt-0.5 text-[15px] text-ink [text-shadow:none]">
                      {row.sponsor_name}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="panel rounded-[12px] p-4">
        <p className="display text-[34px]">Návrhy od ľudí</p>
        {subs.length === 0 ? (
          <p className="mt-2 text-[20px] text-fog">Nič nové.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {subs.map((s) => (
              <li key={s.id} className="panel-dark rounded-[10px] p-3">
                <p className="text-[21px] leading-tight">{s.body}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[16px] text-fog">
                    {s.kind === 'translation_fix' ? 'preklad' : s.kind === 'report' ? 'nahlásenie' : 'nový quest'} ·{' '}
                    {new Date(s.created_at).toLocaleDateString('sk')}
                  </span>
                  <span className="flex gap-2">
                    {s.kind === 'report' && s.target_completion && (
                      <button onClick={() => hidePost(s)} className="btn btn-red h-10 px-3 text-[19px]">
                        Skryť
                      </button>
                    )}
                    <button aria-label="Prijať" onClick={() => setStatus(s.id, 'accepted')} className="btn h-10 bg-mint px-3">
                      <Check size={18} />
                    </button>
                    <button aria-label="Zamietnuť" onClick={() => setStatus(s.id, 'rejected')} className="btn btn-red h-10 px-3">
                      <X size={18} />
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && (
          <div className="space-y-3 px-4 pt-2">
            <p className="display text-[34px]">
              {fmt(editing)} · #{questNumber(editing)}
            </p>
            <button onClick={randomFromLibrary} className="btn btn-blue h-12 w-full text-[22px]">
              <Dices size={18} /> Vytiahnuť zo zásobníka
            </button>
            <input className={field} placeholder="Názov (SK)" value={form.custom_title_sk} onChange={(e) => setForm({ ...form, custom_title_sk: e.target.value, quest_id: null })} />
            <input className={field} placeholder="Title (EN)" value={form.custom_title_en} onChange={(e) => setForm({ ...form, custom_title_en: e.target.value })} />
            <textarea rows={3} className={field} placeholder="Popis (SK)" value={form.custom_desc_sk} onChange={(e) => setForm({ ...form, custom_desc_sk: e.target.value })} />
            <textarea rows={3} className={field} placeholder="Description (EN)" value={form.custom_desc_en} onChange={(e) => setForm({ ...form, custom_desc_en: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className={field} value={form.proof_type} onChange={(e) => setForm({ ...form, proof_type: e.target.value as ProofKind })}>
                <option value="photo">Fotka</option>
                <option value="video">Video</option>
                <option value="voice">Hlasovka</option>
              </select>
              <input className={field} type="number" inputMode="numeric" placeholder="XP" value={form.xp} onChange={(e) => setForm({ ...form, xp: Number(e.target.value) })} />
            </div>
            <div className="panel-dark space-y-2 rounded-[10px] p-3">
              <p className="text-[20px]">Počítanie (nepovinné)</p>
              <p className="text-[16px] leading-tight text-fog">
                Ak vyplníš jednotku, ľudia pri dôkaze zadajú počet a appka ukáže svetový súčet, priemery a rebríčky.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input className={field} placeholder="jednotka SK (kusov odpadu)" value={form.metric_sk} onChange={(e) => setForm({ ...form, metric_sk: e.target.value })} />
                <input className={field} placeholder="unit EN (pieces of litter)" value={form.metric_en} onChange={(e) => setForm({ ...form, metric_en: e.target.value })} />
                <input className={field} type="number" inputMode="numeric" placeholder="max na človeka" value={form.metric_max} onChange={(e) => setForm({ ...form, metric_max: Number(e.target.value) })} />
                <input className={field} type="number" inputMode="numeric" placeholder="cieľ sveta" value={form.world_goal} onChange={(e) => setForm({ ...form, world_goal: e.target.value })} />
              </div>
            </div>
            <input className={field} placeholder="Sponzor (nepovinné)" value={form.sponsor_name} onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })} />
            {error && <p className="text-[20px] text-mult">{error}</p>}
            <button className="btn btn-iri w-full" disabled={!form.custom_title_sk.trim() || saving} onClick={save}>
              {saving ? 'Ukladám…' : 'Uložiť'}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
