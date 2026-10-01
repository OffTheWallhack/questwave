// Grafiky na Instagram vyrenderované priamo z komponentov appky.
// Spusti `npm run dev` a otvor /posters.html?p=profile (alebo post1, post2, post3, profile-q).
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import library from '../../supabase/quests_batch_1.json'
import Globe from '../components/Globe'
import { QuestCardFront } from '../components/QuestCard'
import Swirl, { setSwirl } from '../components/Swirl'
import { BRAND } from '../lib/brand'
import type { Quest } from '../lib/types'
import '../index.css'

const quests = (library as unknown as { quests: Omit<Quest, "id">[] }).quests.map((q, i) => ({ ...q, id: "q" + i }) as Quest)
const pick = (mood: string, diff: number) => quests.find((q) => q.mood === mood && q.difficulty === diff)!

const BA = { lat: 48.15, lon: 17.11 }
const now = () => performance.now()
const PINGS = [
  { id: 'a', lat: 51.5, lon: -0.1, color: '#4BE38A', born: now() - 300 },
  { id: 'b', lat: 41.9, lon: 12.5, color: '#FF7A1A', born: now() - 900 },
  { id: 'c', lat: 30.0, lon: 31.2, color: '#B26BFF', born: now() - 500 },
  { id: 'd', lat: 6.5, lon: 3.4, color: '#FFD400', born: now() - 1200 },
  { id: 'e', lat: 52.2, lon: 21.0, color: '#4BE38A', born: now() - 100 },
]

function Wordmark({ size }: { size: number }) {
  return (
    <span className="display wave text-gold" style={{ fontSize: size, letterSpacing: '0.03em', lineHeight: 0.9 }}>
      {BRAND.wordmark.split('').map((ch, i) => (
        <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>
          {ch}
        </span>
      ))}
    </span>
  )
}

function Tagline({ size = 26 }: { size?: number }) {
  return (
    <span className="chip-box inline-block rounded-[10px] bg-mult px-3 pb-1 pt-2 leading-none" style={{ fontSize: size }}>
      {BRAND.tagline}
    </span>
  )
}

/** Profilovka A — glóbus so zlatou bodkou. V krúžku na Instagrame čitateľná aj malá. */
function ProfileGlobe() {
  useEffect(() => setSwirl(['#1B1530', '#5B2E9E', '#0E5A63']), [])
  return (
    <div className="grid h-[540px] w-[540px] place-items-center">
      <Globe size={480} mine={BA} pings={[]} speed={0} tiltDeg={48} startLon={17.11} mineScale={2.6} />
    </div>
  )
}

/** Profilovka B — zlatý žetón s Q. */
function ProfileQ() {
  useEffect(() => setSwirl(['#1B1530', '#5B2E9E', '#0E5A63']), [])
  return (
    <div className="grid h-[540px] w-[540px] place-items-center">
      <div className="chip-box grid h-[300px] w-[300px] place-items-center rounded-[48px] bg-gold" style={{ borderWidth: 8, boxShadow: 'inset 0 -22px 0 rgba(0,0,0,0.25), 0 16px 0 rgba(0,0,0,0.5)' }}>
        <span className="display text-chalk" style={{ fontSize: 290, lineHeight: 0.8, textShadow: '10px 10px 0 rgba(0,0,0,0.35)' }}>
          Q
        </span>
      </div>
    </div>
  )
}

/** Post 1 — značka: glóbus, meno, slogan. */
function PostBrand() {
  useEffect(() => setSwirl(['#1B1530', '#5B2E9E', '#0E5A63']), [])
  return (
    <div className="flex h-[675px] w-[540px] flex-col items-center px-8 pt-10 text-center">
      <Globe size={360} mine={BA} pings={PINGS} speed={0} tiltDeg={38} startLon={14} mineScale={1.8} />
      <div className="mt-1">
        <Wordmark size={92} />
      </div>
      <div className="mt-3">
        <Tagline size={28} />
      </div>
      <p className="display mt-5 text-[34px] leading-[1]">
        One quest.
        <br />
        The whole world.
        <br />
        Every day.
      </p>
    </div>
  )
}

