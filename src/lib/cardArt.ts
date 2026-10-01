// Generatívny artwork pre karty questov.
// Každá nálada má vlastný výtvarný jazyk, prostredie pridáva motív pri spodnom okraji.
// Kresba je z ID questu — rovnaký quest má vždy rovnakú kresbu, dva questy nikdy.

export type Tier = 1 | 2 | 3

let W = 320
let H = 220
const IRI = ['#39FF7A', '#FFD400', '#FF7A1A', '#B26BFF', '#39FF7A']

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number) => n.toFixed(1)

// ---------- výtvarné jazyky nálad ----------

function adrenalin(r: () => number) {
  let out = ''
  // oblúky pohybu mimo karty vpravo
  const cx = W + 40
  const cy = 40 + r() * 80
  for (let i = 0; i < 6; i++) {
    const rad = 90 + i * 26
    out += `<circle cx="${cx}" cy="${f(cy)}" r="${rad}" stroke-dasharray="${f(30 + r() * 90)} ${f(10 + r() * 30)}" opacity="${f(0.35 + i * 0.08)}"/>`
  }
  // rýchlostné čiary
  const ang = (-16 * Math.PI) / 180
  for (let i = 0; i < 18; i++) {
    const y = r() * H
    const x = -40 + r() * W
    const len = 30 + r() * 150
    out += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + Math.cos(ang) * len)}" y2="${f(y + Math.sin(ang) * len)}" stroke-width="${f(0.8 + r() * 1.4)}" stroke-linecap="round"/>`
  }
  // blesk
  let x = 40 + r() * 60
  let y = 20
  let d = `M${f(x)} ${y}`
  const steps = 4
  for (let i = 0; i < steps; i++) {
    x += (i % 2 ? -1 : 1) * (26 + r() * 30)
    y += (H - 60) / steps
    d += ` L${f(x)} ${f(y)}`
  }
  out += `<path d="${d}" stroke-width="2.4" stroke-linejoin="round"/>`
  return out
}

function pomoc(r: () => number) {
  let out = ''
  const cx = 160 + (r() - 0.5) * 60
  const cy = H + 20
  // lúče ako vychádzajúce slnko
  for (let i = 0; i < 26; i++) {
    const a = Math.PI + (i / 25) * Math.PI
    const r1 = 70
    const r2 = 150 + r() * 70
    out += `<line x1="${f(cx + Math.cos(a) * r1)}" y1="${f(cy + Math.sin(a) * r1)}" x2="${f(cx + Math.cos(a) * r2)}" y2="${f(cy + Math.sin(a) * r2)}" stroke-width="${i % 3 ? 0.8 : 1.6}" opacity="${i % 3 ? 0.5 : 0.9}"/>`
  }
  out += `<circle cx="${f(cx)}" cy="${cy}" r="62" stroke-width="1.6"/>`
  // prepojené kruhy — ľudia, ktorí sa stretli
  const ry = 70 + r() * 30
  const rr = 30 + r() * 10
  const n = 2 + Math.floor(r() * 2)
  for (let i = 0; i < n; i++) {
    out += `<circle cx="${f(cx - (n - 1) * 20 + i * 40)}" cy="${f(ry)}" r="${f(rr)}" stroke-width="1.5"/>`
  }
  // drobné bodky
  for (let i = 0; i < 16; i++) {
    out += `<circle cx="${f(r() * W)}" cy="${f(r() * H * 0.7)}" r="${f(0.8 + r() * 1.6)}" fill="currentColor" stroke="none" opacity="${f(0.3 + r() * 0.5)}"/>`
  }
  return out
}

