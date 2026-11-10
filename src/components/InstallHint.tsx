import { Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getFlag, setFlag } from '../lib/prefs'
import type { Lang } from '../lib/types'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
}

const standalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Jemná nápoveda „pridaj na plochu" — len v prehliadači, nikdy v už nainštalovanej appke. */
export default function InstallHint({ lang }: { lang: Lang }) {
  const [hidden, setHidden] = useState(() => getFlag('install-dismissed'))
  const [evt, setEvt] = useState<InstallEvent | null>(null)

  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault()
      setEvt(e as InstallEvent)
    }
    window.addEventListener('beforeinstallprompt', on)
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])

  if (hidden || standalone()) return null
  const ios = isIos()
  if (!ios && !evt) return null // na počítači alebo v prehliadači bez inštalácie nič neukazujeme

  const close = () => {
    setFlag('install-dismissed', true)
    setHidden(true)
  }

  return (
    <section className="px-3 pt-4">
      <div className="panel relative rounded-[12px] p-4 pr-10">
        <button aria-label={lang === 'sk' ? 'Zavrieť' : 'Close'} className="absolute right-2 top-2 p-2 text-fog" onClick={close}>
          <X size={18} />
        </button>
        <p className="display-md text-[28px] leading-none">{lang === 'sk' ? 'Daj si to na plochu' : 'Add it to your home screen'}</p>
        {ios ? (
          <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[20px] leading-tight text-fog">
            {lang === 'sk' ? 'Ťukni na' : 'Tap'} <Share size={17} className="text-chips" />{' '}
            {lang === 'sk' ? 'a vyber „Pridať na plochu". Otvorí sa ako appka, na celú obrazovku.' : 'then "Add to Home Screen". It opens like an app, full screen.'}
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-[20px] leading-tight text-fog">
              {lang === 'sk' ? 'Otvorí sa ako appka, na celú obrazovku — bez hľadania v prehliadači.' : 'Opens like an app, full screen — no digging through the browser.'}
            </p>
            <button
              className="btn btn-blue mt-3 w-full"
              onClick={async () => {
                await evt?.prompt()
                close()
              }}
            >
              {lang === 'sk' ? 'Pridať' : 'Add'}
            </button>
          </>
        )}
      </div>
    </section>
  )
}
