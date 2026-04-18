'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'

import type { BookingActionState } from '@/app/(customer)/book/actions'
import { createBooking } from '@/app/(customer)/book/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

const initialState: BookingActionState = {}

type BookingFormProps = {
  machineSlug: string
  machineName: string
  hourlyRate: number
}

export function BookingForm({ machineSlug, machineName, hourlyRate }: BookingFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(createBooking, initialState)
  const [hours, setHours] = useState(1)
  const [initialDateTime] = useState(() => getInitialBookingDateTime().local)
  const [timezoneOffsetMinutes] = useState(() =>
    getInitialBookingDateTime().timezoneOffsetMinutes
  )

  useEffect(() => {
    if (state.paymentUrl) {
      router.push(state.paymentUrl)
    }
  }, [router, state.paymentUrl])

  const totalAmount = useMemo(() => hourlyRate * hours, [hourlyRate, hours])

  return (
    <form action={formAction} className="space-y-5 sm:space-y-6">
      <input name="machineSlug" type="hidden" value={machineSlug} />
      <input name="hours" type="hidden" value={hours} />
      <input name="timezoneOffsetMinutes" type="hidden" value={timezoneOffsetMinutes} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customerName">Your name</Label>
          <Input
            id="customerName"
            name="customerName"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" placeholder="you@example.com" type="email" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone number</Label>
          <Input id="phoneNumber" name="phoneNumber" placeholder="98765 43210" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="startDateTime">Booking start time (10 AM to 12 AM)</Label>
          <Input
            id="startDateTime"
            name="startDateTime"
            type="datetime-local"
            min={initialDateTime}
            defaultValue={initialDateTime}
            required
          />
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-primary/20 bg-[#050914]/80 p-4 shadow-[0_0_35px_-28px_hsl(var(--primary))]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Selected machine</p>
            <p className="text-lg font-semibold text-white">{machineName}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-muted-foreground">Hourly rate</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(hourlyRate)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              min={1}
              max={12}
              step={1}
              value={hours}
              onChange={(event) =>
                setHours(Math.min(12, Math.max(1, Number(event.target.value) || 1)))
              }
              className="max-w-28"
            />
          </div>

          <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 sm:text-right">
            <p className="text-sm text-muted-foreground">Estimated total</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      </div>

      {state.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {state.success}
        </div>
      ) : null}

      <SubmitButton totalAmount={totalAmount} />
    </form>
  )
}

function SubmitButton({ totalAmount }: { totalAmount: number }) {
  const { pending } = useFormStatus()

  return (
    <Button
      className="h-12 w-full rounded-full bg-primary text-base font-black text-primary-foreground shadow-[0_0_32px_-10px_hsl(var(--primary))] hover:bg-primary/90"
      size="lg"
      type="submit"
      disabled={pending}
    >
      {pending ? 'Creating payment order...' : `Continue to UPI payment ${formatCurrency(totalAmount)}`}
    </Button>
  )
}

function getInitialBookingDateTime() {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 60)
  now.setSeconds(0, 0)

  const roundedMinutes = Math.ceil(now.getMinutes() / 30) * 30
  now.setMinutes(roundedMinutes)

  if (roundedMinutes === 60) {
    now.setHours(now.getHours() + 1, 0, 0, 0)
  }

  return {
    local: new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    timezoneOffsetMinutes: String(now.getTimezoneOffset()),
  }
}
