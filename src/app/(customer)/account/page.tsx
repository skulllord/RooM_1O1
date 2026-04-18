import { redirect } from 'next/navigation'
import { CalendarCheck2, LogOut, UserRound } from 'lucide-react'

import { CustomerProfileForm } from '@/components/customer/customer-account-forms'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentCustomerSession } from '@/lib/customer-session'
import prisma from '@/lib/prisma'
import { formatBookingDate } from '@/lib/utils'
import { signOutCustomer } from './actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomerAccountPage() {
  const session = await getCurrentCustomerSession()

  if (!session) {
    return (
      <div className="container relative z-10 mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 rounded-[2rem] border border-primary/20 bg-card/50 p-5 backdrop-blur-xl">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black text-white">Customer login</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create an account with a password, then login anytime to see past bookings and edit
            your details.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="rounded-[2rem] border-primary/20 bg-card/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Login</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use phone/email and password to open your profile.
              </p>
            </CardHeader>
            <CardContent>
            <CustomerProfileForm mode="login" />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-primary/20 bg-card/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Create account</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create a password-protected profile for future bookings.
              </p>
            </CardHeader>
            <CardContent>
              <CustomerProfileForm mode="register" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    include: {
      bookings: {
        include: { machine: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!customer) {
    redirect('/')
  }

  return (
    <div className="container relative z-10 mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Player profile
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Hi, {customer.name}</h1>
        </div>
        <form action={signOutCustomer}>
          <Button variant="outline" type="submit">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-[2rem] border-border/50 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Edit details</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerProfileForm
              mode="edit"
              customer={{
                name: customer.name,
                phoneNumber: customer.phoneNumber,
                email: customer.email,
              }}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/50 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Past bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-border/50 bg-background/45 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{booking.machine.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatBookingDate(booking.startTime)} to {formatBookingDate(booking.endTime)}
                    </p>
                  </div>
                  <div className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {booking.status}
                  </div>
                </div>
              </div>
            ))}
            {customer.bookings.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-background/45 p-4 text-sm text-muted-foreground">
                <CalendarCheck2 className="mb-2 h-5 w-5 text-primary" />
                No bookings yet. Book a PS5 and it will appear here.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
