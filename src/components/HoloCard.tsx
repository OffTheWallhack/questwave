import { Flame } from 'lucide-react'
import { levelFromXp, titleForLevel } from '../lib/progress'
import { identity } from '../lib/gangs'
import type { Gang, Lang, Profile } from '../lib/types'
import Holo from './Holo'
import PixelArt from './PixelArt'
import { shade } from './Swirl'

export function memberNo(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return String(h % 10000).padStart(4, '0')
}

// Každý gang má výtvarný jazyk nálady, ktorá je mu najbližšia.
export const GANG_ART: Record<Gang, { mood: string; env: string }> = {
  speedrunners: { mood: 'adrenalin', env: 'mesto' },
  builders: { mood: 'pomoc', env: 'doma' },
  looters: { mood: 'nuda', env: 'vonku' },
  nightcrawlers: { mood: 'cakanie', env: 'mesto' },
}

/** Hráčska karta na profile — vždy polychrómová. */
export default function HoloCard({ profile, lang }: { profile: Profile; lang: Lang }) {
  const id = identity(profile, lang)
  const color = id.color
  const bg = shade(color, 0.22)
  const { level } = levelFromXp(profile.xp)

  return (
    <div className="mx-auto w-[74%] max-w-[300px]">
      <Holo
        tier={3}
        color={color}
        seed={profile.id}
        className="aspect-[5/7] w-full rounded-[14px] border-[3px] border-ink"
        style={{ background: '#F2E8D5', boxShadow: '0 8px 0 rgba(0,0,0,0.45)' }}
      >
        <div className="absolute inset-[7px] overflow-hidden rounded-[8px] border-[3px] border-ink" style={{ background: bg }}>
          <PixelArt seed={profile.id + (profile.gang ?? 'world')} mood={id.mood} env={id.env} color={color} bg={bg} tier={3} />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
            <span className="chip-box rounded-[8px] px-2 pb-0.5 pt-1 text-[19px] leading-none text-ink [text-shadow:none]" style={{ background: color }}>
              {id.name}
            </span>
            <span className="text-[18px] text-chalk/80">#{memberNo(profile.id)}</span>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-ink/75 px-3 pb-2 pt-2">
            <p className="display truncate text-[40px]">{profile.username}</p>
            <p className="text-[18px] text-fog">{titleForLevel(level, lang)}</p>
            <div className="mt-1.5 flex items-center justify-between text-[19px]">
              <span className="chip-box inline-flex items-center gap-1 rounded-[8px] bg-looters px-2 pb-0.5 pt-1 leading-none">
                <Flame size={15} fill="#FFF8EA" className="text-chalk" />
                {profile.streak_current}
              </span>
              <span>
                {lang === 'sk' ? 'Úr.' : 'Lv.'} {level}
              </span>
              <span className="chip-box rounded-[8px] bg-mult px-2 pb-0.5 pt-1 leading-none">{profile.xp} XP</span>
            </div>
          </div>
        </div>
      </Holo>
    </div>
  )
}
