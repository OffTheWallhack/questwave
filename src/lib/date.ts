/** Denný quest beží na UTC — rovnaký pre celú planétu. */
export function utcToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function msUntilUtcMidnight(): number {
  const now = new Date()
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return next - now.getTime()
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return h + ':' + m + ':' + s
}

/** Vráti nový streak po splnení dnešného questu. */
export function nextStreak(lastDone: string | null, current: number, today: string): number {
  if (!lastDone) return 1
  if (lastDone === today) return current
  const yesterday = new Date(Date.parse(today + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10)
  return lastDone === yesterday ? current + 1 : 1
}
