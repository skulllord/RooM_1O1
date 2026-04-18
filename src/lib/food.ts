import prisma from '@/lib/prisma'
import { isDatabaseUnavailable, withDatabaseRetry } from '@/lib/bookings'

export type CustomerFoodItem = {
  id: string
  name: string
  price: number
  imageUrl: string | null
}

export type CustomerFoodOrder = {
  id: string
  customerName: string
  phoneNumber: string
  note: string | null
  status: string
  totalPrice: number
  createdAt: Date
  items: string
}

export async function getAvailableFoodItems(): Promise<CustomerFoodItem[]> {
  try {
    return await withDatabaseRetry(async () => {
      const items = await prisma.$queryRaw<
        Array<{
          id: string
          name: string
          price: string | number
          imageUrl: string | null
        }>
      >`
        SELECT id, name, price, "imageUrl"
        FROM "FoodItem"
        WHERE "isAvailable" = true
        ORDER BY "createdAt" DESC
      `

      return items.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        imageUrl: item.imageUrl,
      }))
    })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return []
    }

    throw error
  }
}

export async function getRecentCustomerFoodOrders(): Promise<CustomerFoodOrder[]> {
  try {
    return await withDatabaseRetry(async () => {
      const orders = await prisma.$queryRaw<
        Array<{
          id: string
          customerName: string
          phoneNumber: string
          note: string | null
          status: string
          totalPrice: string | number
          createdAt: Date
          items: string | null
        }>
      >`
        SELECT
          o.id,
          o."customerName",
          o."phoneNumber",
          o.note,
          o.status,
          o."totalPrice",
          o."createdAt",
          COALESCE(
            string_agg(CONCAT(i.quantity, 'x ', f.name), ', ' ORDER BY f.name),
            ''
          ) AS items
        FROM "CustomerFoodOrder" o
        LEFT JOIN "CustomerFoodOrderItem" i ON i."orderId" = o.id
        LEFT JOIN "FoodItem" f ON f.id = i."foodItemId"
        GROUP BY o.id
        ORDER BY o."createdAt" DESC
        LIMIT 10
      `

      return orders.map((order) => ({
        id: order.id,
        customerName: order.customerName,
        phoneNumber: order.phoneNumber,
        note: order.note,
        status: order.status,
        totalPrice: Number(order.totalPrice),
        createdAt: order.createdAt,
        items: order.items ?? '',
      }))
    })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return []
    }

    throw error
  }
}
