import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LOCAL } from '../lib/supabase'
import type { Lang } from '../lib/types'

/** Keď telefón stratí internet, povieme to — namiesto ticho nefungujúcich tlačidiel. V beta režime bez servera netreba. */
export default function OfflineBanner({ lang }: { lang: Lang }) {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    addEventListener('online', up)
    addEventListener('offline', down)
    return () => {
      removeEventListener('online', up)
      removeEventListener('offline', down)
    }
  }, [])
  if (online || LOCAL) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[80] flex items-center justify-center gap-2 bg-mult px-3 pb-1 text-[19px] leading-none text-chalk"
      style={{ paddingTop: 'calc(var(--safe-top) + 6px)' }}
    >
      <WifiOff size={16} /> {lang === 'sk' ? 'Si offline. Na splnenie questu potrebuješ pripojenie.' : 'You are offline. Completing a quest needs a connection.'}
    </div>
  )
}
