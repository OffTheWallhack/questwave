import { useEffect, useState } from 'react'
import { formatCountdown, msUntilUtcMidnight } from '../lib/date'

export default function Countdown({ onExpire }: { onExpire?: () => void }) {
  const [ms, setMs] = useState(msUntilUtcMidnight())

  useEffect(() => {
    const id = setInterval(() => {
      const left = msUntilUtcMidnight()
      setMs(left)
      if (left <= 1000 && onExpire) onExpire()
    }, 1000)
    return () => clearInterval(id)
  }, [onExpire])

  return <span className="tabular-nums">{formatCountdown(ms)}</span>
}
