'use server'

import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import prisma from '@/lib/prisma'
import { isDatabaseUnavailable, withDatabaseRetry } from '@/lib/bookings'
import { formatCurrency } from '@/lib/utils'

export type FoodOrderActionState = {
  error?: string
  success?: string
}

type FoodItemRow = {
  id: string
  name: string
  price: string | number
}

export async function createCustomerFoodOrder(
  _previousState: FoodOrderActionState,
  formData: FormData
): Promise<FoodOrderActionState> {
  const customerName = String(formData.get('customerName') ?? '').trim()
  const phoneNumber = String(formData.get('phoneNumber') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()

  if (customerName.length < 2) {
    return { error: 'Please enter your name.' }
  }

  if (phoneNumber.length < 8) {
    return { error: 'Please enter a valid phone number.' }
  }

  const requestedItems = Array.from(formData.entries())
    .filter(([key]) => key.startsWith('quantity_'))
    .map(([key, value]) => ({
      foodItemId: key.replace('quantity_', ''),
      quantity: Math.max(0, Math.min(20, Number(value) || 0)),
    }))
    .filter((item) => item.quantity > 0)

  if (requestedItems.length === 0) {
    return { error: 'Please select at least one food item.' }
  }

  try {
    const result = await withDatabaseRetry(async () =>
      prisma.$transaction(async (tx) => {
        const ids = requestedItems.map((item) => item.foodItemId)
        const availableItems = await tx.$queryRaw<FoodItemRow[]>`
          SELECT id, name, price
          FROM "FoodItem"
          WHERE "isAvailable" = true AND id IN (${Prisma.join(ids)})
        `
        const itemById = new Map(availableItems.map((item) => [item.id, item]))

        if (itemById.size !== requestedItems.length) {
          throw new Error('Some selected food items are no longer available.')
        }

        const orderItems = requestedItems.map((requestedItem) => {
          const item = itemById.get(requestedItem.foodItemId)

          if (!item) {
            throw new Error('Selected food item is no longer available.')
          }

          const unitPrice = Number(item.price)

          return {
            id: randomUUID(),
            foodItemId: item.id,
            name: item.name,
            quantity: requestedItem.quantity,
            unitPrice,
            lineTotal: unitPrice * requestedItem.quantity,
          }
        })
        const totalPrice = orderItems.reduce((total, item) => total + item.lineTotal, 0)
        const orderId = randomUUID()

        await tx.$executeRaw`
          INSERT INTO "CustomerFoodOrder" (
            id,
            "customerName",
            "phoneNumber",
            note,
            status,
            "totalPrice",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${orderId},
            ${customerName},
            ${phoneNumber},
            ${note || null},
            'PENDING',
            ${new Prisma.Decimal(totalPrice)},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `

        for (const item of orderItems) {
          await tx.$executeRaw`
            INSERT INTO "CustomerFoodOrderItem" (
              id,
              "orderId",
              "foodItemId",
              quantity,
              "unitPrice"
            )
            VALUES (
              ${item.id},
              ${orderId},
              ${item.foodItemId},
              ${item.quantity},
              ${new Prisma.Decimal(item.unitPrice)}
            )
          `
        }

        return {
          orderId,
          totalPrice,
        }
      })
    )

    revalidatePath('/')
    revalidatePath('/dashboard')

    return {
      success: `Food order placed. Order ${result.orderId.slice(0, 8)} total: ${formatCurrency(
        result.totalPrice
      )}. We will prepare it shortly.`,
    }
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return { error: 'Food ordering is temporarily offline. Please try again in a moment.' }
    }

    return {
      error: error instanceof Error ? error.message : 'Unable to place food order right now.',
    }
  }
}
