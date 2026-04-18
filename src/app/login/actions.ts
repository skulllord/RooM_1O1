'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminPassword,
  getAllowedAdminEmail,
} from '@/lib/admin-session'

export type LoginActionState = {
  error?: string
}

export async function loginAdmin(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const allowedEmail = getAllowedAdminEmail()
  const adminPassword = getAdminPassword()

  if (!allowedEmail || !adminPassword) {
    return {
      error: 'Admin credentials are not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.',
    }
  }

  if (email !== allowedEmail || password !== adminPassword) {
    return { error: 'Invalid admin email or password.' }
  }

  const token = await createAdminSessionToken(email)
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 12,
    path: '/',
  })

  redirect('/dashboard')
}

export async function signOut() {
  const cookieStore = await cookies()

  cookieStore.delete(ADMIN_SESSION_COOKIE)
  redirect('/login?message=Signed out successfully')
}
