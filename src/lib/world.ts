import { useEffect, useState } from 'react'
import type { Ping } from '../components/Globe'
import { OFFLINE, supabase } from './supabase'
import { GANG_COLOR, type Gang } from './types'

// Mestá, kde sa v demu rozsvecujú pingy. V reálnej appke sa poloha neukladá —
// ping ide do mesta podľa časového pásma človeka, ktorý quest splnil.
export const CITIES: [string, number, number][] = [
  ['Bratislava', 48.15, 17.11], ['Košice', 48.72, 21.26], ['Praha', 50.08, 14.43],
  ['Viedeň', 48.21, 16.37], ['Budapešť', 47.5, 19.04], ['Berlín', 52.52, 13.4],
  ['Londýn', 51.51, -0.13], ['Paríž', 48.86, 2.35], ['Lisabon', 38.72, -9.14],
  ['Madrid', 40.42, -3.7], ['Rím', 41.9, 12.5], ['Štokholm', 59.33, 18.07],
  ['Varšava', 52.23, 21.01], ['Istanbul', 41.01, 28.98], ['Káhira', 30.04, 31.24],
  ['Lagos', 6.52, 3.38], ['Nairobi', -1.29, 36.82], ['Kapské Mesto', -33.92, 18.42],
  ['Dubaj', 25.2, 55.27], ['Bombaj', 19.08, 72.88], ['Bangkok', 13.76, 100.5],
  ['Singapur', 1.35, 103.82], ['Tokio', 35.68, 139.69], ['Soul', 37.57, 126.98],
  ['Šanghaj', 31.23, 121.47], ['Sydney', -33.87, 151.21], ['Auckland', -36.85, 174.76],
  ['New York', 40.71, -74.01], ['Toronto', 43.65, -79.38], ['Chicago', 41.88, -87.63],
  ['Los Angeles', 34.05, -118.24], ['Mexiko', 19.43, -99.13], ['Bogotá', 4.71, -74.07],
  ['Lima', -12.05, -77.04], ['São Paulo', -23.55, -46.63], ['Buenos Aires', -34.6, -58.38],
  ['Reykjavík', 64.15, -21.94], ['Helsinki', 60.17, 24.94], ['Atény', 37.98, 23.73],
  ['Tel Aviv', 32.09, 34.78], ['Džakarta', -6.2, 106.85], ['Manila', 14.6, 120.98],
]

const TZ_CITY: Record<string, string> = {
  'Europe/Bratislava': 'Bratislava', 'Europe/Prague': 'Praha', 'Europe/Vienna': 'Viedeň',
  'Europe/Budapest': 'Budapešť', 'Europe/Berlin': 'Berlín', 'Europe/London': 'Londýn',
  'Europe/Paris': 'Paríž', 'Europe/Lisbon': 'Lisabon', 'Europe/Madrid': 'Madrid',
  'Europe/Rome': 'Rím', 'Europe/Warsaw': 'Varšava', 'America/New_York': 'New York',
  'America/Los_Angeles': 'Los Angeles', 'Asia/Tokyo': 'Tokio', 'Australia/Sydney': 'Sydney',
}

export function myLocation(): { lat: number; lon: number; city: string } {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const name = TZ_CITY[tz] ?? 'Bratislava'
  const c = CITIES.find((x) => x[0] === name)!
  return { lat: c[1], lon: c[2], city: c[0] }
}

const GANGS: Gang[] = ['builders', 'speedrunners', 'nightcrawlers', 'looters']

function randomPing(): Ping {
  const c = CITIES[Math.floor(Math.random() * CITIES.length)]
  const g = GANGS[Math.floor(Math.random() * 4)]
  return {
    id: Math.random().toString(36).slice(2),
    lat: c[1] + (Math.random() - 0.5) * 3,
    lon: c[2] + (Math.random() - 0.5) * 3,
    color: GANG_COLOR[g],
    born: performance.now(),
  }
}

/** Živé pingy na glóbuse + počítadlo, ktoré s nimi rastie. */
export function useLivePings(initialCount: number) {
  const [pings, setPings] = useState<Ping[]>([])
  const [bonus, setBonus] = useState(0)

  useEffect(() => {
    const add = () => {
      setPings((p) => [...p.filter((x) => performance.now() - x.born < 3000), randomPing()])
      setBonus((b) => b + 1)
    }

    if (OFFLINE) {
      // pár pingov hneď, aby planéta nepôsobila prázdne
      setPings([0, 1, 2, 3].map(() => ({ ...randomPing(), born: performance.now() - Math.random() * 2000 })))
      const id = setInterval(add, 1400)
      return () => clearInterval(id)
    }

    const channel = supabase
      .channel('completions-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'completions' }, add)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { pings, count: initialCount + bonus }
}

// ---------- krajina a svetadiel (bez GPS, z časového pásma) ----------

const TZ_COUNTRY: Record<string, string> = {
  'Europe/Bratislava': 'SK', 'Europe/Prague': 'CZ', 'Europe/Vienna': 'AT', 'Europe/Budapest': 'HU',
  'Europe/Warsaw': 'PL', 'Europe/Berlin': 'DE', 'Europe/London': 'GB', 'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR', 'Europe/Madrid': 'ES', 'Europe/Lisbon': 'PT', 'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Copenhagen': 'DK',
  'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Helsinki': 'FI', 'Europe/Athens': 'GR',
  'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Zagreb': 'HR', 'Europe/Ljubljana': 'SI',
  'Europe/Belgrade': 'RS', 'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA', 'Europe/Istanbul': 'TR',
  'Europe/Vilnius': 'LT', 'Europe/Riga': 'LV', 'Europe/Tallinn': 'EE', 'Atlantic/Reykjavik': 'IS',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
  'America/Phoenix': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Buenos_Aires': 'AR', 'America/Argentina/Buenos_Aires': 'AR',
  'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Santiago': 'CL',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Singapore': 'SG',
  'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Kolkata': 'IN', 'Asia/Dubai': 'AE',
  'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'NZ', 'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
  'Africa/Johannesburg': 'ZA', 'Africa/Casablanca': 'MA',
}

/** ISO kód krajiny — z časového pásma, inak z jazyka zariadenia (sk-SK → SK). */
export function myCountry(): string | null {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz]
  const m = /-([A-Z]{2})$/.exec(navigator.language)
  return m ? m[1] : null
}

/** Svetadiel z časového pásma: Europe, America, Asia, Africa, Australia… */
export function myRegion(): string | null {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const r = tz.split('/')[0]
  return ['Europe', 'America', 'Asia', 'Africa', 'Australia', 'Pacific', 'Atlantic', 'Indian'].includes(r) ? r : null
}

const REGION_NAME: Record<string, { sk: string; en: string }> = {
  Europe: { sk: 'Európa', en: 'Europe' },
  America: { sk: 'Amerika', en: 'Americas' },
  Asia: { sk: 'Ázia', en: 'Asia' },
  Africa: { sk: 'Afrika', en: 'Africa' },
  Australia: { sk: 'Austrália', en: 'Australia' },
  Pacific: { sk: 'Tichomorie', en: 'Pacific' },
  Atlantic: { sk: 'Atlantik', en: 'Atlantic' },
  Indian: { sk: 'Indický oceán', en: 'Indian Ocean' },
}
export const regionName = (r: string, lang: 'sk' | 'en') => REGION_NAME[r]?.[lang] ?? r

export function countryName(code: string, lang: 'sk' | 'en') {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

/** Vlajka z ISO kódu (SK → 🇸🇰). */
export const flag = (code: string) =>
  /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : '🏳️'
