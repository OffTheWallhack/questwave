import { BRAND } from './brand'
import type { Lang } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Text do .ics: čiarky, bodkočiarky a zalomenia sa musia escapovať. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/**
 * Denná pripomienka ako kalendárová udalosť (.ics) — otvorí sa v Kalendári na iPhone aj Androide.
 * Čas je "plávajúci" (bez pásma), takže zazvoní o zvolenej hodine tam, kde človek práve je.
 */
export function reminderIcs(time: string, lang: Lang, url: string, now = new Date()): string {
  const [hh, mm] = time.split(':').map((x) => Math.max(0, parseInt(x, 10) || 0))
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (now.getHours() * 60 + now.getMinutes() >= hh * 60 + mm ? 1 : 0))
  const day = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}`
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`
  const endMin = hh * 60 + mm + 10
  const title = lang === 'sk' ? `${BRAND.name}: dnešný quest čaká` : `${BRAND.name}: today's quest is waiting`
  const body = lang === 'sk' ? 'Jeden quest. Celý svet. Splň ho, kým ťa neprekoná deň.' : 'One quest. The whole world. Do it before the day gets you.'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${BRAND.name}//Quest reminder//${lang.toUpperCase()}`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:daily-reminder@${BRAND.domain}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${day}T${pad(hh)}${pad(mm)}00`,
    `DTEND:${day}T${pad(Math.floor(endMin / 60) % 24)}${pad(endMin % 60)}00`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(body)}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function downloadReminder(time: string, lang: Lang): void {
  const url = location.origin + location.pathname
  const blob = new Blob([reminderIcs(time, lang, url)], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'pomenato-pripomienka.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 10000)
}
