import prisma from '@/lib/prisma'
import { isDatabaseUnavailable, withDatabaseRetry } from '@/lib/bookings'

export type AdminProfile = {
  name: string
  imageUrl: string | null
}

export async function getAdminProfile(): Promise<AdminProfile> {
  try {
    const rows = await withDatabaseRetry(() =>
      prisma.$queryRaw<Array<AdminProfile>>`
        SELECT name, "imageUrl"
        FROM "AdminProfile"
        WHERE id = 'default'
        LIMIT 1
      `
    )

    return rows[0] ?? { name: 'Admin', imageUrl: null }
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return { name: 'Admin', imageUrl: null }
    }

    throw error
  }
}
