import { shade } from '../components/Swirl'
import { renderPixelArt } from './pixelArt'
import { levelFromXp, titleForLevel } from './progress'
import { identity } from './gangs'
import type { Lang, Profile } from './types'
import { BRAND } from './brand'

const FONT = '"Jersey 10", monospace'

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.beginPath()
  ctx.roundRect(x, y + 10, w, h, r)
  ctx.fill()
  ctx.fillStyle = '#120E20'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.roundRect(x + 8, y + 8, w - 16, h - 16, Math.max(0, r - 6))
  ctx.fill()
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  color = '#FFF8EA',
  align: CanvasTextAlign = 'left',
  maxW = Infinity,
) {
  ctx.font = `${size}px ${FONT}`
  // dlhý text sa zmenší, aby nevyliezol z karty
  while (size > 12 && ctx.measureText(s).width > maxW) {
    size -= 2
    ctx.font = `${size}px ${FONT}`
  }
  ctx.textAlign = align
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillText(s, x + size * 0.07, y + size * 0.07)
  ctx.fillStyle = color
  ctx.fillText(s, x, y)
}

/** Flex Card na Instagram stories (1080×1920) — rovnaká karta ako v appke. */
export async function renderFlexCard(profile: Profile, lang: Lang, memberNo: string): Promise<string | null> {
  await document.fonts?.load(`40px ${FONT}`)
  const W = 1080
  const H = 1920
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingEnabled = false

  const id = identity(profile, lang)
  const color = id.color
  const bg = shade(color, 0.22)
  const gang = id.name
  const { level } = levelFromXp(profile.xp)

  // pozadie: pixelové pruhy
  ctx.fillStyle = '#1B1530'
  ctx.fillRect(0, 0, W, H)
  for (let y = 0; y < H; y += 24) {
    ctx.fillStyle = y % 48 ? '#221A3D' : '#1B1530'
    ctx.fillRect(0, y, W, 24)
  }

  // karta: krémový rám + kresba gangu
  const cx = 150
  const cy = 170
  const cw = W - 300
  const ch = Math.round(cw * 1.4)
  box(ctx, cx, cy, cw, ch, 40, '#F2E8D5')
  const ix = cx + 30
  const iy = cy + 30
  const iw = cw - 60
  const ih = ch - 60
  ctx.fillStyle = '#120E20'
  ctx.beginPath()
  ctx.roundRect(ix - 8, iy - 8, iw + 16, ih + 16, 22)
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(ix, iy, iw, ih, 16)
  ctx.clip()
  ctx.fillStyle = bg
  ctx.fillRect(ix, iy, iw, ih)
  const art = await renderPixelArt({ seed: profile.id + (profile.gang ?? 'world'), mood: id.mood, env: id.env, color, bg, tier: 3 }, 90, 126)
  ctx.drawImage(art, ix, iy, iw, ih)
  ctx.fillStyle = 'rgba(18,14,32,0.78)'
  ctx.fillRect(ix, iy + ih - 330, iw, 330)
  ctx.restore()

  // štítok gangu
  box(ctx, ix + 24, iy + 24, 300, 96, 18, color)
  text(ctx, gang, ix + 174, iy + 92, 62, '#120E20', 'center')
  text(ctx, '#' + memberNo, ix + iw - 28, iy + 88, 56, '#FFF8EA', 'right')

  text(ctx, profile.username, ix + 36, iy + ih - 210, 150)
  text(ctx, titleForLevel(level, lang), ix + 40, iy + ih - 150, 60, '#B5AECB')
  box(ctx, ix + 30, iy + ih - 120, 190, 96, 16, '#FF7A1A')
  text(ctx, '🔥 ' + profile.streak_current, ix + 125, iy + ih - 50, 64, '#FFF8EA', 'center')
  text(ctx, (lang === 'sk' ? 'Úr. ' : 'Lv. ') + level, ix + iw / 2 + 20, iy + ih - 50, 64, '#FFF8EA', 'center')
  box(ctx, ix + iw - 290, iy + ih - 120, 260, 96, 16, '#FF4B4B')
  text(ctx, profile.xp + ' XP', ix + iw - 160, iy + ih - 50, 64, '#FFF8EA', 'center')

  // podpis
  text(ctx, BRAND.wordmark, W / 2, H - 260, 150, '#FFB21E', 'center')
  text(ctx, BRAND.tagline, W / 2, H - 200, 56, '#B5AECB', 'center')
  text(ctx, lang === 'sk' ? 'Jeden quest. Celý svet. Každý deň.' : 'One quest. The whole world. Every day.', W / 2, H - 120, 56, '#FFF8EA', 'center')

  return cv.toDataURL('image/png')
}

