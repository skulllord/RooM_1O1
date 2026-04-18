import { NextResponse, type NextRequest } from 'next/server'

import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session'

export async function middleware(request: NextRequest) {
  const session = await verifyAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  )

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('message', 'Please sign in to access the admin dashboard.')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
