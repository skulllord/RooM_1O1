import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  CalendarCheck2,
  CircleDollarSign,
  Clock3,
  Gamepad2,
  Phone,
  ReceiptText,
  UserRound,
} from 'lucide-react'

import { RemainingTime } from '@/components/booking/remaining-time'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getBookingDetails, machineCatalog } from '@/lib/bookings'
import { getBookingPayment } from '@/lib/payments'
import { formatBookingDate, formatCurrency } from '@/lib/utils'

type ConfirmationPageProps = {
  searchParams?: Promise<{
    booking?: string
  }>
}

export default async function BookingConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const params = searchParams ? await searchParams : undefined
  const bookingId = params?.booking

  if (!bookingId) {
    notFound()
  }

  const [booking, payment] = await Promise.all([
    getBookingDetails(bookingId),
    getBookingPayment(bookingId),
  ])

  if (!booking) {
    notFound()
  }

  const machineConfig = machineCatalog.find((machine) => machine.name === booking.machine.name)
  const totalAmount = machineConfig ? machineConfig.hourlyRate * bookingHours(booking) : 0

  return (
    <div className="container relative z-10 mx-auto max-w-4xl px-4 py-10">
      <Card className="overflow-hidden border-border/50 bg-card/75 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
        <CardHeader className="space-y-4 border-b border-border/50 bg-background/30">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
            <CalendarCheck2 className="h-4 w-4" />
            Booking confirmed
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-white">
              {booking.customer.name}, your PS5 booking is confirmed.
            </CardTitle>
            <p className="max-w-2xl text-muted-foreground">
              Your slot is saved with your name, machine, time, and booking reference.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailCard
                icon={<Gamepad2 className="h-5 w-5 text-primary" />}
                label="Machine"
                value={booking.machine.name}
              />
              <DetailCard
                icon={<Clock3 className="h-5 w-5 text-primary" />}
                label="Time Slot"
                value={`${formatBookingDate(booking.startTime)} to ${formatBookingDate(
                  booking.endTime
                )}`}
              />
              <DetailCard
                icon={<UserRound className="h-5 w-5 text-primary" />}
                label="Booked By"
                value={booking.customer.name}
              />
              <DetailCard
                icon={<Phone className="h-5 w-5 text-primary" />}
                label="Contact"
                value={
                  booking.customer.phoneNumber ||
                  booking.customer.email ||
                  'Saved to your booking'
                }
              />
            </div>

            <div className="space-y-4 rounded-3xl border border-primary/20 bg-background/40 p-5">
              <div>
                <p className="text-sm text-muted-foreground">Booking reference</p>
                <p className="mt-1 font-mono text-sm text-white">{booking.id}</p>
              </div>
              <RemainingTime startTime={booking.startTime} endTime={booking.endTime} />
              <div className="rounded-2xl border border-border/50 bg-background/50 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CircleDollarSign className="h-4 w-4 text-primary" />
                  Payment
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-300">
                  {payment?.status === 'PAID' ? 'Paid via mock UPI' : 'Payment pending'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ReceiptText className="h-4 w-4 text-primary" />
              What happens next
            </div>
            <p className="mt-2 text-sm text-white/90">
              Reach the cafe a few minutes before your slot and share your name or booking
              reference at the counter.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/">
              <Button>Back to homepage</Button>
            </Link>
            <Link href={`/book?machine=${machineConfig?.slug ?? 'ps5-1'}`}>
              <Button variant="outline">Book another session</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function bookingHours(booking: Awaited<ReturnType<typeof getBookingDetails>>) {
  if (!booking) {
    return 0
  }

  return Math.max(
    1,
    Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / 3600000)
  )
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/45 p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  )
}