function wrap(ctx: CanvasRenderingContext2D, s: string, maxW: number, size: number) {
  ctx.font = `${size}px ${FONT}`
  const lines: string[] = []
  let line = ''
  for (const word of s.split(/\s+/)) {
    const next = line ? line + ' ' + word : word
    if (line && ctx.measureText(next).width > maxW) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export interface StoryArgs {
  /** napr. "Svetový quest #35" */
  label: string
  title: string
  proofUrl: string | null
  streak: number | null
  city: string
  username: string
  lang: Lang
}

/** Karta splneného questu na Instagram stories (1080×1920): dôkaz v ráme, quest, séria a mesto. */
export async function renderStoryCard(a: StoryArgs): Promise<string | null> {
  await document.fonts?.load(`40px ${FONT}`)
  const W = 1080
  const H = 1920
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#1B1530'
  ctx.fillRect(0, 0, W, H)
  for (let y = 0; y < H; y += 24) {
    ctx.fillStyle = y % 48 ? '#221A3D' : '#1B1530'
    ctx.fillRect(0, y, W, 24)
  }

  text(ctx, BRAND.wordmark, W / 2, 190, 130, '#FFB21E', 'center', W - 100)

  // dôkaz v krémovom ráme
  const cx = 110
  const cy = 260
  const cw = W - 220
  const ch = 1060
  box(ctx, cx, cy, cw, ch, 40, '#F2E8D5')
  const ix = cx + 30
  const iy = cy + 30
  const iw = cw - 60
  const ih = ch - 60
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(ix, iy, iw, ih, 16)
  ctx.clip()
  const img = a.proofUrl ? await loadImage(a.proofUrl) : null
  if (img) {
    const scale = Math.max(iw / img.width, ih / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, ix + (iw - w) / 2, iy + (ih - h) / 2, w, h)
  } else {
    ctx.imageSmoothingEnabled = false
    const art = await renderPixelArt({ seed: a.title, mood: 'pomoc', env: 'hocikde', color: '#FFB21E', bg: '#3A2466', tier: 3 }, 90, 126)
    ctx.drawImage(art, ix, iy, iw, ih)
    ctx.imageSmoothingEnabled = true
  }
  // názov questu na tmavom páse dole
  const lines = wrap(ctx, a.title, iw - 80, 110).slice(0, 3)
  const band = 120 + lines.length * 100
  ctx.fillStyle = 'rgba(18,14,32,0.82)'
  ctx.fillRect(ix, iy + ih - band, iw, band)
  ctx.restore()
  text(ctx, a.label, ix + 40, iy + ih - band + 80, 62, '#FFB21E')
  lines.forEach((l, i) => text(ctx, l, ix + 40, iy + ih - band + 180 + i * 100, 110, '#FFF8EA', 'left', iw - 80))

  // pečiatka SPLNENÉ
  ctx.save()
  ctx.translate(cx + cw - 150, cy + 120)
  ctx.rotate(0.18)
  box(ctx, -150, -60, 300, 120, 18, '#3FCB8A')
  text(ctx, a.lang === 'sk' ? 'SPLNENÉ' : 'DONE', 0, 30, 84, '#120E20', 'center', 250)
  ctx.restore()

  // séria + mesto
  const by = cy + ch + 60
  if (a.streak) {
    box(ctx, cx, by, 420, 130, 22, '#FF7A1A')
    text(ctx, '🔥 ' + a.streak + (a.lang === 'sk' ? ' dní' : ' days'), cx + 210, by + 92, 76, '#FFF8EA', 'center')
  }
  text(ctx, '@' + a.username, a.streak ? cx + 470 : cx, by + 62, 64, '#FFF8EA')
  text(ctx, '📍 ' + a.city, a.streak ? cx + 470 : cx, by + 122, 56, '#B5AECB')

  text(ctx, a.lang === 'sk' ? 'Jeden quest. Celý svet. Každý deň.' : 'One quest. The whole world. Every day.', W / 2, H - 170, 62, '#FFF8EA', 'center', W - 100)
  text(ctx, location.host + import.meta.env.BASE_URL.replace(/\/$/, ''), W / 2, H - 95, 52, '#B5AECB', 'center')

  return cv.toDataURL('image/png')
}
