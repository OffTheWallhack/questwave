import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { setSwirl } from '../components/Swirl'
import { haptic } from '../lib/confetti'
import { GANG_UNLOCK } from '../lib/gangs'
import { useSession } from '../lib/session'
import { supabase } from '../lib/supabase'

const COPY = {
  sk: {
    h: 'Ako ťa majú volať?',
    p: 'Túto prezývku uvidia ostatní vo feede.',
    world: 'Na začiatku si súčasťou celého sveta — nikam sa nepridávaš. Gangy sa ti odomknú, až keď splníš',
    world2: 'questov a budeš vedieť, o čo ide. Pridať sa nemusíš nikdy.',
    name: 'prezývka',
    age: 'Mám 16 alebo viac rokov',
    enter: 'Vstúpiť do sveta',
    taken: 'Táto prezývka je obsadená. Skús inú.',
  },
  en: {
    h: 'What should we call you?',
    p: 'Others will see this in the feed.',
    world: 'You start as part of the whole world — no teams. Gangs unlock after you complete',
    world2: 'quests and know what this is about. You never have to join one.',
    name: 'username',
    age: 'I am 16 or older',
    enter: 'Enter the world',
    taken: 'That username is taken. Try another one.',
  },
}

export default function Onboarding() {
  const { session, lang, refresh } = useSession()
  const c = COPY[lang]
  const [username, setUsername] = useState('')
  const [adult, setAdult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => setSwirl(['#1B1530', '#5B2E9E', '#0E5A63']), [])

  async function save() {
    if (!session?.user.id) return
    setSaving(true)
    const { error: err } = await supabase.from('profiles').insert({
      id: session.user.id,
      username: username.trim(),
      lang,
      is_adult_16: adult,
    })
    if (err) {
      setError(c.taken)
      setSaving(false)
      return
    }
    haptic(20)
    await refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[100dvh] flex-col px-4 pt-8"
      style={{ paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}
    >
      <h1 className="display text-[56px]">{c.h}</h1>
      <p className="mt-2 text-[22px] text-fog">{c.p}</p>

      <input
        autoFocus
        value={username}
        onChange={(e) => {
          setUsername(e.target.value.replace(/\s/g, '').slice(0, 20))
          setError(null)
        }}
        placeholder={c.name}
        className="panel mt-6 h-20 w-full rounded-[12px] px-5 text-[48px] outline-none placeholder:text-fog/50"
      />
      {error && <p className="mt-2 text-[20px] text-mult">{error}</p>}

      <button type="button" onClick={() => setAdult(!adult)} className="panel mt-4 flex items-center justify-between rounded-[12px] px-5 py-4 text-[22px]">
        <span>{c.age}</span>
        <span className="relative h-8 w-14 rounded-[8px] border-[3px] border-ink transition" style={{ background: adult ? '#3FCB8A' : '#241E3A' }}>
          <motion.span
            className="absolute top-[3px] h-5 w-5 rounded-[4px] bg-chalk"
            animate={{ left: adult ? 26 : 3 }}
            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
          />
        </span>
      </button>

      <div className="panel-dark mt-4 flex gap-3 rounded-[12px] p-4">
        <span className="chip-box grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-gold text-[26px]">◎</span>
        <p className="text-[20px] leading-tight text-chalk/90">
          {c.world} <span className="text-gold">{GANG_UNLOCK}</span> {c.world2}
        </p>
      </div>

      <button className="btn btn-iri mt-auto w-full" disabled={username.trim().length < 2 || !adult || saving} onClick={save} style={{ marginTop: 28 }}>
        {c.enter}
      </button>
    </motion.div>
  )
}
