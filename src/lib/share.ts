import { BRAND } from './brand'

/** Pozvánka pre kamošov — systémové zdieľanie, inak skopíruje odkaz. */
export async function invite(lang: 'sk' | 'en'): Promise<'shared' | 'copied' | 'failed'> {
  const url = window.location.origin + import.meta.env.BASE_URL
  const text =
    lang === 'sk'
      ? `${BRAND.name} — ${BRAND.tagline}. Každý deň jeden quest pre celý svet. Poď do toho so mnou:`
      : `${BRAND.name} — ${BRAND.tagline}. One quest a day for the whole world. Join me:`
  try {
    if (navigator.share) {
      await navigator.share({ title: BRAND.name, text, url })
      return 'shared'
    }
    await navigator.clipboard.writeText(`${text} ${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}