/** Post 2 — zberateľské karty: bežná, vzácna, ultra vzácna. */
function PostCards() {
  useEffect(() => setSwirl(['#1B1530', '#2A1650', '#0F3A28']), [])
  const cards = [pick('adrenalin', 1), pick('pomoc', 2), pick('cakanie', 3)]
  const pose = [
    { r: -12, x: 40, y: 34 },
    { r: 0, x: 0, y: 0 },
    { r: 12, x: -40, y: 34 },
  ]
  return (
    <div className="flex h-[675px] w-[540px] flex-col items-center pt-14 text-center">
      <p className="display text-[66px] leading-none">Collect the day.</p>
      <div className="relative mt-14 flex w-full justify-center">
        {cards.map((q, i) => (
          <div
            key={q.slug}
            className="w-[226px]"
            style={{
              transform: `translate(${pose[i].x}px, ${pose[i].y}px) rotate(${pose[i].r}deg)`,
              zIndex: i === 1 ? 2 : 1,
              marginLeft: i ? -78 : 0,
            }}
          >
            <QuestCardFront quest={q} />
          </div>
        ))}
      </div>
      <div className="mt-16 flex gap-3 text-[26px]">
        <span className="chip-box rounded-[8px] bg-chips px-3 pb-1 pt-1.5 leading-none">Common</span>
        <span className="chip-box rounded-[8px] bg-mult px-3 pb-1 pt-1.5 leading-none">Rare</span>
        <span className="chip-box iri-bg rounded-[8px] px-3 pb-1 pt-1.5 leading-none text-ink [text-shadow:none]">Ultra rare</span>
      </div>
    </div>
  )
}

/** Post 3 — teaser: deň 1 sa blíži, nula ľudí, buď prvý. */
function PostTeaser() {
  useEffect(() => setSwirl(['#1B1530', '#5A1B3E', '#173A6E']), [])
  return (
    <div className="flex h-[675px] w-[540px] flex-col justify-center px-7">
      <div className="panel overflow-hidden rounded-[16px]">
        <div className="iri-bg flex items-center justify-between border-b-[3px] border-ink px-5 pb-1.5 pt-3 text-ink [text-shadow:none]">
          <span className="text-[32px] leading-none">World quest #1</span>
          <span className="text-[30px] leading-none">soon</span>
        </div>
        <div className="p-6">
          <p className="display text-[84px] leading-[0.85]">Starts soon.</p>
          <p className="mt-3 rounded-[10px] bg-cream px-4 py-3 text-[28px] leading-[1.05] text-ink [text-shadow:none]">
            Same quest. Same day. Everyone on the planet. Do it IRL, drop the proof, light up the map.
          </p>
          <div className="mt-6 flex items-stretch gap-3">
            <div className="chip-box flex-1 rounded-[14px] bg-chips px-4 pb-3 pt-3 text-right">
              <p className="num text-[72px]">0</p>
              <p className="text-[24px] text-chalk/85">people</p>
            </div>
            <span className="display self-center text-[48px] text-mult">×</span>
            <div className="chip-box flex-1 rounded-[14px] bg-mult px-4 pb-3 pt-3">
              <p className="num text-[72px]">0</p>
              <p className="text-[24px] text-chalk/85">cities</p>
            </div>
          </div>
          <p className="display mt-6 text-center text-[44px] text-gold">Be the first dot.</p>
        </div>
      </div>
    </div>
  )
}

const VIEWS: Record<string, () => React.JSX.Element> = {
  profile: ProfileGlobe,
  'profile-q': ProfileQ,
  post1: PostBrand,
  post2: PostCards,
  post3: PostTeaser,
}

const View = VIEWS[new URLSearchParams(location.search).get('p') ?? 'post1'] ?? PostBrand

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Swirl />
    <View />
    <div className="crt" aria-hidden />
  </React.StrictMode>,
)
