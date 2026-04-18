'use server'

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import prisma from '@/lib/prisma'
import {
  CUSTOMER_SESSION_COOKIE,
  getCurrentCustomerSession,
  setCustomerSession,
} from '@/lib/customer-session'
import { isDatabaseUnavailable, withDatabaseRetry } from '@/lib/bookings'

export type CustomerAccountState = {
  error?: string
  success?: string
}

type CredentialRow = {
  customerId: string
  passwordHash: string
  salt: string
}

export async function registerCustomer(
  _previousState: CustomerAccountState,
  formData: FormData
): Promise<CustomerAccountState> {
  const name = String(formData.get('name') ?? '').trim()
  const phoneNumber = String(formData.get('phoneNumber') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (name.length < 2) {
    return { error: 'Please enter your name.' }
  }

  if (!phoneNumber && !email) {
    return { error: 'Please enter phone number or email.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  try {
    const customer = await withDatabaseRetry(async () => {
      const existingCustomer = email
        ? await prisma.customer.findUnique({ where: { email } })
        : await prisma.customer.findFirst({ where: { phoneNumber } })

      if (existingCustomer) {
        const existingCredential = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "CustomerCredential" WHERE "customerId" = ${existingCustomer.id} LIMIT 1
        `

        if (existingCredential.length > 0) {
          throw new Error('This profile already has a password. Please login instead.')
        }
      }

      if (email) {
        const savedCustomer = await prisma.customer.upsert({
          where: { email },
          update: { name, phoneNumber: phoneNumber || null },
          create: { name, email, phoneNumber: phoneNumber || null },
        })

        await createCredential(savedCustomer.id, password)

        return savedCustomer
      }

      const phoneCustomer = await prisma.customer.findFirst({
        where: { phoneNumber },
      })

      if (phoneCustomer) {
        const savedCustomer = await prisma.customer.update({
          where: { id: phoneCustomer.id },
          data: { name, phoneNumber },
        })

        await createCredential(savedCustomer.id, password)

        return savedCustomer
      }

      const savedCustomer = await prisma.customer.create({
        data: { name, phoneNumber },
      })

      await createCredential(savedCustomer.id, password)

      return savedCustomer
    })

    await setCustomerSession(customer.id)
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return { error: 'Profile service is offline. Please try again.' }
    }

    return { error: error instanceof Error ? error.message : 'Could not create profile.' }
  }

  redirect('/account')
}

export async function loginCustomer(
  _previousState: CustomerAccountState,
  formData: FormData
): Promise<CustomerAccountState> {
  const identifier = String(formData.get('identifier') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!identifier || !password) {
    return { error: 'Enter phone/email and password.' }
  }

  try {
    const customer = await withDatabaseRetry(async () => {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [{ email: identifier }, { phoneNumber: identifier }],
        },
      })

      if (!existingCustomer) {
        throw new Error('No account found with those details.')
      }

      const credentials = await prisma.$queryRaw<CredentialRow[]>`
        SELECT "customerId", "passwordHash", salt
        FROM "CustomerCredential"
        WHERE "customerId" = ${existingCustomer.id}
        LIMIT 1
      `
      const credential = credentials[0]

      if (!credential || !verifyPassword(password, credential.salt, credential.passwordHash)) {
        throw new Error('Invalid phone/email or password.')
      }

      return existingCustomer
    })

    await setCustomerSession(customer.id)
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return { error: 'Profile service is offline. Please try again.' }
    }

    return { error: error instanceof Error ? error.message : 'Could not login.' }
  }

  redirect('/account')
}

export async function updateCustomerProfile(
  _previousState: CustomerAccountState,
  formData: FormData
): Promise<CustomerAccountState> {
  const session = await getCurrentCustomerSession()

  if (!session) {
    return { error: 'Please login first.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  const phoneNumber = String(formData.get('phoneNumber') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (name.length < 2) {
    return { error: 'Please enter your name.' }
  }

  await prisma.customer.update({
    where: { id: session.customerId },
    data: {
      name,
      phoneNumber: phoneNumber || null,
      email: email || null,
    },
  })

  revalidatePath('/account')

  return { success: 'Profile updated.' }
}

export async function signOutCustomer() {
  const cookieStore = await cookies()

  cookieStore.delete(CUSTOMER_SESSION_COOKIE)
  redirect('/')
}

async function createCredential(customerId: string, password: string) {
  const salt = randomBytes(16).toString('hex')
  const passwordHash = hashPassword(password, salt)

  await prisma.$executeRaw`
    INSERT INTO "CustomerCredential" (id, "customerId", "passwordHash", salt, "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${customerId}, ${passwordHash}, ${salt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex')
}

function verifyPassword(password: string, salt: string, passwordHash: string) {
  const expectedHash = Buffer.from(passwordHash, 'hex')
  const actualHash = Buffer.from(hashPassword(password, salt), 'hex')

  return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash)
}
