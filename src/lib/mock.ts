/* eslint-disable @typescript-eslint/no-explicit-any */
// Demo režim: napodobňuje presne tie Supabase volania, ktoré appka používa.
// Všetko žije v pamäti prehliadača, nič sa nikam neposiela.
// Beta (local): to isté, ale postup hráča sa ukladá v telefóne a svetový quest sa mení každý deň.
import library from '../../supabase/quests_batch_1.json'
import { utcToday } from './date'
import { clearState, keepStorage, loadState, saveState } from './localStore'

type Row = Record<string, any>

const today = utcToday()
const ME = 'demo-user'
let LOCAL = false

// Ilustrované "fotky" pre demo — krajinky s rôznou dennou dobou a zrnom.
const SCENES = [
  { sky: ['#FF9A3C', '#B2477A', '#2A1B3D'], sun: '#FFE08A', sunY: 330, hills: ['#3B2140', '#24162B', '#140E19'] },
  { sky: ['#8FD3FF', '#C9E8F5', '#F4E7C8'], sun: '#FFF6D8', sunY: 150, hills: ['#6FA36B', '#3F7A4A', '#24452C'] },
  { sky: ['#0B1030', '#2B1E5C', '#6A3E8E'], sun: '#F3F1EA', sunY: 120, hills: ['#1A1A38', '#121228', '#0A0A18'] },
  { sky: ['#FFD27A', '#FF8A5B', '#6B3A5C'], sun: '#FFF1B8', sunY: 360, hills: ['#5A2E3E', '#3A1D2A', '#1E0F17'] },
  { sky: ['#1D3B5A', '#3E7CA8', '#A8D0E6'], sun: '#FFFFFF', sunY: 200, hills: ['#2E4F3E', '#1F3A2D', '#11231B'] },
]

