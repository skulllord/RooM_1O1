'use server'

import { BookingStatus, MachineStatus, Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'
import { setCustomerSession } from '@/lib/customer-session'
import {
  ensureDefaultMachines,
  getMachineConfigBySlug,
  isDatabaseUnavailable,
  withDatabaseRetry,
} from '@/lib/bookings'
import {
  formatBookingDate,
  formatCurrency,
  parseLocalDateTime,
} from '@/lib/utils'
import { createRazorpayOrder, ensureBookingPaymentSchema } from '@/lib/payments'

export type BookingActionState = {
  error?: string
  success?: string
  bookingId?: string
  paymentUrl?: string
}

export async function createBooking(
  _previousState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const machineSlug = String(formData.get('machineSlug') ?? '')
  const customerName = String(formData.get('customerName') ?? '').trim()
  const emailRaw = String(formData.get('email') ?? '').trim().toLowerCase()
  const phoneRaw = String(formData.get('phoneNumber') ?? '').trim()
  const startDateTimeRaw = String(formData.get('startDateTime') ?? '').trim()
  const timezoneOffsetRaw = Number(formData.get('timezoneOffsetMinutes') ?? '0')
  const hoursRaw = Number(formData.get('hours') ?? '1')

  const machineConfig = getMachineConfigBySlug(machineSlug)

  if (!machineConfig) {
    return { error: 'Please choose a valid PS5 station.' }
  }

  if (customerName.length < 2) {
    return { error: 'Please enter your full name.' }
  }

  if (!emailRaw && !phoneRaw) {
    return { error: 'Please provide either an email address or phone number.' }
  }

  if (!Number.isInteger(hoursRaw) || hoursRaw < 1 || hoursRaw > 12) {
    return { error: 'Booking duration must be between 1 and 12 hours.' }
  }

  const startTime = parseLocalDateTime(
    startDateTimeRaw,
    Number.isNaN(timezoneOffsetRaw) ? 0 : timezoneOffsetRaw
  )

  if (!startTime || Number.isNaN(startTime.getTime())) {
    return { error: 'Please choose a valid booking date and time.' }
  }

  if (startTime.getTime() <= Date.now()) {
    return { error: 'Bookings must be scheduled for a future time.' }
  }

  if (startTime.getHours() < 10) {
    return { error: 'The gaming cafe is closed at this time. Bookings are available from 10:00 AM to 12:00 AM.' }
  }

  const endTime = new Date(startTime.getTime() + hoursRaw * 60 * 60 * 1000)
  
  const midnight = new Date(startTime)
  midnight.setHours(24, 0, 0, 0)
  
  if (endTime.getTime() > midnight.getTime()) {
    return { error: 'Your booking exceeds our closing time of 12:00 AM (midnight). Please reduce the hours or pick an earlier time.' }
  }

  const totalAmount = machineConfig.hourlyRate * hoursRaw

  try {
    await ensureBookingPaymentSchema()

    const booking = await withDatabaseRetry(() =>
      prisma.$transaction(async (tx) => {
        await ensureDefaultMachines(tx)

        const machine = await tx.machine.findUnique({
          where: { name: machineConfig.name },
        })

        if (!machine) {
          throw new Error('Selected machine is not available right now.')
        }

        if (machine.status === MachineStatus.MAINTENANCE) {
          throw new Error('This machine is currently under maintenance.')
        }

        const overlappingBooking = await tx.booking.findFirst({
          where: {
            machineId: machine.id,
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
            },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        })

        if (overlappingBooking) {
          throw new Error('That time slot has already been booked. Please choose another slot.')
        }

        const customer = emailRaw
          ? await tx.customer.upsert({
              where: { email: emailRaw },
              update: {
                name: customerName,
                phoneNumber: phoneRaw || null,
              },
              create: {
                name: customerName,
                email: emailRaw,
                phoneNumber: phoneRaw || null,
              },
            })
          : phoneRaw
            ? await upsertCustomerByPhone(tx, phoneRaw, customerName)
            : null

        if (!customer) {
          throw new Error('Unable to create the customer profile for this booking.')
        }

        const booking = await tx.booking.create({
          data: {
            machineId: machine.id,
            customerId: customer.id,
            startTime,
            endTime,
            status: BookingStatus.PENDING,
          },
          include: {
            machine: true,
            customer: true,
          },
        })

        await createRazorpayOrder({
          bookingId: booking.id,
          amount: totalAmount,
          db: tx,
        })

        return booking
      })
    )

    await setCustomerSession(booking.customer.id)

    return {
      bookingId: booking.id,
      paymentUrl: `/book/payment?booking=${booking.id}`,
      success: `${booking.customer.name}, your slot is reserved for ${booking.machine.name} on ${formatBookingDate(
        booking.startTime
      )}. Complete mock UPI payment of ${formatCurrency(totalAmount)} to confirm it.`,
    }
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return {
        error: 'Booking service is temporarily offline because the database is not connected yet.',
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: 'We could not save the booking right now. Please try again.' }
    }

    return {
      error: error instanceof Error ? error.message : 'Something went wrong while booking.',
    }
  }
}

async function upsertCustomerByPhone(
  tx: Prisma.TransactionClient,
  phoneNumber: string,
  customerName: string
) {
  const existingCustomer = await tx.customer.findFirst({
    where: { phoneNumber },
  })

  if (existingCustomer) {
    return tx.customer.update({
      where: { id: existingCustomer.id },
      data: {
        name: customerName,
        phoneNumber,
      },
    })
  }

  return tx.customer.create({
    data: {
      name: customerName,
      phoneNumber,
    },
  })
}
