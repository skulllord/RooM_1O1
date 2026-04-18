import { randomUUID } from 'crypto'
import crypto from 'crypto'
import Razorpay from 'razorpay'

import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client'

import prisma from '@/lib/prisma'

export const PAYMENT_PROVIDER = 'RAZORPAY'

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  })
}

export type BookingPaymentRecord = {
  id: string
  bookingId: string
  amount: Prisma.Decimal
  currency: string
  status: PaymentStatus
  provider: string
  providerOrderId: string
  providerPaymentId: string | null
  providerSignature: string | null
  rawPayload: unknown | null
  createdAt: Date
  updatedAt: Date
}

let bookingPaymentSchemaReady: Promise<void> | null = null
type PaymentDbClient = typeof prisma | Prisma.TransactionClient

export async function ensureBookingPaymentSchema() {
  bookingPaymentSchemaReady ??= prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "BookingPayment" (
      id TEXT PRIMARY KEY,
      "bookingId" TEXT NOT NULL UNIQUE,
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      status "PaymentStatus" NOT NULL DEFAULT 'PENDING',
      provider TEXT NOT NULL DEFAULT 'MOCK_RAZORPAY',
      "providerOrderId" TEXT NOT NULL UNIQUE,
      "providerPaymentId" TEXT,
      "providerSignature" TEXT,
      "rawPayload" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "BookingPayment_bookingId_fkey"
        FOREIGN KEY ("bookingId") REFERENCES "Booking"(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `.then(async () => {
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "BookingPayment_status_createdAt_idx"
      ON "BookingPayment"(status, "createdAt")
    `
  }).catch((error) => {
    bookingPaymentSchemaReady = null
    throw error
  })

  return bookingPaymentSchemaReady
}

export async function createRazorpayOrder({
  bookingId,
  amount,
  db = prisma,
}: {
  bookingId: string
  amount: number
  db?: PaymentDbClient
}) {
  if (db === prisma) {
    await ensureBookingPaymentSchema()
  }

  const razorpay = getRazorpayInstance()
  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Amount in paise
    currency: 'INR',
    receipt: bookingId.slice(0, 40),
  })

  const paymentId = randomUUID()
  const providerOrderId = (rzpOrder as any).id as string

  const rows = await db.$queryRaw<BookingPaymentRecord[]>`
    INSERT INTO "BookingPayment" (
      id,
      "bookingId",
      amount,
      currency,
      status,
      provider,
      "providerOrderId"
    )
    VALUES (
      ${paymentId},
      ${bookingId},
      ${new Prisma.Decimal(amount)},
      'INR',
      CAST(${PaymentStatus.PENDING} AS "PaymentStatus"),
      ${PAYMENT_PROVIDER},
      ${providerOrderId}
    )
    ON CONFLICT ("bookingId") DO UPDATE SET
      amount = EXCLUDED.amount,
      status = CAST(${PaymentStatus.PENDING} AS "PaymentStatus"),
      provider = EXCLUDED.provider,
      "providerOrderId" = EXCLUDED."providerOrderId",
      "providerPaymentId" = null,
      "providerSignature" = null,
      "rawPayload" = null,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING *
  `

  return rows[0] ?? null
}

export async function getBookingPayment(bookingId: string) {
  await ensureBookingPaymentSchema()

  const rows = await prisma.$queryRaw<BookingPaymentRecord[]>`
    SELECT *
    FROM "BookingPayment"
    WHERE "bookingId" = ${bookingId}
    LIMIT 1
  `

  return rows[0] ?? null
}

export async function confirmRazorpayPayment(bookingId: string, providerPaymentId: string, providerSignature: string) {
  await ensureBookingPaymentSchema()

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        machine: true,
      },
    })

    if (!booking) {
      throw new Error('Booking was not found.')
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      throw new Error('This booking is already closed.')
    }

    const payment = await tx.$queryRaw<{ providerOrderId: string }[]>`
      SELECT "providerOrderId" FROM "BookingPayment" WHERE "bookingId" = ${bookingId} LIMIT 1
    `
    const providerOrderId = payment[0]?.providerOrderId

    if (!providerOrderId) throw new Error('Payment record not found.')

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${providerOrderId}|${providerPaymentId}`)
      .digest('hex')

    if (expectedSignature !== providerSignature) {
      throw new Error('Invalid payment signature')
    }

    await tx.$executeRaw`
      UPDATE "BookingPayment"
      SET
        status = CAST(${PaymentStatus.PAID} AS "PaymentStatus"),
        "providerPaymentId" = ${providerPaymentId},
        "providerSignature" = ${providerSignature},
        "rawPayload" = ${JSON.stringify({
          event: 'payment.captured',
          providerPaymentId,
          paidAt: new Date().toISOString(),
        })}::jsonb,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "bookingId" = ${bookingId}
    `

    return tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
      include: {
        customer: true,
        machine: true,
      },
    })
  })
}

export async function failRazorpayPayment(bookingId: string, rawPayload: any = null) {
  await ensureBookingPaymentSchema()

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE "BookingPayment"
      SET
        status = CAST(${PaymentStatus.FAILED} AS "PaymentStatus"),
        "rawPayload" = ${JSON.stringify({
          event: 'payment.failed',
          payload: rawPayload,
          failedAt: new Date().toISOString(),
        })}::jsonb,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "bookingId" = ${bookingId}
    `

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    })
  })
}