function nuda(r: () => number) {
  let out = ''
  // jemná bodková mriežka
  for (let gx = 12; gx < W; gx += 22) {
    for (let gy = 12; gy < H; gy += 22) {
      out += `<circle cx="${gx}" cy="${gy}" r="0.9" fill="currentColor" stroke="none" opacity=".35"/>`
    }
  }
  // rozhádzané tvary
  for (let i = 0; i < 13; i++) {
    const x = 20 + r() * (W - 40)
    const y = 20 + r() * (H - 40)
    const s = 8 + r() * 20
    const rot = Math.floor(r() * 360)
    const k = Math.floor(r() * 6)
    const tr = `transform="rotate(${rot} ${f(x)} ${f(y)})"`
    if (k === 0) out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 0.6)}" stroke-width="1.5"/>`
    else if (k === 1) out += `<rect x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${f(s)}" height="${f(s)}" rx="2" ${tr} stroke-width="1.5"/>`
    else if (k === 2) out += `<path d="M${f(x)} ${f(y - s * 0.6)} L${f(x + s * 0.6)} ${f(y + s * 0.5)} L${f(x - s * 0.6)} ${f(y + s * 0.5)} Z" ${tr} stroke-width="1.5" stroke-linejoin="round"/>`
    else if (k === 3) out += `<path d="M${f(x - s / 2)} ${f(y)} H${f(x + s / 2)} M${f(x)} ${f(y - s / 2)} V${f(y + s / 2)}" ${tr} stroke-width="1.8" stroke-linecap="round"/>`
    else if (k === 4) {
      let d = `M${f(x - s)} ${f(y)}`
      for (let j = 1; j <= 4; j++) d += ` Q${f(x - s + (j - 0.5) * (s / 2))} ${f(y + (j % 2 ? -1 : 1) * s * 0.45)} ${f(x - s + j * (s / 2))} ${f(y)}`
      out += `<path d="${d}" ${tr} stroke-width="1.6" stroke-linecap="round"/>`
    } else {
      // kocka — hodiť si a nechať to na náhode
      out += `<g ${tr}><rect x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${f(s)}" height="${f(s)}" rx="${f(s * 0.2)}" stroke-width="1.5"/><circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="currentColor" stroke="none"/><circle cx="${f(x - s * 0.25)}" cy="${f(y - s * 0.25)}" r="1.6" fill="currentColor" stroke="none"/><circle cx="${f(x + s * 0.25)}" cy="${f(y + s * 0.25)}" r="1.6" fill="currentColor" stroke="none"/></g>`
    }
  }
  return out
}

function cakanie(r: () => number) {
  let out = ''
  const cx = 200 + r() * 60
  const cy = 70 + r() * 40
  // kruhy času
  for (let i = 0; i < 7; i++) {
    const rad = 18 + i * 17
    const c = 2 * Math.PI * rad
    const part = 0.35 + r() * 0.6
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${rad}" stroke-dasharray="${f(c * part)} ${f(c)}" transform="rotate(${Math.floor(r() * 360)} ${f(cx)} ${f(cy)})" stroke-width="${i % 2 ? 0.9 : 1.5}"/>`
  }
  // ciferník
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    const r1 = 142
    const r2 = i % 5 ? 147 : 154
    out += `<line x1="${f(cx + Math.cos(a) * r1)}" y1="${f(cy + Math.sin(a) * r1)}" x2="${f(cx + Math.cos(a) * r2)}" y2="${f(cy + Math.sin(a) * r2)}" stroke-width="${i % 5 ? 0.7 : 1.4}"/>`
  }
  // ručičky
  const h1 = r() * Math.PI * 2
  const h2 = r() * Math.PI * 2
  out += `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(cx + Math.cos(h1) * 70)}" y2="${f(cy + Math.sin(h1) * 70)}" stroke-width="2.2" stroke-linecap="round"/>`
  out += `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(cx + Math.cos(h2) * 44)}" y2="${f(cy + Math.sin(h2) * 44)}" stroke-width="2.2" stroke-linecap="round"/>`
  // mesiac
  const mx = 50 + r() * 40
  const my = 50 + r() * 30
  out += `<path d="M${f(mx)} ${f(my - 22)} A22 22 0 1 0 ${f(mx)} ${f(my + 22)} A16 22 0 1 1 ${f(mx)} ${f(my - 22)} Z" stroke-width="1.6"/>`
  // hviezdy
  for (let i = 0; i < 10; i++) {
    const x = r() * 150
    const y = r() * 150
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.7 + r() * 1.3)}" fill="currentColor" stroke="none" opacity="${f(0.4 + r() * 0.6)}"/>`
  }
  return out
}

// ---------- motívy prostredia pri spodnom okraji ----------

