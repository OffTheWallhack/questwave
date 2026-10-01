import { Camera, Clock, HeartHandshake, Hourglass, MapPin, Mic, Shuffle, Video, Zap } from 'lucide-react'
import type { Tier } from '../lib/cardArt'
import type { Lang, Mood, Quest } from '../lib/types'
import { questDesc, questTitle } from '../lib/types'
import Holo from './Holo'
import PixelArt from './PixelArt'

export const MOOD_STYLE: Record<Mood, { color: string; bg: string; Icon: typeof Zap }> = {
  adrenalin: { color: '#4BE38A', bg: '#0F3A28', Icon: Zap },
  pomoc: { color: '#FFD400', bg: '#3F2F05', Icon: HeartHandshake },
  nuda: { color: '#FF7A1A', bg: '#45200A', Icon: Shuffle },
  cakanie: { color: '#C08BFF', bg: '#2A1650', Icon: Hourglass },
}

export const RARITY = {
  sk: ['Bežná', 'Vzácna', 'Ultra vzácna'],
  en: ['Common', 'Rare', 'Ultra rare'],
}
export const EDITION = {
  sk: ['', 'Fóliová', 'Polychrómová'],
  en: ['', 'Foil', 'Polychrome'],
}
const RARITY_BG = ['#1FA2FF', '#FF4B4B', '']

const ENV: Record<string, { sk: string; en: string }> = {
  doma: { sk: 'Doma', en: 'At home' },
  vonku: { sk: 'Vonku', en: 'Outside' },
  mesto: { sk: 'V meste', en: 'In town' },
  praca: { sk: 'V práci', en: 'At work' },
  online: { sk: 'Online', en: 'Online' },
  hocikde: { sk: 'Kdekoľvek', en: 'Anywhere' },
}

/** Čísla v popise zvýraznené ako žetóny. */
function highlight(text: string) {
  return text.split(/(\d+)/).map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="text-chips">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

/** Samotná karta — kresba v krémovom ráme, ako zberateľská karta. */
export function QuestCardFront({ quest }: { quest: Quest; lang?: Lang }) {
  const { color, bg } = MOOD_STYLE[quest.mood]
  const tier = quest.difficulty as Tier

  return (
    <Holo
      tier={tier}
      color={color}
      seed={quest.slug}
      className="aspect-[5/7] w-full rounded-[14px] border-[3px] border-ink"
      style={{ background: '#F2E8D5', boxShadow: '0 8px 0 rgba(0,0,0,0.45)' }}
    >
      <div className="absolute inset-[7px] overflow-hidden rounded-[8px] border-[3px] border-ink" style={{ background: bg }}>
        <PixelArt seed={quest.slug} mood={quest.mood} env={quest.environment} color={color} bg={bg} tier={tier} />
        <span className="chip-box absolute right-2 top-2 rounded-[8px] bg-mult px-2 pb-0.5 pt-1 text-[24px] leading-none">
          +{quest.xp}
        </span>
      </div>
    </Holo>
  )
}

/** Panel pod kartou — názov, popis, rarita (ako popis karty v kartovej hre). */
export function QuestInfo({ quest, lang }: { quest: Quest; lang: Lang }) {
  const { color } = MOOD_STYLE[quest.mood]
  const tier = quest.difficulty as Tier
  const ProofIcon = quest.proof_type === 'video' ? Video : quest.proof_type === 'voice' ? Mic : Camera

  return (
    <div className="panel rounded-[12px] p-4 text-center">
      <h2 className="display text-[38px]" style={{ color }}>
        {questTitle(quest, lang)}
      </h2>
      <p className="mx-auto mt-2 max-w-[30ch] rounded-[8px] bg-cream px-3 py-2 text-[21px] leading-[1.05] text-ink [text-shadow:none]">
        {highlight(questDesc(quest, lang))}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[18px]">
        <span
          className={'chip-box rounded-[8px] px-3 pb-0.5 pt-1 ' + (tier === 3 ? 'iri-bg text-ink [text-shadow:none]' : '')}
          style={tier === 3 ? undefined : { background: RARITY_BG[tier - 1] }}
        >
          {RARITY[lang][tier - 1]}
          {EDITION[lang][tier - 1] ? ' · ' + EDITION[lang][tier - 1] : ''}
        </span>
        <span className="inline-flex items-center gap-1 text-fog">
          <Clock size={15} /> {quest.duration_min} min
        </span>
        <span className="inline-flex items-center gap-1 text-fog">
          <ProofIcon size={15} />
          {quest.proof_type === 'photo'
            ? lang === 'sk' ? 'Fotka' : 'Photo'
            : quest.proof_type === 'video'
              ? 'Video'
              : lang === 'sk' ? 'Hlasovka' : 'Voice'}
        </span>
        <span className="inline-flex items-center gap-1 text-fog">
          <MapPin size={15} /> {ENV[quest.environment]?.[lang] ?? quest.environment}
        </span>
      </div>
    </div>
  )
}

/** Zadná strana karty. */
export function QuestCardBack() {
  return (
    <div
      className="relative aspect-[5/7] w-full overflow-hidden rounded-[14px] border-[3px] border-ink"
      style={{
        background: '#F2E8D5',
        boxShadow: '0 8px 0 rgba(0,0,0,0.45)',
      }}
    >
      <div
        className="absolute inset-[7px] grid place-items-center rounded-[8px] border-[3px] border-ink"
        style={{
          background:
            'repeating-linear-gradient(45deg, #5B2E9E 0 8px, #4A2584 8px 16px), #5B2E9E',
        }}
      >
        <div className="chip-box grid h-20 w-20 place-items-center rounded-full bg-gold">
          <span className="display text-[46px] text-chalk">Q</span>
        </div>
      </div>
    </div>
  )
}

export default QuestCardFront
