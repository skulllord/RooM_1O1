import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseLocalDateTime(input: string, timezoneOffsetMinutes: number) {
  const [datePart, timePart] = input.split('T')

  if (!datePart || !timePart) {
    return null
  }

  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
    return null
  }

  const utcTime =
    Date.UTC(year, month - 1, day, hour, minute) + timezoneOffsetMinutes * 60 * 1000

  return new Date(utcTime)
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatBookingDate(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export type RemainingTimeState = 'upcoming' | 'active' | 'completed'

export type RemainingTimeSummary = {
  state: RemainingTimeState
  label: string
  remainingMs: number
}

export function getRemainingTimeSummary(
  startTime: string | Date,
  endTime: string | Date,
  now = new Date()
): RemainingTimeSummary {
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (now < start) {
    return {
      state: 'upcoming',
      label: 'Starts in',
      remainingMs: start.getTime() - now.getTime(),
    }
  }

  if (now >= start && now < end) {
    return {
      state: 'active',
      label: 'Time remaining',
      remainingMs: end.getTime() - now.getTime(),
    }
  }

  return {
    state: 'completed',
    label: 'Booking ended',
    remainingMs: 0,
  }
}

export function formatRemainingTime(
  remainingMs: number,
  state: RemainingTimeState
) {
  if (state === 'completed') {
    return 'Session complete'
  }

  const totalMinutes = Math.max(0, Math.ceil(remainingMs / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}
