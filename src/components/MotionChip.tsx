import { AnimatePresence, motion } from 'framer-motion'
import { Check, Smartphone, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from '../lib/session'
import { onMotionStatus, requestMotion, type MotionStatus } from '../lib/tilt'

const COPY = {
  sk: {
    ask: 'Zapnúť náklon karty',
    waiting: 'Zapínam gyroskop…',
    live: 'Nakloň telefón',
    denied: 'Povolenie bolo odmietnuté. Obnov stránku a pri otázke daj Povoliť.',
    nodata: 'Toto okno gyroskop nepúšťa. Otvor odkaz priamo v Safari — v hotovej appke to pôjde vždy.',
  },
  en: {
    ask: 'Turn on card tilt',
    waiting: 'Starting gyroscope…',
    live: 'Tilt your phone',
    denied: 'Permission was denied. Reload the page and tap Allow.',
    nodata: 'This window blocks the gyroscope. Open the link directly in Safari — the real app always has it.',
  },
}

const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

/** Malý ovládač pod kartou: zapne gyroskop a úprimne povie, keď nejde. */
export default function MotionChip() {
  const { lang } = useSession()
  const c = COPY[lang]
  const [status, setStatus] = useState<MotionStatus>('idle')
  const [showLive, setShowLive] = useState(true)

  useEffect(() => onMotionStatus(setStatus), [])
  useEffect(() => {
    if (status !== 'live') return
    const t = setTimeout(() => setShowLive(false), 2500)
    return () => clearTimeout(t)
  }, [status])

  if (!touch || status === 'unsupported') return null

  let body: React.ReactNode = null
  if (status === 'idle' || status === 'needs-tap') {
    body = (
      <button
        type="button"
        onClick={requestMotion}
        className="glass inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium"
      >
        <Smartphone size={16} /> {c.ask}
      </button>
    )
  } else if (status === 'waiting') {
    body = <p className="text-sm text-fog">{c.waiting}</p>
  } else if (status === 'live') {
    body = showLive ? (
      <p className="inline-flex items-center gap-2 text-sm text-chalk/80">
        <Check size={16} className="text-[#39FF7A]" /> {c.live}
      </p>
    ) : null
  } else {
    body = (
      <p className="inline-flex max-w-[34ch] items-start gap-2 text-left text-[18px] leading-snug text-fog">
        <TriangleAlert size={15} className="mt-0.5 shrink-0 text-[#FFD400]" />
        {status === 'denied' ? c.denied : c.nodata}
      </p>
    )
  }

  return (
    <div className="flex min-h-10 justify-center">
      <AnimatePresence mode="wait">
        {body && (
          <motion.div key={status + String(showLive)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {body}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
