import { cardArtSvg, type Tier } from './cardArt'

export interface PixelArtArgs {
  seed: string
  mood: string
  env: string
  color: string
  bg: string
  tier: Tier
}

/**
 * Vektorová kresba → pixel art. Vykreslí sa do malého canvasu,
 * farby a priehľadnosť sa "zaokrúhlia" na tvrdé pixely.
 */
export function renderPixelArt(args: PixelArtArgs, pw: number, ph: number, target?: HTMLCanvasElement) {
  const cv = target ?? document.createElement('canvas')
  cv.width = pw
  cv.height = ph
  const ctx = cv.getContext('2d')!
  const W = 320
  const H = Math.round((W * ph) / pw)
  const svg = cardArtSvg({ ...args, animate: false, w: W, h: H, strokeScale: 3.2 })
  return new Promise<HTMLCanvasElement>((resolve) => {
    const img = new Image()
    img.onload = () => {
      ctx.imageSmoothingEnabled = true
      ctx.clearRect(0, 0, pw, ph)
      ctx.drawImage(img, 0, 0, pw, ph)
      const data = ctx.getImageData(0, 0, pw, ph)
      const d = data.data
      const q = 36
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(d[i] / q) * q
        d[i + 1] = Math.round(d[i + 1] / q) * q
        d[i + 2] = Math.round(d[i + 2] / q) * q
        d[i + 3] = d[i + 3] > 110 ? 255 : 0
      }
      ctx.putImageData(data, 0, 0)
      resolve(cv)
    }
    img.onerror = () => resolve(cv)
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  })
}
