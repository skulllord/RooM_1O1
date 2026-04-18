import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { BadgeIndianRupee, CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react'
import { BookingStatus, PaymentStatus } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getBookingDetails } from '@/lib/bookings'
import { getBookingPayment } from '@/lib/payments'
import { formatBookingDate, formatCurrency } from '@/lib/utils'
import { completeMockPayment, rejectMockPayment } from './actions'

type PaymentPageProps = {
  searchParams?: Promise<{
    booking?: string
    error?: string
  }>
}

export default async function BookingPaymentPage({ searchParams }: PaymentPageProps) {
  const params = searchParams ? await searchParams : undefined
  const bookingId = params?.booking

  if (!bookingId) {
    notFound()
  }

  const [booking, payment] = await Promise.all([
    getBookingDetails(bookingId),
    getBookingPayment(bookingId),
  ])

  if (!booking || !payment) {
    notFound()
  }

  if (booking.status === BookingStatus.CONFIRMED && payment.status === PaymentStatus.PAID) {
    redirect(`/book/confirmation?booking=${booking.id}`)
  }

  if (booking.status === BookingStatus.CANCELLED || payment.status === PaymentStatus.FAILED) {
    return (
      <div className="container relative z-10 mx-auto max-w-3xl px-4 py-10">
        <Card className="border-destructive/30 bg-card/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Payment was not completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>This reserved slot was released. Please create a new booking when you are ready.</p>
            <Link href="/">
              <Button>Back to homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const amount = Number(payment.amount)

  return (
    <div className="container relative z-10 mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <Card className="overflow-hidden rounded-[2rem] border-primary/20 bg-card/85 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <CardHeader className="space-y-4 border-b border-border/50 bg-background/30 p-5 sm:p-7">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Smartphone className="h-4 w-4" />
            Mock Razorpay UPI
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Complete UPI payment to confirm your PS5 slot.
            </CardTitle>
            <p className="max-w-2xl text-muted-foreground">
              This is a safe mock checkout for local testing. In the final build, this screen can
              be replaced by Razorpay Checkout while keeping the same booking status flow.
            </p>
          </div>
        </CardHeader>

        <CardContent className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4 rounded-3xl border border-border/50 bg-background/45 p-5">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-xl font-bold text-white">{booking.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Machine</p>
              <p className="font-semibold text-white">{booking.machine.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slot</p>
              <p className="font-semibold text-white">
                {formatBookingDate(booking.startTime)} to {formatBookingDate(booking.endTime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="break-all font-mono text-xs text-white/80">{payment.providerOrderId}</p>
            </div>
          </div>

          <div className="space-y-5 rounded-3xl border border-primary/25 bg-primary/10 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-primary">Amount payable</p>
                <p className="text-4xl font-black text-white">{formatCurrency(amount)}</p>
              </div>
              <div className="rounded-2xl bg-background/60 p-4 text-primary">
                <BadgeIndianRupee className="h-8 w-8" />
              </div>
            </div>

            {params?.error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Payment could not be confirmed. Please try again.
              </div>
            ) : null}

            <div className="rounded-2xl border border-border/50 bg-background/50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                <p className="text-sm text-muted-foreground">
                  Mock success acts like a verified Razorpay webhook. It marks payment as paid and
                  confirms the booking on the server.
                </p>
              </div>
            </div>

            <form action={completeMockPayment}>
              <input name="bookingId" type="hidden" value={booking.id} />
              <Button className="h-13 w-full rounded-2xl text-base font-bold" type="submit">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Mock Pay with UPI
              </Button>
            </form>

            <form action={rejectMockPayment}>
              <input name="bookingId" type="hidden" value={booking.id} />
              <Button className="w-full rounded-2xl" type="submit" variant="outline">
                Simulate failed payment
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
