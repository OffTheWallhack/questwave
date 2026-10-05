import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dailyText, fetchDaily } from '../lib/daily'
import { utcToday } from '../lib/date'
import { questNumber } from '../lib/progress'
import type { DailyQuest, Lang } from '../lib/types'
import Countdown from './Countdown'

/** Sneak peek: dnešný svetový quest ešte pred registráciou. */
export default function TodayPeek({ lang }: { lang: Lang }) {
  const [daily, setDaily] = useState<DailyQuest | null>(null)

  useEffect(() => {
    fetchDaily().then(setDaily)
  }, [])

  const { title, desc } = dailyText(daily, lang)
  if (!title) return null

  return (
    <motion.div
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 16 }}
      className="panel mt-5 overflow-hidden rounded-[12px]"
    >
      <div className="iri-bg flex items-center justify-between border-b-[3px] border-ink px-3 pb-0.5 pt-1.5 text-ink [text-shadow:none]">
        <p className="text-[20px]">
          {lang === 'sk' ? 'Dnes robí celý svet' : 'Today the whole world does'} #{questNumber(utcToday())}
        </p>
        <p className="text-[18px] tabular-nums">
          <Countdown />
        </p>
      </div>
      <div className="p-3">
        <p className="display text-[34px] leading-none">{title}</p>
        {desc && <p className="mt-1.5 text-[19px] leading-[1.05] text-fog">{desc}</p>}
        {daily?.quests?.duration_min && (
          <p className="mt-2 inline-flex items-center gap-1 text-[18px] text-fog">
            <Clock size={14} /> ~{daily.quests.duration_min} min
          </p>
        )}
      </div>
    </motion.div>
  )
}
