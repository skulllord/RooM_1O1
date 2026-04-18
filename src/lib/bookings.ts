import {
  MachineStatus,
  Prisma,
  type Booking,
  type Customer,
  type Machine,
} from '@prisma/client'

import prisma from '@/lib/prisma'

export const machineCatalog = [
  {
    slug: 'ps5-1',
    name: 'PS5 Station 1',
    controller: 'DualSense Controller',
    hourlyRate: 150,
  },
  {
    slug: 'ps5-2',
    name: 'PS5 Station 2',
    controller: 'DualSense Controller',
    hourlyRate: 150,
  },
] as const

export type MachineSlug = (typeof machineCatalog)[number]['slug']

type DbClient = typeof prisma | Prisma.TransactionClient
type CustomerMachineCard = {
  id: string
  slug: string
  name: string
  controller: string
  hourlyRate: number
  isBookable: boolean
  statusLabel: string
}

let defaultMachinesSeed: Promise<void> | null = null

export function getMachineConfigBySlug(slug: string | null | undefined) {
  return machineCatalog.find((machine) => machine.slug === slug) ?? null
}

export async function ensureDefaultMachines(db: DbClient = prisma) {
  if (db === prisma) {
    defaultMachinesSeed ??= seedDefaultMachines(db).catch((error) => {
      defaultMachinesSeed = null
      throw error
    })

    return defaultMachinesSeed
  }

  return seedDefaultMachines(db)
}

async function seedDefaultMachines(db: DbClient) {
  for (const machine of machineCatalog) {
    await db.machine.upsert({
      where: { name: machine.name },
      update: {
        hourlyRate: new Prisma.Decimal(machine.hourlyRate),
      },
      create: {
        name: machine.name,
        hourlyRate: new Prisma.Decimal(machine.hourlyRate),
      },
    })
  }
}

export async function getCustomerMachines() {
  try {
    return await withDatabaseRetry(async () => {
      await ensureDefaultMachines()

      const machines = await prisma.machine.findMany({
        orderBy: { name: 'asc' },
      })

      return machines.map((machine) => {
        const config = machineCatalog.find((item) => item.name === machine.name)

        return {
          id: machine.id,
          slug: config?.slug ?? machine.name.toLowerCase().replace(/\s+/g, '-'),
          name: machine.name,
        controller: config?.controller ?? 'DualSense Controller',
          hourlyRate: Number(machine.hourlyRate),
          isBookable: machine.status !== MachineStatus.MAINTENANCE,
          statusLabel:
            machine.status === MachineStatus.MAINTENANCE ? 'Maintenance' : 'Available for booking',
        }
      })
    })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return getFallbackMachines('Booking service offline')
    }

    throw error
  }
}

// Functions moved to @/lib/utils

export async function getBookingDetails(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      machine: true,
    },
  })
}

export type BookingRecord = Booking & {
  customer: Customer
  machine: Machine
}

export function isDatabaseUnavailable(error: unknown) {
  if (!error) {
    return false
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ['ECONNREFUSED', 'P1001', 'P1002', 'P1017'].includes(error.code.toUpperCase())
  ) {
    return true
  }

  const message = getErrorText(error).toLowerCase()

  return (
    message.includes('econnrefused') ||
    message.includes('connectionclosed') ||
    message.includes('connection closed') ||
    message.includes('server has closed the connection') ||
    message.includes("can't reach database server") ||
    message.includes('database server') ||
    message.includes('terminating connection')
  )
}

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name} ${error.message} ${error.stack ?? ''} ${JSON.stringify(error, null, 2)}`
  }

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export function getFallbackMachines(statusLabel = 'Database offline'): CustomerMachineCard[] {
  return machineCatalog.map((machine) => ({
    id: machine.slug,
    slug: machine.slug,
    name: machine.name,
    controller: machine.controller,
    hourlyRate: machine.hourlyRate,
    isBookable: false,
    statusLabel,
  }))
}

export async function withDatabaseRetry<T>(operation: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error
    }

    await prisma.$disconnect().catch(() => undefined)

    return operation()
  }
}
