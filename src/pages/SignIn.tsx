import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OWNER } from '../lib/owner'
import Globe from '../components/Globe'
import { useSession } from '../lib/session'
import { DEMO, supabase } from '../lib/supabase'
import { useLivePings } from '../lib/world'
import { BRAND } from '../lib/brand'

const COPY = {
  sk: {
    h: ['Jeden quest.', 'Celý svet.', 'Každý deň.'],
    p: 'Každý deň dostane celá planéta tú istú úlohu. Splníš ju, pridáš dôkaz a tvoja bodka sa rozsvieti na mape.',
    email: 'Tvoj e-mail',
    cta: 'Pridať sa',
    demo: 'Pokračovať v deme',
    google: 'Pokračovať cez Google',
    or: 'alebo e-mailom',
    sent: 'Poslali sme ti e-mail. Ťukni na odkaz, alebo sem prepíš 6-miestny kód.',
    code: 'Kód z e-mailu',
    verify: 'Prihlásiť',
    wrong: 'Kód nesedí alebo vypršal. Skús to znova.',
    again: 'Poslať znova',
  },
  en: {
    h: ['One quest.', 'The whole world.', 'Every day.'],
    p: 'Every day the whole planet gets the same task. Do it, add proof, and your dot lights up on the map.',
    email: 'Your email',
    cta: 'Join',
    demo: 'Continue in demo',
    google: 'Continue with Google',
    or: 'or with email',
    sent: 'We sent you an email. Tap the link, or type the 6-digit code here.',
    code: 'Code from email',
    verify: 'Sign in',
    wrong: 'That code is wrong or expired. Try again.',
    again: 'Send again',
  },
}

export default function SignIn() {
  const { lang } = useSession()
  const c = COPY[lang]
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { pings } = useLivePings(0)
  const size = Math.min(innerWidth, 448)

  async function send(addr = email) {
    setBusy(true)
    setError(null)
    await supabase.auth.signInWithOtp({ email: addr.trim(), options: { emailRedirectTo: window.location.origin } })
    setBusy(false)
    setSent(true)
  }

  async function google() {
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (err) {
      setBusy(false)
      setError(err.message)
    }
  }

  async function verify() {
    setBusy(true)
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setBusy(false)
    if (err) setError(c.wrong)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden">
      <motion.div
        className="flex justify-center pt-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <Globe size={size} pings={pings} speed={1.4} />
      </motion.div>

      <div className="-mt-6 flex flex-1 flex-col px-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-3 flex flex-wrap items-center gap-2"
        >
          <span className="display wave text-[52px] leading-none tracking-[0.03em] text-gold" aria-label={BRAND.name}>
            {BRAND.wordmark.split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                {ch}
              </span>
            ))}
          </span>
          <span className="chip-box rounded-[8px] bg-mult px-2 pb-0.5 pt-1 text-[18px] leading-none">{BRAND.tagline}</span>
        </motion.div>
        <h1 className="display text-[42px] leading-[0.98]">
          {c.h.map((line, i) => (
            <motion.span
              key={line}
              className="block"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.12, type: 'spring', damping: 20 }}
            >
              {line}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="mt-5 max-w-[36ch] text-fog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95 }}
        >
          {c.p}
        </motion.p>

        <motion.div
          className="mt-auto space-y-3 pt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          {sent ? (
            <>
              <p className="panel rounded-[12px] p-4 text-[22px]">{c.sent}</p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''))
                  setError(null)
                }}
                placeholder={c.code}
                className="panel h-16 w-full rounded-[12px] px-5 text-center text-[36px] tracking-[0.3em] outline-none placeholder:text-[22px] placeholder:tracking-normal placeholder:text-fog"
              />
              {error && <p className="text-[20px] text-mult">{error}</p>}
              <button className="btn btn-iri w-full" disabled={code.length !== 6 || busy} onClick={verify}>
                {c.verify}
              </button>
              <button className="w-full py-2 text-[20px] text-fog underline" onClick={() => send()}>
                {c.again}
              </button>
            </>
          ) : DEMO ? (
            <>
              <GoogleButton label={c.google} onClick={google} disabled={busy} />
              <button className="btn btn-iri w-full" onClick={() => send('demo@questwave.app')}>
                {c.demo}
              </button>
            </>
          ) : (
            <>
              <GoogleButton label={c.google} onClick={google} disabled={busy} />
              <p className="pt-1 text-center text-[18px] text-fog">{c.or}</p>
              {error && <p className="text-center text-[20px] text-mult">{error}</p>}
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={c.email}
                className="panel h-14 w-full rounded-[12px] px-5 text-[24px] outline-none placeholder:text-fog"
              />
              <button className="btn btn-iri w-full" disabled={!email.includes('@') || busy} onClick={() => send()}>
                {c.cta}
              </button>
            </>
          )}
          <p className="pt-1 text-center text-[17px] leading-tight text-fog">
            {lang === 'sk' ? 'Pokračovaním súhlasíš s ' : 'By continuing you agree to the '}
            <Link to="/terms" className="underline">{lang === 'sk' ? 'podmienkami' : 'terms'}</Link>
            {lang === 'sk' ? ' a ' : ' and '}
            <Link to="/privacy" className="underline">{lang === 'sk' ? 'zásadami súkromia' : 'privacy policy'}</Link>.
            <br />
            <Link to="/about">© {OWNER.year} {OWNER.author}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function GoogleButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button className="btn w-full bg-chalk text-ink [text-shadow:none]" onClick={onClick} disabled={disabled}>
      <span className="grid h-7 w-7 place-items-center rounded-[6px] border-[2px] border-ink bg-white text-[22px] leading-none">G</span>
      {label}
    </button>
  )
}
