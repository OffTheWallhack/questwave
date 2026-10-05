import { AnimatePresence, motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
import { renderStoryCard } from '../lib/flexcard'
import { invite, shareImage } from '../lib/share'
import type { ProofKind } from '../lib/types'
import { ALL_GANG_COLORS, burst, haptic } from '../lib/confetti'
import { useSession } from '../lib/session'
import { myLocation } from '../lib/world'
import Globe from './Globe'

interface Props {
  open: boolean
  xp: number
  streak: number | null
  rank: number | null
  /** práve sa odomkli gangy */
  unlocked?: boolean
  /** napr. "+23 kusov odpadu. Svet má spolu 12 453." */
  note?: string
  /** podklady pre kartu do stories */
  story?: { label: string; title: string; proofUrl: string; proofType: ProofKind }
  onClose: () => void
}

export default function Celebration({ open, xp, streak, rank, unlocked = false, note, story, onClose }: Props) {
  const { lang, profile } = useSession()
  const loc = myLocation()
  const [copied, setCopied] = useState(false)
  const [card, setCard] = useState<string | null>(null)

  // kartu pripravíme hneď, aby zdieľanie po ťuknutí išlo okamžite (iPhone inak zdieľanie zablokuje)
  useEffect(() => {
    setCard(null)
    if (!open || !story || !profile) return
    let live = true
    renderStoryCard({
      label: story.label,
      title: story.title,
      proofUrl: story.proofType === 'photo' ? story.proofUrl : null,
      streak,
      city: loc.city,
      username: profile.username,
      lang,
    }).then((url) => live && setCard(url))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, story?.proofUrl])

  useEffect(() => {
    if (!open) return
    haptic(30)
    const t = setTimeout(() => burst(innerWidth / 2, innerHeight * 0.36, ALL_GANG_COLORS, 70, 1.3), 350)
    return () => clearTimeout(t)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] flex flex-col items-center justify-between overflow-hidden bg-void/85 px-6 text-center backdrop-blur-[2px]"
          style={{ paddingTop: 'calc(var(--safe-top) + 40px)', paddingBottom: 'calc(var(--safe-bottom) + 28px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 160 }}
          >
            <Globe size={Math.min(innerWidth - 40, 320)} mine={loc} speed={0.6} />
          </motion.div>

          <div className="space-y-5">
            <motion.div
              className="chip-box mx-auto inline-flex items-baseline gap-2 rounded-[14px] bg-mult px-6 pb-2 pt-3"
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: [0, 1.35, 0.92, 1.06, 1], rotate: [-12, 6, -3, 1, 0] }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <span className="num text-[120px]">+{xp}</span>
              <span className="display text-[44px]">XP</span>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <p className="display-md text-2xl">
                {lang === 'sk' ? `Tvoja bodka svieti nad mestom ${loc.city}.` : `Your dot is live over ${loc.city}.`}
              </p>
              {note && <p className="text-[22px] text-gold">{note}</p>}
              {rank && (
                <p className="text-fog">
                  {lang === 'sk'
                    ? `Si ${rank.toLocaleString('sk')}. človek na svete, ktorý to dnes dal.`
                    : `You are person no. ${rank.toLocaleString('en')} to do it today.`}
                </p>
              )}
            </motion.div>

            {streak !== null && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.75, type: 'spring' }}
                className="glass mx-auto inline-flex items-center gap-2 rounded-full px-5 py-2.5"
              >
                <Flame size={18} className="text-[#FF7A1A]" fill="#FF7A1A" />
                <span className="font-medium">
                  {streak} {lang === 'sk' ? (streak === 1 ? 'deň v sérii' : streak < 5 ? 'dni v sérii' : 'dní v sérii') : 'day streak'}
                </span>
              </motion.div>
            )}
          </div>

          {unlocked && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1.1, 1], opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="chip-box rounded-[12px] bg-gold px-4 pb-2 pt-2.5 text-ink [text-shadow:none]"
            >
              <p className="display text-[30px]">{lang === 'sk' ? 'Odomkli sa ti gangy!' : 'Gangs unlocked!'}</p>
              <p className="text-[19px]">{lang === 'sk' ? 'Pozri sa do profilu — pridať sa nemusíš.' : 'Check your profile — joining is optional.'}</p>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="grid w-full grid-cols-2 gap-2">
            {story && (
              <button
                className="btn btn-iri col-span-2 text-[26px]"
                disabled={!card}
                onClick={() => card && shareImage(card, 'questwave-story.png')}
              >
                {lang === 'sk' ? 'Zdieľať do stories' : 'Share to stories'}
              </button>
            )}
            <button
              className="btn btn-blue text-[24px]"
              onClick={async () => setCopied((await invite(lang)) === 'copied')}
            >
              {copied ? (lang === 'sk' ? 'Skopírované' : 'Copied') : lang === 'sk' ? 'Pozvi kamoša' : 'Invite a friend'}
            </button>
          <motion.button
            className="btn btn-ghost w-full text-[24px]"
            onClick={onClose}
          >
            {lang === 'sk' ? 'Pokračovať' : 'Continue'}
          </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
