import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import type { Tier } from '../lib/cardArt'
import { enableMotion, readTilt } from '../lib/tilt'

interface Props {
  tier: Tier
  color: string
  seed: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

function seeded(seed: string) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return () => {
    h = (h * 1103515245 + 12345) >>> 0
    return (h % 10000) / 10000
  }
}

/**
 * Holografická karta.
 *  - Na telefóne sa nakláňa podľa toho, ako držíš telefón (gyroskop). Prst s ňou nehýbe,
 *    takže sa dá normálne scrollovať a nič sa neoznačuje.
 *  - Na počítači sa nakláňa podľa myši.
 *  - Keď gyroskop nie je k dispozícii, karta sa pomaly pohupuje sama (aj pri zapnutom Obmedziť pohyb).
 * Úrovne: 1 bežná, 2 vzácna, 3 ultra vzácna.
 */
export default function Holo({ tier, color, seed, className = '', style, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mouse = useRef<{ x: number; y: number } | null>(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const sx = useSpring(mx, { stiffness: 120, damping: 20 })
  const sy = useSpring(my, { stiffness: 120, damping: 20 })
  const rotY = useTransform(sx, [0, 1], [11, -11])
  const rotX = useTransform(sy, [0, 1], [-9, 9])

  const phase = useMemo(() => seeded(seed)() * Math.PI * 2, [seed])

  const sparks = useMemo(() => {
    const r = seeded(seed)
    const n = tier === 3 ? 14 : tier === 2 ? 7 : 0
    return Array.from({ length: n }, () => ({
      x: 6 + r() * 88,
      y: 6 + r() * 88,
      s: 7 + r() * (tier === 3 ? 11 : 7),
      d: r() * 4,
    }))
  }, [seed, tier])

  useEffect(() => {
    enableMotion()
    let raf = 0
    const tick = (t: number) => {
      const el = ref.current
      let x = 0.5
      let y = 0.5
      if (mouse.current) {
        x = mouse.current.x
        y = mouse.current.y
      } else {
        const tilt = readTilt()
        if (tilt.live) {
          x = tilt.x
          y = tilt.y
        } else {
          // bez gyroskopu: pomalé pohupovanie, aby karta žila.
          // Zámerne ignoruje "Obmedziť pohyb" — karta je jemný efekt, nie animácia cez celú obrazovku.
          x = 0.5 + Math.sin(t / 2400 + phase) * 0.22
          y = 0.5 + Math.cos(t / 3100 + phase) * 0.16
        }
      }
      mx.set(x)
      my.set(y)
      if (el) {
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mx, my, phase])

  // myš len na počítači — dotyk kartou nehýbe
  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    mouse.current = {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    }
  }

  return (
    <div className="[perspective:1300px]">
      <motion.div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={() => (mouse.current = null)}
        data-tier={tier}
        data-active="1"
        className={'holo relative select-none overflow-hidden ' + (tier === 3 ? 'iri-border ' : '') + className}
        style={{ ...style, rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', ['--c' as string]: color }}
      >
        {children}

        <div className="holo-lines pointer-events-none absolute inset-0" />
        <div className="holo-rainbow pointer-events-none absolute inset-0" />
        {tier === 3 && <div className="holo-glitter pointer-events-none absolute inset-0" />}
        <div className="holo-sheen pointer-events-none absolute inset-0" />

        {sparks.map((p, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="holo-spark pointer-events-none absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDelay: `${p.d}s` }}
          >
            <path d="M12 0 C12.8 8 16 11.2 24 12 C16 12.8 12.8 16 12 24 C11.2 16 8 12.8 0 12 C8 11.2 11.2 8 12 0 Z" fill="white" />
          </svg>
        ))}
      </motion.div>
    </div>
  )
}
