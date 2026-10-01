// Náklon kariet podľa toho, ako človek drží telefón.
// Jeden spoločný poslucháč pre všetky karty, hodnoty 0..1 (0.5 = rovno).

const RANGE = 20 // koľko stupňov náklonu = plný efekt

export type MotionStatus =
  | 'idle' // ešte sme sa nepýtali
  | 'needs-tap' // iPhone: treba ťuknúť, aby sa dalo pýtať povolenie
  | 'waiting' // čakáme na prvé dáta
  | 'live' // gyroskop posiela dáta
  | 'denied' // používateľ alebo systém povolenie odmietol
  | 'nodata' // povolené, ale nechodia žiadne dáta (napr. stránka v cudzom okne)
  | 'unsupported' // zariadenie gyroskop nemá

const state = {
  x: 0.5,
  y: 0.5,
  tx: 0.5,
  ty: 0.5,
  last: 0,
  base: null as null | { b: number; g: number },
  listening: false,
  status: 'idle' as MotionStatus,
}

const subs = new Set<(s: MotionStatus) => void>()
function setStatus(s: MotionStatus) {
  state.status = s
  subs.forEach((fn) => fn(s))
}
export function onMotionStatus(fn: (s: MotionStatus) => void) {
  subs.add(fn)
  fn(state.status)
  return () => {
    subs.delete(fn)
  }
}

const clamp = (v: number) => Math.min(1, Math.max(0, v))

function onOrient(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return
  const b = e.beta
  const g = e.gamma
  if (!state.base) state.base = { b, g }
  // stred sa pomaly prispôsobuje tomu, ako človek telefón prirodzene drží
  state.base.b += (b - state.base.b) * 0.008
  state.base.g += (g - state.base.g) * 0.008
  // odlesk ide opačne ako náklon — ako skutočná fólia pod pevným svetlom
  state.tx = clamp(0.5 - (g - state.base.g) / (2 * RANGE))
  state.ty = clamp(0.5 - (b - state.base.b) / (2 * RANGE))
  state.last = performance.now()
  if (state.status !== 'live') setStatus('live')
}

function listen() {
  if (!state.listening) {
    state.listening = true
    window.addEventListener('deviceorientation', onOrient)
  }
  if (state.status !== 'live') setStatus('waiting')
  // ak do 2 s nič nepríde, gyroskop je zablokovaný (napr. stránka beží v cudzom okne)
  setTimeout(() => {
    if (state.status === 'waiting') setStatus('nodata')
  }, 2000)
}

type DOEWithPermission = { requestPermission?: () => Promise<string> }
const DOE = () => (window as unknown as { DeviceOrientationEvent?: DOEWithPermission }).DeviceOrientationEvent

export const needsPermission = () => typeof DOE()?.requestPermission === 'function'

/** Zavolá sa pri zobrazení karty. Kde netreba povolenie, rovno začne počúvať. */
export function enableMotion() {
  if (state.status !== 'idle') return
  if (!DOE()) return setStatus('unsupported')
  if (needsPermission()) return setStatus('needs-tap')
  listen()
}

/**
 * Musí sa volať priamo v obsluhe ťuknutia (iPhone inak povolenie nepustí).
 * Nič sa nesmie čakať pred volaním requestPermission.
 */
export function requestMotion() {
  const d = DOE()
  if (!d) return setStatus('unsupported')
  if (!d.requestPermission) return listen()
  let p: Promise<string>
  try {
    p = d.requestPermission()
  } catch {
    return setStatus('denied')
  }
  p.then((r) => (r === 'granted' ? listen() : setStatus('denied'))).catch(() => setStatus('denied'))
}

/** Aktuálny náklon, vyhladený proti chveniu. `live` = gyroskop naozaj posiela dáta. */
export function readTilt() {
  state.x += (state.tx - state.x) * 0.18
  state.y += (state.ty - state.y) * 0.18
  return { x: state.x, y: state.y, live: performance.now() - state.last < 1000 }
}
