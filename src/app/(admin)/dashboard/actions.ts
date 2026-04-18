'use server'

import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

import { BookingStatus, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import prisma from '@/lib/prisma'
import { isDatabaseUnavailable } from '@/lib/bookings'

const editableStatuses = new Set<BookingStatus>([
  BookingStatus.CONFIRMED,
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
])

export async function updateBookingStatus(formData: FormData) {
  const bookingId = String(formData.get('bookingId') ?? '')
  const status = String(formData.get('status') ?? '') as BookingStatus

  if (!bookingId || !editableStatuses.has(status)) {
    return
  }

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    })
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error
    }
  }

  revalidatePath('/dashboard')
}

export type FoodItemActionState = {
  error?: string
  success?: string
}

export async function addFoodItem(
  _previousState: FoodItemActionState,
  formData: FormData
): Promise<FoodItemActionState> {
  const name = String(formData.get('name') ?? '').trim()
  const price = Number(formData.get('price') ?? '0')
  const image = formData.get('image')

  if (name.length < 2) {
    return { error: 'Enter a valid food item name.' }
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { error: 'Enter a valid price greater than zero.' }
  }

  try {
    const imageUrl = image instanceof File && image.size > 0 ? await saveFoodImage(image) : null

    await prisma.$executeRaw`
      INSERT INTO "FoodItem" (id, name, price, "imageUrl", "isAvailable", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${name}, ${new Prisma.Decimal(price)}, ${imageUrl}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    revalidatePath('/')
    revalidatePath('/dashboard')

    return { success: `${name} added to the customer food menu.` }
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return { error: 'Database is offline. Start the database and try again.' }
    }

    return {
      error: error instanceof Error ? error.message : 'Unable to add food item right now.',
    }
  }
}

export async function updateFoodItem(formData: FormData) {
  const foodItemId = String(formData.get('foodItemId') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const price = Number(formData.get('price') ?? '0')
  const image = formData.get('image')

  if (!foodItemId || name.length < 2 || !Number.isFinite(price) || price <= 0) {
    return
  }

  const imageUrl = image instanceof File && image.size > 0 ? await saveFoodImage(image) : null

  if (imageUrl) {
    await prisma.$executeRaw`
      UPDATE "FoodItem"
      SET name = ${name},
          price = ${new Prisma.Decimal(price)},
          "imageUrl" = ${imageUrl},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${foodItemId}
    `
  } else {
    await prisma.$executeRaw`
      UPDATE "FoodItem"
      SET name = ${name},
          price = ${new Prisma.Decimal(price)},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${foodItemId}
    `
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
}

export async function removeFoodItem(formData: FormData) {
  const foodItemId = String(formData.get('foodItemId') ?? '')

  if (!foodItemId) {
    return
  }

  await prisma.$executeRaw`
    UPDATE "FoodItem"
    SET "isAvailable" = false,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${foodItemId}
  `

  revalidatePath('/')
  revalidatePath('/dashboard')
}

export async function updateAdminProfile(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const image = formData.get('image')

  if (name.length < 2) {
    return
  }

  const imageUrl = image instanceof File && image.size > 0 ? await saveAdminImage(image) : null

  if (imageUrl) {
    await prisma.$executeRaw`
      INSERT INTO "AdminProfile" (id, name, "imageUrl", "updatedAt")
      VALUES ('default', ${name}, ${imageUrl}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        "imageUrl" = EXCLUDED."imageUrl",
        "updatedAt" = CURRENT_TIMESTAMP
    `
  } else {
    await prisma.$executeRaw`
      INSERT INTO "AdminProfile" (id, name, "updatedAt")
      VALUES ('default', ${name}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        "updatedAt" = CURRENT_TIMESTAMP
    `
  }

  revalidatePath('/dashboard')
}

async function saveFoodImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file.')
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Food image must be smaller than 2 MB.')
  }

  const extension = getImageExtension(file.type)
  const fileName = `${randomUUID()}.${extension}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'food')
  const destination = path.join(uploadDir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())

  await mkdir(uploadDir, { recursive: true })
  await writeFile(destination, buffer)

  return `/uploads/food/${fileName}`
}

function getImageExtension(mimeType: string) {
  if (mimeType === 'image/png') {
    return 'png'
  }

  if (mimeType === 'image/webp') {
    return 'webp'
  }

  return 'jpg'
}

async function saveAdminImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file.')
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Admin image must be smaller than 2 MB.')
  }

  const extension = getImageExtension(file.type)
  const fileName = `${randomUUID()}.${extension}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'admin')
  const destination = path.join(uploadDir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())

  await mkdir(uploadDir, { recursive: true })
  await writeFile(destination, buffer)

  return `/uploads/admin/${fileName}`
}
