import { AnimatePresence, motion } from 'framer-motion'
import { AtSign, ChevronRight, Crown, FileText, Info, Languages, Lock, LogOut, PenLine, Send, Share2, Shield, Trash2, Users } from 'lucide-react'
import { invite } from '../lib/share'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import GangPicker from '../components/GangPicker'
import HoloCard, { memberNo } from '../components/HoloCard'
import MotionChip from '../components/MotionChip'
import Sheet from '../components/Sheet'
import { setSwirl, shade } from '../components/Swirl'
import { utcToday } from '../lib/date'
import { renderFlexCard } from '../lib/flexcard'
import { GANG_UNLOCK, identity, recommendGang, WORLD_COLOR } from '../lib/gangs'
import { levelFromXp, titleForLevel } from '../lib/progress'
import { useSession } from '../lib/session'
import { supabase } from '../lib/supabase'
import { GANG_COLOR, type Completion } from '../lib/types'

const COPY = {
  sk: {
    share: 'Zdieľať Flex Card',
    level: 'Úroveň',
    toNext: 'do ďalšej úrovne',
    last5: 'Séria',
    history: 'Splnené questy',
    none: 'Zatiaľ nič. Dnešný svetový quest čaká.',
    lang: 'Jazyk',
    suggest: 'Navrhni quest alebo oprav preklad',
    contact: 'Kontakt na autora',
    out: 'Odhlásiť sa',
    save: 'Podrž prst na obrázku a ulož si ho do galérie.',
    close: 'Zavrieť',
    suggestTitle: 'Tvoj nápad',
    suggestHint: 'Napíš nový quest alebo opravu prekladu. Každý návrh si prečítam.',
    send: 'Odoslať',
    thanks: 'Vďaka, návrh dorazil.',
  },
  en: {
    share: 'Share Flex Card',
    level: 'Level',
    toNext: 'to next level',
    last5: 'Streak',
    history: 'Completed quests',
    none: 'Nothing yet. Today\'s world quest is waiting.',
    lang: 'Language',
    suggest: 'Suggest a quest or fix a translation',
    contact: 'Contact the maker',
    out: 'Sign out',
    save: 'Long-press the image to save it.',
    close: 'Close',
    suggestTitle: 'Your idea',
    suggestHint: 'Write a new quest or a translation fix. I read every one.',
    send: 'Send',
    thanks: 'Thanks, it arrived.',
  },
}

