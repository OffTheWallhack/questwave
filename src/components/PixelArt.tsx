import { useEffect, useRef } from 'react'
import type { Tier } from '../lib/cardArt'
import { renderPixelArt } from '../lib/pixelArt'

interface Props {
  seed: string
  mood: string
  env: string
  color: string
  bg: string
  tier: Tier
  /** rozlíšenie v "pixeloch" — menej = hrubšie pixely */
  pw?: number
  ph?: number
  className?: string
}

/** Kresba karty ako pixel art (malý canvas zväčšený bez vyhladzovania). */
export default function PixelArt({ seed, mood, env, color, bg, tier, pw = 90, ph = 126, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) renderPixelArt({ seed, mood, env, color, bg, tier }, pw, ph, ref.current)
  }, [seed, mood, env, color, bg, tier, pw, ph])
  return <canvas ref={ref} width={pw} height={ph} className={'pixel pixel-art block h-full w-full ' + className} />
}