function scene(i: number) {
  const sc = SCENES[i % SCENES.length]
  const hill = (y: number, amp: number, seed: number, fill: string) => {
    let d = `M0 ${y}`
    for (let x = 0; x <= 800; x += 50) {
      const yy = y + Math.sin((x + seed * 97) / 90) * amp + Math.cos((x + seed * 31) / 37) * amp * 0.35
      d += ` L${x} ${yy.toFixed(1)}`
    }
    return `<path d="${d} L800 1000 L0 1000 Z" fill="${fill}"/>`
  }
  const buildings = Array.from({ length: 14 }, (_, k) => {
    const w = 30 + ((k * 37 + i * 13) % 40)
    const h = 60 + ((k * 53 + i * 29) % 170)
    const x = k * 58 + ((i * 17) % 20)
    return `<rect x="${x}" y="${760 - h}" width="${w}" height="${h + 300}" fill="${sc.hills[1]}"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${sc.sky[2]}"/><stop offset=".55" stop-color="${sc.sky[1]}"/><stop offset="1" stop-color="${sc.sky[0]}"/>
      </linearGradient>
      <radialGradient id="g"><stop offset="0" stop-color="${sc.sun}" stop-opacity=".9"/><stop offset="1" stop-color="${sc.sun}" stop-opacity="0"/></radialGradient>
      <radialGradient id="v" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .18 0"/></filter>
    </defs>
    <rect width="800" height="1000" fill="url(#s)"/>
    <circle cx="${520 - i * 40}" cy="${sc.sunY}" r="210" fill="url(#g)"/>
    <circle cx="${520 - i * 40}" cy="${sc.sunY}" r="54" fill="${sc.sun}"/>
    ${hill(600, 40, i, sc.hills[0])}
    ${i % 2 ? buildings : ''}
    ${hill(760, 55, i + 3, sc.hills[1])}
    ${hill(880, 30, i + 7, sc.hills[2])}
    <rect width="800" height="1000" fill="url(#v)"/>
    <rect width="800" height="1000" filter="url(#n)"/>
  </svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

const quests: Row[] = (library as any).quests.map((q: Row, i: number) => ({
  ...q,
  id: 'q' + i,
}))

const fakePeople: Row[] = [
  { id: 'u1', username: 'mira_ke', gang: 'builders', city: 'Košice' },
  { id: 'u2', username: 'tomas.ba', gang: 'speedrunners', city: 'Bratislava' },
  { id: 'u3', username: 'lea.lx', gang: 'nightcrawlers', city: 'Lisabon' },
  { id: 'u4', username: 'jakub_zv', gang: 'looters', city: 'Zvolen' },
  { id: 'u5', username: 'nina', gang: 'builders', city: 'Viedeň' },
  { id: 'u6', username: 'kenji', gang: 'speedrunners', city: 'Tokio' },
]

const db: Record<string, Row[]> = {
  quests,
  profiles: fakePeople.map((p) => ({
    ...p,
    lang: 'sk',
    xp: 300 + p.id.charCodeAt(1) * 40,
    streak_current: 4,
    streak_best: 9,
    last_done_date: today,
    is_adult_16: true,
  })),
  daily_quests: [
    {
      quest_date: today,
      quest_id: null,
      custom_title_sk: 'Celý svet zbiera odpad',
      custom_title_en: 'The whole world picks up litter',
      custom_desc_sk: 'Nazbieraj 10 kusov odpadu z ulice, parku alebo pláže a hoď ich do koša. Dnes to robí celá planéta naraz.',
      custom_desc_en: 'Collect 10 pieces of litter from a street, park or beach and bin them. The whole planet is doing it today.',
      proof_type: 'photo',
      xp: 100,
      metric_sk: 'kusov odpadu',
      metric_en: 'pieces of litter',
      metric_max: 200,
      world_goal: 20000,
      sponsor_name: null,
      sponsor_logo_url: null,
      sponsor_url: null,
    },
  ],
  completions: fakePeople.map((p, i) => ({
    id: 'c' + i,
    user_id: p.id,
    // polovica robila svetový quest, zvyšok niečo zo zásobníka
    quest_id: i % 2 ? 'q' + [40, 75, 100][i % 3] : null,
    quest_date: i % 2 ? null : today,
    proof_url: i === 2 ? 'voice-demo-' + i : scene(i),
    proof_type: i === 2 ? 'voice' : 'photo',
    note: null,
    rating: 5,
    city: p.city,
    hype_count: [12, 7, 21, 3, 9, 16][i],
    is_public: true,
    created_at: new Date(Date.now() - (i + 1) * 19 * 60000).toISOString(),
  })),
  hypes: [],
  quest_submissions: [],
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

/** Svetový quest na deň. V bete sa vyberá podľa dátumu — všetci testeri majú v ten istý deň ten istý. */
function dailyFor(date: string): Row | null {
  let row = db.daily_quests.find((d) => d.quest_date === date)
  if (row || !LOCAL) return row ?? null
  const pool = quests.filter((q) => q.is_daily_eligible && q.is_active)
  // krok nesúdeliteľný s veľkosťou zásobníka → quest sa zopakuje až po prejdení všetkých
  let step = 37
  while (gcd(step, pool.length) !== 1) step++
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000)
  const q = pool[(day * step) % pool.length]
  row = {
    quest_date: date,
    quest_id: q.id,
    custom_title_sk: null,
    custom_title_en: null,
    custom_desc_sk: null,
    custom_desc_en: null,
    proof_type: q.proof_type,
    xp: 100,
    sponsor_name: null,
    sponsor_logo_url: null,
    sponsor_url: null,
    metric_sk: null,
    metric_en: null,
    metric_max: 500,
    world_goal: null,
  }
  db.daily_quests.push(row)
  return row
}

// Vymyslený dav pre štatistiky svetového questu v deme.
const CROWD_SRC: [string, string, string[], number][] = [
  ['SK', 'Europe', ['Bratislava', 'Košice', 'Žilina', 'Nitra', 'Banská Bystrica', 'Prešov'], 36],
  ['CZ', 'Europe', ['Praha', 'Brno', 'Ostrava'], 14],
  ['AT', 'Europe', ['Viedeň', 'Graz'], 6],
  ['HU', 'Europe', ['Budapešť'], 5],
  ['PL', 'Europe', ['Varšava', 'Krakov'], 6],
  ['DE', 'Europe', ['Berlín', 'Mníchov'], 6],
  ['GB', 'Europe', ['Londýn'], 4],
  ['PT', 'Europe', ['Lisabon'], 3],
  ['US', 'America', ['New York', 'Los Angeles'], 6],
  ['BR', 'America', ['São Paulo'], 3],
  ['JP', 'Asia', ['Tokio'], 3],
  ['KE', 'Africa', ['Nairobi'], 2],
  ['AU', 'Australia', ['Sydney'], 2],
]
const CROWD_GANGS = ['builders', 'builders', 'speedrunners', 'nightcrawlers', 'looters', 'world', 'world']
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0
    return a / 4294967296
  }
}
const CROWD = (() => {
  const r = seeded(42)
  const weights = CROWD_SRC.reduce((n, c) => n + c[3], 0)
  return Array.from({ length: 1279 }, (_, i) => {
    let x = r() * weights
    const src = CROWD_SRC.find((c) => (x -= c[3]) < 0) ?? CROWD_SRC[0]
    const gang = CROWD_GANGS[Math.floor(r() * CROWD_GANGS.length)]
    // väčšina ľudí 3–20 kusov, pár nadšencov oveľa viac; Builders sú v tom o chlp lepší
    const base = Math.exp(r() * 2.6 + 0.9) * (gang === 'builders' ? 1.25 : 1)
    return {
      username: 'hrac' + i,
      gang,
      country: src[0],
      region: src[1],
      city: src[2][Math.floor(r() * src[2].length)],
      amount: Math.min(200, Math.max(1, Math.round(base))),
    }
  })
})()
CROWD[7].username = 'lea.lx'
CROWD[7].city = 'Lisabon'
CROWD[7].country = 'PT'
CROWD[7].amount = 187

function board(rows: { key: string; amount: number }[], sortBy: 'total' | 'avg', limit = 99) {
  const m = new Map<string, { total: number; people: number }>()
  for (const r of rows) {
    const e = m.get(r.key) ?? { total: 0, people: 0 }
    e.total += r.amount
    e.people += 1
    m.set(r.key, e)
  }
  return [...m.entries()]
    .map(([key, e]) => ({ key, total: e.total, people: e.people, avg: Math.round((e.total / e.people) * 10) / 10 }))
    .sort((a, b) => (sortBy === 'avg' ? b.avg - a.avg : b.total - a.total))
    .slice(0, limit)
}

// Aby počítadlo nepôsobilo prázdne, demo pripočíta fiktívny "zvyšok sveta".
const WORLD_OFFSET = 1279

class Query {
  private filters: [string, any][] = []
  private op: 'select' | 'insert' | 'update' = 'select'
  private payload: any = null
  private cols = '*'
  private countHead = false
  private single = false
  private orderBy: { col: string; asc: boolean } | null = null
  private lim: number | null = null

  constructor(private table: string) {}

  select(cols = '*', opts?: { count?: string; head?: boolean }) {
    this.cols = cols
    if (opts?.head) this.countHead = true
    return this
  }
  insert(p: any) {
    this.op = 'insert'
    this.payload = p
    return this
  }
  update(p: any) {
    this.op = 'update'
    this.payload = p
    return this
  }
  eq(col: string, val: any) {
    this.filters.push([col, val])
    return this
  }
  private ranges: [string, string, any][] = []
  gte(col: string, val: any) {
    this.ranges.push([col, '>=', val])
    return this
  }
  lte(col: string, val: any) {
    this.ranges.push([col, '<=', val])
    return this
  }
  order(col: string, o?: { ascending?: boolean }) {
    this.orderBy = { col, asc: o?.ascending ?? true }
    return this
  }
  limit(n: number) {
    this.lim = n
    return this
  }
  maybeSingle() {
    this.single = true
    return this
  }

  private run() {
    if (this.table === 'daily_counter') {
      const d = this.filters.find(([c]) => c === 'quest_date')?.[1]
      const done = db.completions.filter((c) => c.quest_date === d)
      const row = {
        quest_date: d,
        done_count: done.length + WORLD_OFFSET,
        city_count: new Set(done.map((c) => c.city)).size + 38,
      }
      return { data: this.single ? row : [row], error: null }
    }
    const rows = db[this.table] ?? (db[this.table] = [])
    const match = (r: Row) =>
      this.filters.every(([c, v]) => r[c] === v) &&
      this.ranges.every(([c, op, v]) => (op === '>=' ? r[c] >= v : r[c] <= v))

    if (this.op === 'insert') {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload]
      for (const item of list) {
        if (this.table === 'profiles' && rows.some((r) => r.username === item.username)) {
          return { data: null, error: { message: 'duplicate username' } }
        }
        const row: Row = {
          id: item.id ?? this.table + '-' + Math.random().toString(36).slice(2),
          created_at: new Date().toISOString(),
          ...(this.table === 'profiles'
            ? { xp: 0, streak_current: 0, streak_best: 0, last_done_date: null, is_admin: !LOCAL }
            : {}),
          ...(this.table === 'completions' ? { hype_count: 0, is_public: true } : {}),
          ...item,
        }
        rows.push(row)
        if (this.table === 'hypes') {
          const c = db.completions.find((x) => x.id === item.completion_id)
          if (c) c.hype_count += 1
        }
      }
      return { data: null, error: null }
    }

    if (this.op === 'update') {
      rows.filter(match).forEach((r) => Object.assign(r, this.payload))
      return { data: null, error: null }
    }

    let out = rows.filter(match).map((r) => ({ ...r }))

    if (this.countHead) {
      const extra = this.table === 'completions' && this.filters.some(([c]) => c === 'quest_date') ? WORLD_OFFSET : 0
      return { data: null, count: out.length + extra, error: null }
    }

    if (this.cols.includes('profiles(')) {
      out = out.map((r) => {
        const p = db.profiles.find((x) => x.id === r.user_id)
        return { ...r, profiles: p ? { username: p.username, gang: p.gang } : null }
      })
    }
    if (this.cols.includes('quests(')) {
      out = out.map((r) => {
        const q = db.quests.find((x) => x.id === r.quest_id)
        if (q) return { ...r, quests: { title_sk: q.title_sk, title_en: q.title_en, mood: q.mood } }
        const d = r.quest_date ? dailyFor(r.quest_date) : null
        const dq = d?.quest_id ? db.quests.find((x) => x.id === d.quest_id) : null
        if (dq) return { ...r, quests: { title_sk: dq.title_sk, title_en: dq.title_en, mood: dq.mood } }
        return {
          ...r,
          quests: d ? { title_sk: d.custom_title_sk, title_en: d.custom_title_en } : null,
        }
      })
    }
    if (this.orderBy) {
      const { col, asc } = this.orderBy
      out.sort((a, b) => (a[col] < b[col] ? -1 : 1) * (asc ? 1 : -1))
    }
    if (this.lim) out = out.slice(0, this.lim)

    if (this.single) return { data: out[0] ?? null, error: null }
    return { data: out, error: null }
  }

  then(ok?: (v: any) => any, fail?: (e: any) => any): Promise<any> {
    return ready
      .then(() => new Promise((r) => setTimeout(r, 120)))
      .then(() => {
        const res = this.run()
        if (this.op !== 'select') persist()
        return res
      })
      .then(ok, fail)
  }
}

const urls: Record<string, string> = {}
/** object URL dôkazu → samotný súbor (aby sa dal uložiť do telefónu) */
const blobs = new Map<string, Blob>()

let session: any = null
const listeners: ((e: string, s: any) => void)[] = []
const emit = () => listeners.forEach((l) => l('CHANGE', session))

// ---------- beta: uloženie postupu v telefóne ----------

let ready: Promise<unknown> = Promise.resolve()

interface Saved {
  session: any
  me: Row | null
  completions: Row[]
  hypes: Row[]
  submissions: Row[]
}

function persist() {
  if (!LOCAL) return
  const state: Saved = {
    session,
    me: db.profiles.find((p) => p.id === ME) ?? null,
    completions: db.completions
      .filter((c) => c.user_id === ME)
      .map((c) => ({ ...c, proof_blob: blobs.get(c.proof_url) ?? null })),
    hypes: db.hypes.filter((h) => h.user_id === ME),
    submissions: db.quest_submissions,
  }
  saveState(state)
}

async function hydrate() {
  const s = await loadState<Saved>()
  if (!s) return
  session = s.session
  if (s.me) db.profiles.push(s.me)
  for (const { proof_blob, ...row } of s.completions) {
    if (proof_blob) {
      row.proof_url = URL.createObjectURL(proof_blob)
      blobs.set(row.proof_url, proof_blob)
    }
    db.completions.push(row)
  }
  for (const h of s.hypes) {
    db.hypes.push(h)
    const c = db.completions.find((x) => x.id === h.completion_id && x.user_id !== ME)
    if (c) c.hype_count += 1
  }
  db.quest_submissions.push(...s.submissions)
}

export function createMockClient({ local = false }: { local?: boolean } = {}): any {
  if (local) {
    LOCAL = true
    db.daily_quests = []
    dailyFor(today)
    ready = hydrate()
    keepStorage()
  }
  return {
    from: (t: string) => new Query(t),
    rpc: async (fn: string, args: any = {}) => {
      await ready
      const today = utcToday()
      if (fn === 'ensure_daily_quest') {
        return { data: dailyFor(today), error: null }
      }
      if (fn === 'complete_quest') {
        // rovnaká logika ako v databáze, len v pamäti
        await new Promise((r) => setTimeout(r, 300))
        const me = db.profiles.find((p) => p.id === ME)!
        const dq = dailyFor(today)
        const pts = args.p_daily ? dq?.xp ?? 0 : db.quests.find((q) => q.id === args.p_quest_id)?.xp ?? 0
        if (args.p_daily && db.completions.some((c) => c.user_id === ME && c.quest_date === today)) {
          return { data: null, error: { message: 'Dnešný svetový quest už máš splnený.' } }
        }
        db.completions.push({
          id: 'c-' + Date.now(),
          user_id: ME,
          quest_id: args.p_daily ? dq?.quest_id ?? null : args.p_quest_id,
          quest_date: args.p_daily ? today : null,
          proof_url: args.p_proof_url,
          proof_type: args.p_proof_type,
          rating: args.p_rating,
          city: args.p_city,
          amount: args.p_amount ?? null,
          country: args.p_country ?? null,
          region: args.p_region ?? null,
          hype_count: 0,
          is_public: true,
          created_at: new Date().toISOString(),
        })
        let st = me.streak_current
        if (args.p_daily) {
          const y = new Date(Date.parse(today + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10)
          st = me.last_done_date === today ? st : me.last_done_date === y ? st + 1 : 1
          Object.assign(me, { streak_current: st, streak_best: Math.max(me.streak_best, st), last_done_date: today })
        }
        me.xp += pts
        persist()
        const rank = db.completions.filter((c) => c.quest_date === today).length + WORLD_OFFSET
        return { data: [{ gained: pts, streak: st, rank }], error: null }
      }
      if (fn === 'quest_stats') {
        const real = db.completions
          .filter((c) => c.quest_date === today && c.amount != null && c.is_public)
          .map((c) => {
            const p = db.profiles.find((x) => x.id === c.user_id)
            return {
              username: p?.username ?? '?',
              gang: p?.gang ?? 'world',
              country: c.country ?? 'SK',
              region: c.region ?? 'Europe',
              city: c.city ?? 'Bratislava',
              amount: c.amount as number,
              me: c.user_id === ME,
            }
          })
        const all = [...CROWD.map((x) => ({ ...x, me: false })), ...real]
        const total = all.reduce((n, x) => n + x.amount, 0)
        const sorted = [...all].sort((a, b) => b.amount - a.amount)
        const mine = all.find((x) => x.me)
        return {
          data: {
            quest_date: today,
            total,
            people: all.length,
            avg: Math.round((total / all.length) * 10) / 10,
            median: sorted[Math.floor(sorted.length / 2)].amount,
            record: { username: sorted[0].username, amount: sorted[0].amount, city: sorted[0].city },
            by_gang: board(all.map((x) => ({ key: x.gang, amount: x.amount })), 'avg'),
            by_country: board(all.map((x) => ({ key: x.country, amount: x.amount })), 'total', 10),
            by_region: board(all.map((x) => ({ key: x.region, amount: x.amount })), 'total'),
            by_city: board(all.map((x) => ({ key: x.city, amount: x.amount })), 'total', 10),
            me: mine
              ? {
                  amount: mine.amount,
                  rank: all.filter((x) => x.amount > mine.amount).length + 1,
                  of: all.length,
                  beaten: all.filter((x) => x.amount < mine.amount).length,
                }
              : null,
          },
          error: null,
        }
      }
      if (fn === 'admin_stats') {
        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10)
          return { day: d, n: Math.round(40 + i * i * 6 + Math.sin(i) * 20) }
        })
        return {
          data: {
            users_total: 1874,
            users_7d: 412,
            active_7d: 1203,
            done_today: db.completions.filter((c) => c.quest_date === today).length + WORLD_OFFSET,
            done_total: 9312,
            cities_total: 64,
            per_day: days,
            top_cities: [
              { city: 'Bratislava', n: 2104 },
              { city: 'Košice', n: 811 },
              { city: 'Praha', n: 640 },
              { city: 'Viedeň', n: 402 },
              { city: 'Lisabon', n: 188 },
            ],
          },
          error: null,
        }
      }
      if (fn === 'choose_gang') {
        const me = db.profiles.find((p) => p.id === ME)
        if (me) me.gang = args.p_gang
        persist()
        return { data: null, error: null }
      }
      if (fn === 'hide_completion') {
        const c = db.completions.find((x) => x.id === args.p_id)
        if (c) c.is_public = false
        persist()
        return { data: null, error: null }
      }
      if (fn === 'delete_my_account') {
        db.profiles = db.profiles.filter((p) => p.id !== ME)
        db.completions = db.completions.filter((c) => c.user_id !== ME)
        db.hypes = db.hypes.filter((h) => h.user_id !== ME)
        if (LOCAL) await clearState()
        return { data: null, error: null }
      }
      return { data: null, error: null }
    },
    auth: {
      getSession: async () => {
        await ready
        return { data: { session } }
      },
      onAuthStateChange: (cb: (e: string, s: any) => void) => {
        listeners.push(cb)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithOAuth: async () => {
        session = { user: { id: ME, email: 'demo@questwave.app' } }
        persist()
        setTimeout(emit, 300)
        return { error: null }
      },
      verifyOtp: async () => {
        session = { user: { id: ME, email: 'demo@questwave.app' } }
        persist()
        setTimeout(emit, 100)
        return { error: null }
      },
      signInWithOtp: async () => {
        session = { user: { id: ME, email: 'demo@questwave.app' } }
        persist()
        setTimeout(emit, LOCAL ? 100 : 600)
        return { error: null }
      },
      signOut: async () => {
        session = null
        persist()
        emit()
        return { error: null }
      },
    },
    storage: {
      from: () => {
        return {
          upload: async (path: string, file: File) => {
            urls[path] = URL.createObjectURL(file)
            blobs.set(urls[path], file)
            return { data: { path }, error: null }
          },
          getPublicUrl: (path: string) => ({ data: { publicUrl: urls[path] ?? '' } }),
          remove: async () => ({ data: null, error: null }),
        }
      },
    },
  }
}
