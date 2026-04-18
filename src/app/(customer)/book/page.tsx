import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, MonitorPlay } from 'lucide-react'

import { BookingForm } from '@/components/booking/booking-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ensureDefaultMachines,
  getMachineConfigBySlug,
  isDatabaseUnavailable,
} from '@/lib/bookings'
import prisma from '@/lib/prisma'

type BookPageProps = {
  searchParams?: Promise<{
    machine?: string
  }>
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = searchParams ? await searchParams : undefined
  const machineSlug = params?.machine ?? 'ps5-1'
  const machineConfig = getMachineConfigBySlug(machineSlug)

  if (!machineConfig) {
    notFound()
  }

  let hourlyRate: number = machineConfig.hourlyRate
  let databaseOffline = false

  try {
    await ensureDefaultMachines()

    const machine = await prisma.machine.findUnique({
      where: { name: machineConfig.name },
    })

    if (!machine) {
      notFound()
    }

    hourlyRate = Number(machine.hourlyRate)
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      databaseOffline = true
    } else {
      throw error
    }
  }

  return (
    <div className="container relative z-10 mx-auto max-w-3xl px-4 py-8 animate-in fade-in duration-500">
      <Link
        href="/#stations"
        className="mb-6 inline-flex items-center rounded-full border border-border/50 bg-background/50 px-3 py-1.5 text-sm text-foreground transition-colors hover:text-primary backdrop-blur-md"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Available Stations
      </Link>

      <Card className="relative overflow-hidden border-border/50 bg-card/60 shadow-2xl backdrop-blur-md">
        <div className="pointer-events-none absolute top-0 right-0 rounded-full bg-primary/10 p-32 blur-[100px]" />
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Secure Your Console</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Reserve {machineConfig.name} instantly and get a real confirmation tied to your name.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-8">
          <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-background/80 p-5 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.2)]">
            <div className="rounded-lg bg-primary/20 p-3">
              <MonitorPlay className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{machineConfig.name}</h3>
              <p className="mt-1 flex items-center text-sm font-medium text-muted-foreground">
                <Clock className="mr-1.5 h-4 w-4 text-primary" />
                Base Rate: Rs. {hourlyRate} per hour
              </p>
            </div>
          </div>

          {databaseOffline ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-200">
              Booking service is temporarily offline because the database connection is not
              available yet.
            </div>
          ) : (
            <BookingForm
              machineSlug={machineSlug}
              machineName={machineConfig.name}
              hourlyRate={hourlyRate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
