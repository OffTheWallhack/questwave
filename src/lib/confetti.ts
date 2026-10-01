/** Jednorazový výbuch konfiet z bodu (x, y) vo farbách gangov. */
export function burst(x: number, y: number, colors: string[], count = 36, spread = 1) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '70',
  })
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2
    const v = (2 + Math.random() * 6) * spread
    return {
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 3 * spread,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      w: 4 + Math.random() * 5,
      h: 7 + Math.random() * 7,
      c: colors[Math.floor(Math.random() * colors.length)],
    }
  })

  const start = performance.now()
  function tick(now: number) {
    const t = now - start
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    for (const p of parts) {
      p.vy += 0.22
      p.vx *= 0.985
      p.x += p.vx
      p.y += p.vy
      p.r += p.vr
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r)
      ctx.globalAlpha = Math.max(0, 1 - t / 1400)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    if (t < 1400) requestAnimationFrame(tick)
    else canvas.remove()
  }
  requestAnimationFrame(tick)
}

export const ALL_GANG_COLORS = ['#39FF7A', '#FFD400', '#FF7A1A', '#B26BFF', '#F3F1EA']

export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* niektoré prehliadače to nepodporujú */
  }
}
