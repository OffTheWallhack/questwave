import { Pause, Play } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ProofKind } from '../lib/types'

/** Deterministická vlnovka pre hlasovku — z URL, aby bola vždy rovnaká. */
function bars(seed: string, n = 42) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0
    const env = Math.sin((i / n) * Math.PI) * 0.7 + 0.3
    return 0.18 + ((h % 1000) / 1000) * 0.82 * env
  })
}

export default function ProofMedia({
  url,
  type,
  color,
  className = '',
}: {
  url: string
  type: ProofKind
  color: string
  className?: string
}) {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  if (type === 'photo') return <img src={url} alt="" className={'w-full object-cover ' + className} />
  if (type === 'video') return <video src={url} controls playsInline className={'w-full object-cover ' + className} />

  const b = bars(url)
  return (
    <div className={'flex items-center gap-4 bg-white/[0.04] px-5 py-6 ' + className}>
      <audio ref={audio} src={url} onEnded={() => setPlaying(false)} />
      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={() => {
          if (!audio.current) return
          if (playing) audio.current.pause()
          else audio.current.play().catch(() => {})
          setPlaying(!playing)
        }}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
        style={{ background: color, color: '#0F0F13' }}
      >
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex h-12 flex-1 items-center gap-[3px]">
        {b.map((v, i) => (
          <span key={i} className="flex-1 rounded-full" style={{ height: `${v * 100}%`, background: color, opacity: 0.55 }} />
        ))}
      </div>
    </div>
  )
}
