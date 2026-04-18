'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  formatRemainingTime,
  getRemainingTimeSummary,
} from '@/lib/utils'

type RemainingTimeProps = {
  startTime: string | Date
  endTime: string | Date
  compact?: boolean
}

export function RemainingTime({
  startTime,
  endTime,
  compact = false,
}: RemainingTimeProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => window.clearInterval(interval)
  }, [])

  const summary = useMemo(
    () => getRemainingTimeSummary(startTime, endTime, now),
    [endTime, now, startTime]
  )

  const toneClass =
    summary.state === 'active'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : summary.state === 'upcoming'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : 'border-border/50 bg-background/40 text-muted-foreground'

  if (compact) {
    return (
      <div className={`rounded-lg border px-3 py-2 text-xs ${toneClass}`}>
        <p className="font-medium">{summary.label}</p>
        <p>{formatRemainingTime(summary.remainingMs, summary.state)}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClass}`}>
      <p className="text-sm">{summary.label}</p>
      <p className="mt-1 text-xl font-bold">
        {formatRemainingTime(summary.remainingMs, summary.state)}
      </p>
    </div>
  )
}
