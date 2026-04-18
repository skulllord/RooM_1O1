'use client'

import { useEffect, useState, useTransition } from 'react'
import { RefreshCw, Wifi } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

type AdminLiveRefreshProps = {
  intervalMs?: number
  latestBookingId?: string | null
  latestBookingLabel?: string | null
}

export function AdminLiveRefresh({
  intervalMs = 10000,
  latestBookingId,
  latestBookingLabel,
}: AdminLiveRefreshProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  const refresh = () => {
    startTransition(() => {
      router.refresh()
      setLastUpdatedAt(formatTime(new Date()))
    })
  }

  useEffect(() => {
    const refreshFromTimer = () => {
      startTransition(() => {
        router.refresh()
        setLastUpdatedAt(formatTime(new Date()))
      })
    }

    const interval = window.setInterval(refreshFromTimer, intervalMs)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFromTimer()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs, router])

  useEffect(() => {
    if (!latestBookingId) {
      return
    }

    const storageKey = 'dmc-latest-admin-booking-id'
    const previousBookingId = window.localStorage.getItem(storageKey)

    window.localStorage.setItem(storageKey, latestBookingId)

    if (!previousBookingId || previousBookingId === latestBookingId) {
      return
    }

    const message = latestBookingLabel
      ? `New booking confirmed: ${latestBookingLabel}`
      : 'New booking confirmed.'

    const notificationTimer = window.setTimeout(() => {
      setNotificationMessage(message)
    }, 0)

    if (window.Notification?.permission === 'granted') {
      new Notification('RooM_1O1 booking confirmed', {
        body: latestBookingLabel ?? 'A new PS5 booking is ready in the dashboard.',
      })
    }

    return () => window.clearTimeout(notificationTimer)
  }, [latestBookingId, latestBookingLabel])

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      setNotificationMessage('This browser does not support desktop notifications.')
      return
    }

    const permission = await window.Notification.requestPermission()
    setNotificationMessage(
      permission === 'granted'
        ? 'Browser notifications enabled for new bookings.'
        : 'Browser notifications were not enabled. In-app alerts will still work.'
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
        {isPending ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Wifi className="h-3.5 w-3.5" />
        )}
        Live updates every {Math.round(intervalMs / 1000)}s
        <span className="hidden text-emerald-200/70 sm:inline">
          Last sync {lastUpdatedAt ?? '--:--'}
        </span>
      </div>
      <Button
        size="sm"
        type="button"
        variant="outline"
        className="h-8 rounded-full border-emerald-500/25 bg-background/40 text-xs"
        onClick={refresh}
        disabled={isPending}
      >
        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
        Refresh now
      </Button>
      <Button
        size="sm"
        type="button"
        variant="outline"
        className="h-8 rounded-full border-primary/25 bg-background/40 text-xs"
        onClick={requestNotifications}
      >
        Enable booking alerts
      </Button>
      {notificationMessage ? (
        <div className="basis-full rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          {notificationMessage}
        </div>
      ) : null}
    </div>
  )
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
