import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OWNER } from '../lib/owner'
import Globe from '../components/Globe'
import { useSession } from '../lib/session'
import { DEMO, supabase } from '../lib/supabase'
import { useLivePings } from '../lib/world'
import { BRAND } from '../lib/brand'

/** Tlačidlo Google sa ukáže, až keď je v Supabase zapnutý Google (VITE_GOOGLE=1). */
const GOOGLE = import.meta.env.VITE_GOOGLE === '1'

const COPY = {
  sk: {
    h: ['Jeden quest.', 'Celý svet.', 'Každý deň.'],
    p: 'Každý deň dostane celá planéta tú istú úlohu. Splníš ju, pridáš dôkaz a tvoja bodka sa rozsvieti na mape.',
    email: 'Tvoj e-mail',
    demo: 'Pokračovať v deme',
    google: 'Pokračovať cez Google',
    or: 'alebo e-mailom',
    password: 'Heslo (aspoň 6 znakov)',
    signup: 'Vytvoriť účet',
    signin: 'Prihlásiť sa',
    toSignin: 'Už máš účet? Prihlás sa',
    toSignup: 'Nemáš účet? Vytvor si ho',
    badLogin: 'E-mail alebo heslo nesedí.',
    exists: 'Tento e-mail už má účet. Prihlás sa.',
    confirm: 'Skontroluj e-mail a potvrď registráciu.',
    weak: 'Heslo musí mať aspoň 6 znakov.',
  },
  en: {
    h: ['One quest.', 'The whole world.', 'Every day.'],
    p: 'Every day the whole planet gets the same task. Do it, add proof, and your dot lights up on the map.',
    email: 'Your email',
    demo: 'Continue in demo',
    google: 'Continue with Google',
    or: 'or with email',
    password: 'Password (at least 6 characters)',
    signup: 'Create account',
    signin: 'Sign in',
    toSignin: 'Already have an account? Sign in',
    toSignup: 'No account? Create one',
    badLogin: 'Wrong email or password.',
    exists: 'This email already has an account. Sign in.',
    confirm: 'Check your email and confirm your sign-up.',
    weak: 'Password must be at least 6 characters.',
  },
}

export default function SignIn() {
  const { lang } = useSession()
  const c = COPY[lang]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { pings } = useLivePings(0)
  const size = Math.min(innerWidth, 448)

  async function demo() {
    await supabase.auth.signInWithOtp({ email: 'demo@questwave.app' })
  }

  async function submit() {
    setBusy(true)
    setError(null)
    const creds = { email: email.trim(), password }
    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp(creds)
      setBusy(false)
      if (err) {
        if (/already|registered|exists/i.test(err.message)) {
          setMode('signin')
          setError(c.exists)
        } else if (/password/i.test(err.message)) setError(c.weak)
        else setError(err.message)
      } else if (!data.session) setError(c.confirm)
    } else {
      const { error: err } = await supabase.auth.signInWithPassword(creds)
      setBusy(false)
      if (err) setError(c.badLogin)
    }
  }

  async function google() {
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href.split('#')[0] },
    })
    if (err) {
      setBusy(false)
      setError(err.message)
    }
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
          {DEMO ? (
            <>
              <GoogleButton label={c.google} onClick={google} disabled={busy} />
              <button className="btn btn-iri w-full" onClick={demo}>
                {c.demo}
              </button>
            </>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              {GOOGLE && (
                <>
                  <GoogleButton label={c.google} onClick={google} disabled={busy} />
                  <p className="pt-1 text-center text-[18px] text-fog">{c.or}</p>
                </>
              )}
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
              <input
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={c.password}
                className="panel h-14 w-full rounded-[12px] px-5 text-[24px] outline-none placeholder:text-fog"
              />
              <button type="submit" className="btn btn-iri w-full" disabled={!email.includes('@') || password.length < 6 || busy}>
                {mode === 'signup' ? c.signup : c.signin}
              </button>
              <button
                type="button"
                className="w-full py-1 text-[20px] text-fog underline"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup')
                  setError(null)
                }}
              >
                {mode === 'signup' ? c.toSignin : c.toSignup}
              </button>
            </form>
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