function environment(env: string, r: () => number) {
  const base = H - 8
  switch (env) {
    case 'vonku': {
      let d = `M0 ${base}`
      let x = 0
      while (x < W) {
        x += 30 + r() * 40
        d += ` L${f(x - 18)} ${f(base - 30 - r() * 45)} L${f(x)} ${f(base - 8 - r() * 12)}`
      }
      return `<path d="${d}" stroke-width="1.6" stroke-linejoin="round"/>`
    }
    case 'mesto': {
      let d = `M0 ${base}`
      let x = 0
      while (x < W) {
        const w = 14 + r() * 26
        const h = 20 + r() * 60
        d += ` V${f(base - h)} H${f(x + w)} V${base}`
        if (r() > 0.6) d += ` M${f(x + w / 2)} ${f(base - h)} V${f(base - h - 12)} M${f(x + w)} ${base}`
        x += w + 2
        d += ` H${f(x)}`
      }
      return `<path d="${d}" stroke-width="1.3"/>`
    }
    case 'doma': {
      const x = 230 + r() * 40
      return `<path d="M${f(x - 34)} ${base} V${base - 44} L${f(x)} ${base - 72} L${f(x + 34)} ${base - 44} V${base} Z" stroke-width="1.6" stroke-linejoin="round"/>
        <rect x="${f(x - 14)}" y="${base - 38}" width="28" height="24" stroke-width="1.3"/>
        <path d="M${f(x)} ${base - 38} V${base - 14} M${f(x - 14)} ${base - 26} H${f(x + 14)}" stroke-width="1"/>
        <line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke-width="1"/>`
    }
    case 'praca': {
      let out = ''
      for (let i = 0; i < 7; i++)
        for (let j = 0; j < 3; j++)
          out += `<rect x="${16 + i * 22}" y="${base - 66 + j * 22}" width="16" height="16" rx="3" stroke-width="1" ${r() > 0.72 ? 'fill="currentColor" fill-opacity=".45"' : ''}/>`
      return out
    }
    case 'online': {
      const x = 268
      let out = `<circle cx="${x}" cy="${base - 14}" r="4" fill="currentColor" stroke="none"/>`
      for (let i = 1; i <= 4; i++) {
        const rad = i * 16
        out += `<path d="M${f(x - rad * 0.8)} ${f(base - 14 - rad * 0.6)} A${rad} ${rad} 0 0 1 ${f(x + rad * 0.8)} ${f(base - 14 - rad * 0.6)}" stroke-width="1.5" stroke-linecap="round"/>`
      }
      return out
    }
    default: {
      // kdekoľvek — kompasová ružica
      const x = 262
      const y = base - 40
      const s = 30
      return `<path d="M${x} ${y - s} L${x + 6} ${y - 6} L${x + s} ${y} L${x + 6} ${y + 6} L${x} ${y + s} L${x - 6} ${y + 6} L${x - s} ${y} L${x - 6} ${y - 6} Z" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="${x}" cy="${y}" r="${s + 8}" stroke-width="0.9" stroke-dasharray="2 5"/>`
    }
  }
}

const ART: Record<string, (r: () => number) => string> = { adrenalin, pomoc, nuda, cakanie }

interface ArtArgs {
  seed: string
  mood: string
  env: string
  color: string
  tier: Tier
  animate?: boolean
  /** rozmer kresby — na výšku pre celú kartu */
  w?: number
  h?: number
  /** hrubšie čiary, keď sa kresba zmenší na pixely */
  strokeScale?: number
  /** farba pozadia — ak chýba, pozadie je priehľadné */
  bg?: string
}

/** SVG kresba karty ako reťazec — ide do DOM aj do canvasu pre Flex Card. */
export function cardArtSvg({ seed, mood, env, color, tier, animate = true, w = 320, h: hh = 220, strokeScale = 1, bg }: ArtArgs) {
  W = w
  H = hh
  const h = hash(seed)
  const r = rng(h)
  const id = 'f' + h.toString(36)
  const foil = tier > 1
  const stroke = foil ? `url(#${id})` : color
  const opacity = tier === 3 ? 0.9 : tier === 2 ? 0.72 : 0.5

  const stops = IRI.map((c, i) => `<stop offset="${i / (IRI.length - 1)}" stop-color="${i === 0 || i === 4 ? color : c}"/>`).join('')
  const anim = animate
    ? `<animateTransform attributeName="gradientTransform" type="translate" values="-${W} 0; ${W} 0" dur="${tier === 3 ? 5 : 8}s" repeatCount="indefinite"/>`
    : ''

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="${W}" height="${H}" style="color:${color}">
  <defs>
    <linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="${H * 0.6}" spreadMethod="repeat">${stops}${anim}</linearGradient>
    <radialGradient id="${id}g" cx=".72" cy=".25" r=".85"><stop offset="0" stop-color="${color}" stop-opacity=".32"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>
  </defs>
  ${bg ? `<rect width="${W}" height="${H}" fill="${bg}"/>` : ''}
  <rect width="${W}" height="${H}" fill="url(#${id}g)"/>
  <g fill="none" stroke="${stroke}" stroke-width="${strokeScale}" opacity="${opacity}">
    ${(ART[mood] ?? nuda)(r)}
    ${environment(env, r)}
  </g>
</svg>`
  if (strokeScale !== 1) {
    svg = svg.replace(/stroke-width="([\d.]+)"/g, (_, v) => `stroke-width="${(parseFloat(v) * (v === String(strokeScale) ? 1 : strokeScale)).toFixed(2)}"`)
    svg = svg.replace(/ r="([\d.]+)" fill="currentColor"/g, (_, v) => ` r="${(parseFloat(v) * strokeScale * 0.8).toFixed(2)}" fill="currentColor"`)
  }
  return svg
}

export function cardArtDataUrl(args: ArtArgs) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cardArtSvg({ ...args, animate: false }))
}