export default function ProfilePage() {
  const { session, profile, lang, refresh } = useSession()
  const c = COPY[lang]
  const [history, setHistory] = useState<Completion[]>([])
  const [card, setCard] = useState<string | null>(null)
  const navigate = useNavigate()
  const [picker, setPicker] = useState(false)
  const [invited, setInvited] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function deleteAccount() {
    if (!confirmDelete) return setConfirmDelete(true)
    await supabase.rpc('delete_my_account')
    await supabase.auth.signOut()
  }
  const [suggest, setSuggest] = useState(false)
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!session?.user.id) return
    supabase
      .from('completions')
      .select('*, quests(title_sk, title_en, mood)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => setHistory((data as Completion[]) ?? []))
  }, [session?.user.id, profile?.xp])

  useEffect(() => {
    const g = profile?.gang ? GANG_COLOR[profile.gang] : WORLD_COLOR
    setSwirl(['#1B1530', shade(g, 0.3), '#2A1D4E'])
  }, [profile?.gang])

  const days = useMemo(() => {
    const done = new Set(history.map((h) => h.quest_date ?? h.created_at.slice(0, 10)))
    const today = Date.parse(utcToday() + 'T00:00:00Z')
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(today - (34 - i) * 86400000).toISOString().slice(0, 10)
      return { d, done: done.has(d), today: i === 34 }
    })
  }, [history])

  if (!profile) return null

  const color = profile.gang ? GANG_COLOR[profile.gang] : WORLD_COLOR
  const done = history.length
  const unlocked = done >= GANG_UNLOCK
  const recommended = recommendGang(history.map((h) => h.quests?.mood))
  const lv = levelFromXp(profile.xp)

  async function share() {
    setCard(await renderFlexCard(profile!, lang, memberNo(profile!.id)))
  }

  async function sendSuggestion() {
    await supabase.from('quest_submissions').insert({
      submitted_by: session?.user.id ?? null,
      kind: 'new_quest',
      lang,
      body,
    })
    setSent(true)
    setBody('')
  }

  async function switchLang() {
    await supabase.from('profiles').update({ lang: lang === 'sk' ? 'en' : 'sk' }).eq('id', profile!.id)
    await refresh()
  }

  const rows: { Icon: typeof AtSign; label: string; value?: string; on?: () => void; href?: string }[] = [
    ...(profile.is_admin ? [{ Icon: Crown, label: 'Admin', value: lang === 'sk' ? 'plán questov' : 'quest plan', on: () => navigate('/admin') }] : []),
    {
      Icon: Send,
      label: lang === 'sk' ? 'Pozvi kamošov' : 'Invite friends',
      value: invited ?? undefined,
      on: async () => {
        const r = await invite(lang)
        setInvited(r === 'copied' ? (lang === 'sk' ? 'odkaz skopírovaný' : 'link copied') : r === 'shared' ? '✓' : null)
      },
    },
    { Icon: Languages, label: c.lang, value: lang === 'sk' ? 'Slovenčina' : 'English', on: switchLang },
    { Icon: PenLine, label: c.suggest, on: () => { setSent(false); setSuggest(true) } },
    { Icon: AtSign, label: c.contact, value: '@duriica', href: 'https://instagram.com/duriica' },
    { Icon: Info, label: lang === 'sk' ? 'O appke' : 'About', on: () => navigate('/about') },
    { Icon: Shield, label: lang === 'sk' ? 'Ochrana súkromia' : 'Privacy', on: () => navigate('/privacy') },
    { Icon: FileText, label: lang === 'sk' ? 'Podmienky' : 'Terms', on: () => navigate('/terms') },
    { Icon: LogOut, label: c.out, on: () => supabase.auth.signOut() },
    {
      Icon: Trash2,
      label: confirmDelete
        ? lang === 'sk' ? 'Naozaj? Zmaže všetko natrvalo' : 'Sure? Deletes everything forever'
        : lang === 'sk' ? 'Zmazať účet' : 'Delete account',
      on: deleteAccount,
    },
  ]

  return (
    <div className="space-y-5 pb-32 pt-5" style={{ ['--gang' as string]: color }}>
      <div className="space-y-3">
        <HoloCard profile={profile} lang={lang} />
        <MotionChip />
      </div>

      <div className="px-3">
        <button className="btn btn-iri w-full" onClick={share}>
          <Share2 size={18} /> {c.share}
        </button>
      </div>

      <section className="panel mx-3 rounded-[12px] p-4">
        {profile.gang ? (
          <div className="flex items-center gap-3">
            <Users size={22} style={{ color }} />
            <p className="flex-1 text-[22px]">
              {lang === 'sk' ? 'Tvoj gang' : 'Your gang'} <span style={{ color }}>{identity(profile, lang).name}</span>
            </p>
            <button className="btn btn-ghost h-11 px-3 text-[20px]" onClick={() => setPicker(true)}>
              {lang === 'sk' ? 'Zmeniť' : 'Change'}
            </button>
          </div>
        ) : !unlocked ? (
          <div>
            <p className="flex items-center gap-2 text-[24px]">
              <Lock size={18} className="text-fog" /> {lang === 'sk' ? 'Patríš celému svetu' : 'You belong to the whole world'}
            </p>
            <p className="mt-1 text-[19px] leading-tight text-fog">
              {lang === 'sk'
                ? `Gangy sa odomknú po ${GANG_UNLOCK} splnených questoch. Potom si môžeš jeden vybrať — alebo nie.`
                : `Gangs unlock after ${GANG_UNLOCK} completed quests. Then you can pick one — or not.`}
            </p>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: GANG_UNLOCK }, (_, i) => (
                <span key={i} className="h-4 flex-1 rounded-[4px] border-[3px] border-ink" style={{ background: i < done ? WORLD_COLOR : '#241E3A' }} />
              ))}
            </div>
            <p className="mt-1.5 text-right text-[18px] text-fog">
              {Math.min(done, GANG_UNLOCK)} / {GANG_UNLOCK}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[26px] text-gold">{lang === 'sk' ? 'Gangy sú odomknuté' : 'Gangs are unlocked'}</p>
            <p className="mt-1 text-[19px] leading-tight text-fog">
              {lang === 'sk'
                ? 'Pozri sa, ktorý ti sedí podľa toho, čo robíš. Alebo ostaň vo svete — nič sa nestane.'
                : 'See which one fits what you do. Or stay in the world — nothing changes.'}
            </p>
            <button className="btn btn-iri mt-3 w-full" onClick={() => setPicker(true)}>
              {lang === 'sk' ? 'Pozrieť gangy' : 'See the gangs'}
            </button>
          </div>
        )}
      </section>

      <section className="panel mx-3 rounded-[12px] p-4">
        <div className="flex items-baseline justify-between">
          <p className="display-md text-[30px]">
            {c.level} {lv.level}
          </p>
          <p className="text-sm text-fog">{titleForLevel(lv.level, lang)}</p>
        </div>
        <div className="mt-3 h-4 overflow-hidden rounded-[6px] border-[3px] border-ink bg-ink">
          <motion.div
            className="h-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(3, lv.progress * 100)}%` }}
            transition={{ type: 'spring', damping: 22, delay: 0.2 }}
          />
        </div>
        <p className="mt-2 text-[18px] tabular-nums text-fog">
          {lv.into} / {lv.need} XP {c.toNext}
        </p>
      </section>

      <section className="panel mx-3 rounded-[12px] p-4">
        <div className="flex items-baseline justify-between">
          <p className="display-md text-[30px]">{c.last5}</p>
          <p className="text-sm text-fog">
            {lang === 'sk' ? 'Najdlhšia' : 'Best'} <span className="text-chalk">{profile.streak_best}</span>
          </p>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {days.map((d) => (
            <span
              key={d.d}
              title={d.d}
              className="aspect-square rounded-[8px]"
              style={{
                background: d.done ? color : '#241E3A',
                border: '2px solid #120E20',
                boxShadow: d.today ? `inset 0 0 0 2px ${d.done ? '#0F0F13' : color}` : undefined,
                opacity: d.done ? 1 : 0.9,
              }}
            />
          ))}
        </div>
      </section>

      <section className="panel mx-3 rounded-[12px] p-4">
        <p className="display-md text-[30px]">{c.history}</p>
        {history.length === 0 ? (
          <p className="mt-3 text-fog">{c.none}</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.07]">
            {history.slice(0, 12).map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-4 py-3.5">
                <span className="truncate">
                  {h.quests ? (lang === 'sk' ? h.quests.title_sk : h.quests.title_en) : '—'}
                </span>
                <span className="shrink-0 text-[18px] tabular-nums text-fog">
                  {new Date(h.created_at).toLocaleDateString(lang === 'sk' ? 'sk' : 'en', { day: 'numeric', month: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel mx-3 overflow-hidden rounded-[12px]">
        {rows.map(({ Icon, label, value, on, href }, i) => {
          const inner = (
            <>
              <Icon size={19} className="text-fog" />
              <span className="flex-1 text-left">{label}</span>
              {value && <span className="text-sm text-fog">{value}</span>}
              <ChevronRight size={17} className="text-white/25" />
            </>
          )
          const cls = 'flex w-full items-center gap-3.5 px-5 py-4 ' + (i ? 'border-t border-white/[0.06]' : '')
          return href ? (
            <a key={label} href={href} target="_blank" rel="noreferrer" className={cls}>
              {inner}
            </a>
          ) : (
            <button key={label} onClick={on} className={cls}>
              {inner}
            </button>
          )
        })}
      </section>

      <AnimatePresence>
        {card && (
          <motion.div
            className="fixed inset-0 z-[65] flex flex-col items-center justify-center gap-5 bg-black/90 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCard(null)}
          >
            <motion.img
              src={card}
              alt="Flex Card"
              className="keep-callout max-h-[72vh] rounded-2xl shadow-2xl"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 18 }}
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-center text-sm text-fog">{c.save}</p>
            <button className="btn btn-ghost">{c.close}</button>
          </motion.div>
        )}
      </AnimatePresence>

      <GangPicker open={picker} onClose={() => setPicker(false)} recommended={recommended} />

      <Sheet open={suggest} onClose={() => setSuggest(false)}>
        <div className="space-y-5 px-5 pt-3">
          <div>
            <h2 className="display-md text-[32px]">{c.suggestTitle}</h2>
            <p className="mt-2 text-fog">{c.suggestHint}</p>
          </div>
          {sent ? (
            <p className="rounded-2xl bg-white/[0.05] p-5">{c.thanks}</p>
          ) : (
            <>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-4 outline-none focus:border-white/30"
              />
              <button className="btn btn-iri w-full" disabled={!body.trim()} onClick={sendSuggestion}>
                {c.send}
              </button>
            </>
          )}
        </div>
      </Sheet>
    </div>
  )
}
