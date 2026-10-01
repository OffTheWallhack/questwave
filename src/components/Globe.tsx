import { useEffect, useRef } from 'react'
import { LAND } from '../lib/land'

export interface Ping {
  id: string
  lat: number
  lon: number
  color: string
  born: number
}

interface Props {
  size: number
  pings?: Ping[]
  mine?: { lat: number; lon: number } | null
  speed?: number
  /** náklon a natočenie v stupňoch — na grafiky, kde má byť konkrétne miesto v strede */
  tiltDeg?: number
  startLon?: number
  /** veľkosť vlastnej bodky */
  mineScale?: number
}

const RAD = Math.PI / 180
const TILT = -18 * RAD
const PING_LIFE = 2600

const reduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Ortografický bodkový glóbus v canvase. Žiadne knižnice, ~2 200 bodov pevniny.
 * Pingy = ľudia, ktorí quest práve splnili. `mine` = tvoja vlastná bodka.
 */
export default function Globe({ size, pings = [], mine = null, speed = 1, tiltDeg, startLon, mineScale = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pingsRef = useRef<Ping[]>(pings)
  const mineRef = useRef(mine)

  pingsRef.current = pings
  mineRef.current = mine

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Nízke rozlíšenie + pixelated = glóbus z pixelov
    const P = 3
    canvas.width = Math.ceil(size / P)
    canvas.height = Math.ceil(size / P)
    ctx.imageSmoothingEnabled = false
    ctx.scale(1 / P, 1 / P)

    const R = size * 0.43
    const cx = size / 2
    const cy = size / 2
    const T = tiltDeg !== undefined ? tiltDeg * RAD : TILT
    const sinT = Math.sin(T)
    const cosT = Math.cos(T)

    // Predpočítané body pevniny v radiánoch
    const n = LAND.length / 2
    const lat = new Float32Array(n)
    const lon = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      lat[i] = (LAND[i * 2] / 10) * RAD
      lon[i] = (LAND[i * 2 + 1] / 10) * RAD
    }

    let rot = (startLon !== undefined ? -startLon : -20) * RAD
    let raf = 0
    let last = performance.now()

    function project(la: number, lo: number) {
      const cl = Math.cos(la)
      const x = cl * Math.sin(lo + rot)
      const y0 = Math.sin(la)
      const z0 = cl * Math.cos(lo + rot)
      const y = y0 * cosT - z0 * sinT
      const z = y0 * sinT + z0 * cosT
      return { x: cx + x * R, y: cy - y * R, z }
    }

    function frame(now: number) {
      const dt = now - last
      last = now
      if (!reduced) rot += dt * 0.00006 * speed

      ctx!.clearRect(0, 0, size, size)

      // Atmosféra — dúhový lem, ktorý dýcha
      const halo = ctx!.createRadialGradient(cx, cy, R * 0.99, cx, cy, R * 1.25)
      halo.addColorStop(0, 'rgba(18,14,32,0.9)')
      halo.addColorStop(0.08, 'rgba(18,14,32,0.9)')
      halo.addColorStop(0.1, 'rgba(31,162,255,0.35)')
      halo.addColorStop(1, 'rgba(31,162,255,0)')
      ctx!.fillStyle = halo
      ctx!.beginPath()
      ctx!.arc(cx, cy, R * 1.25, 0, Math.PI * 2)
      ctx!.fill()

      // Telo planéty
      const body = ctx!.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R)
      body.addColorStop(0, '#2E4A8A')
      body.addColorStop(0.6, '#1D2A5C')
      body.addColorStop(1, '#141A3D')
      ctx!.fillStyle = body
      ctx!.beginPath()
      ctx!.arc(cx, cy, R, 0, Math.PI * 2)
      ctx!.fill()

      // Pevnina
      for (let i = 0; i < n; i++) {
        const p = project(lat[i], lon[i])
        if (p.z <= 0.02) continue
        ctx!.fillStyle = p.z > 0.55 ? '#FFF8EA' : p.z > 0.25 ? '#B5AECB' : '#6E6590'
        ctx!.fillRect(Math.round(p.x / P) * P, Math.round(p.y / P) * P, P, P)
      }

      // Pingy ľudí
      for (const ping of pingsRef.current) {
        const age = now - ping.born
        if (age > PING_LIFE || age < 0) continue
        const p = project(ping.lat * RAD, ping.lon * RAD)
        if (p.z <= 0) continue
        const t = age / PING_LIFE
        ctx!.strokeStyle = ping.color
        ctx!.globalAlpha = (1 - t) * 0.9 * p.z
        ctx!.lineWidth = P
        const rr = Math.round((4 + t * 20) / P) * P
        ctx!.strokeRect(p.x - rr, p.y - rr, rr * 2, rr * 2)
        ctx!.globalAlpha = Math.min(1, (1 - t) * 1.6) * p.z
        ctx!.fillStyle = ping.color
        ctx!.fillRect(p.x - P * 1.5, p.y - P * 1.5, P * 3, P * 3)
        ctx!.globalAlpha = 1
      }

      // Tvoja bodka — trvalá
      const m = mineRef.current
      if (m) {
        const p = project(m.lat * RAD, m.lon * RAD)
        if (p.z > 0) {
          const pulse = (Math.sin(now / 420) + 1) / 2
          ctx!.globalAlpha = p.z
          ctx!.strokeStyle = '#FFD400'
          ctx!.lineWidth = P
          const rr = Math.round(((8 + pulse * 6) * mineScale) / P) * P
          ctx!.strokeRect(p.x - rr, p.y - rr, rr * 2, rr * 2)
          ctx!.fillStyle = '#FFD400'
          const ds = Math.round(2 * mineScale) * P
          ctx!.fillRect(p.x - ds, p.y - ds, ds * 2, ds * 2)
          ctx!.globalAlpha = 1
        }
      }

      // Svetelný odlesk zhora
      const shine = ctx!.createLinearGradient(cx, cy - R, cx, cy + R)
      shine.addColorStop(0, 'rgba(255,255,255,0.06)')
      shine.addColorStop(0.5, 'rgba(255,255,255,0)')
      ctx!.fillStyle = shine
      ctx!.beginPath()
      ctx!.arc(cx, cy, R, 0, Math.PI * 2)
      ctx!.fill()

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [size, speed, tiltDeg, startLon, mineScale])

  return (
    <canvas
      ref={canvasRef}
      className="pixel"
      style={{ width: size, height: size }}
      aria-label="Glóbus s ľuďmi, ktorí dnešný quest splnili"
      role="img"
    />
  )
}
