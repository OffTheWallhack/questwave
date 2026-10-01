import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
}

/** Spodný panel, ktorý sa vysúva zdola — ako v natívnych appkách. */
export default function Sheet({ open, onClose, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92vh] max-w-md overflow-y-auto rounded-t-[14px] border-[3px] border-b-0 border-ink bg-deck"
            style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose()
            }}
          >
            <div className="mx-auto mb-2 mt-3 h-1.5 w-10 rounded-full bg-white/20" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
