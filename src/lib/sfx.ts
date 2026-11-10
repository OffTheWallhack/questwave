import { getFlag, setFlag } from './prefs'

// 8-bitové zvuky cez WebAudio — žiadne súbory, nič sa nesťahuje. Predvolene vypnuté.

let ctx: AudioContext | null = null
let on = getFlag('sfx', false)

export const sfxEnabled = () => on
export function setSfx(value: boolean) {
  on = value
  setFlag('sfx', value)
  if (value) tone([[660, 0.07], [880, 0.09]])
}

function audio(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

type Note = [freq: number, seconds: number]

function tone(notes: Note[], type: OscillatorType = 'square', volume = 0.06) {
  const a = audio()
  if (!a) return
  let t = a.currentTime
  for (const [f, len] of notes) {
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = type
    o.frequency.value = f
    g.gain.setValueAtTime(volume, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + len)
    o.connect(g).connect(a.destination)
    o.start(t)
    o.stop(t + len + 0.02)
    t += len * 0.9
  }
}

/** Ťuk na tlačidlo. */
export const sfxTap = () => on && tone([[520, 0.04]])
/** Quest splnený — krátka stúpajúca fanfára. */
export const sfxSuccess = () => on && tone([[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.2]])
/** Nová úroveň — dlhšia fanfára. */
export const sfxLevelUp = () => on && tone([[392, 0.08], [523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.12], [1319, 0.28]])
/** Nový odznak. */
export const sfxBadge = () => on && tone([[880, 0.07], [1175, 0.07], [1568, 0.18]], 'triangle', 0.08)
