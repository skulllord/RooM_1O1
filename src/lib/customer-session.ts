import { cookies } from 'next/headers'

export const CUSTOMER_SESSION_COOKIE = 'dmc_customer_session'

const encoder = new TextEncoder()

type CustomerSessionPayload = {
  customerId: string
  expiresAt: number
}

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : new Uint8Array(value)
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlDecode(value: string) {
  const padded = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

async function signPayload(payload: string) {
  const secret =
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET

  if (!secret) {
    throw new Error('Missing required environment variable: CUSTOMER_SESSION_SECRET')
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))

  return base64UrlEncode(signature)
}

export async function createCustomerSessionToken(customerId: string) {
  const payload: CustomerSessionPayload = {
    customerId,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = await signPayload(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function verifyCustomerSessionToken(token?: string | null) {
  if (!token) {
    return null
  }

  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature || signature !== (await signPayload(encodedPayload))) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as CustomerSessionPayload

    if (!payload.customerId || payload.expiresAt < Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function getCurrentCustomerSession() {
  const cookieStore = await cookies()

  return verifyCustomerSessionToken(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value)
}

export async function setCustomerSession(customerId: string) {
  const cookieStore = await cookies()
  const token = await createCustomerSessionToken(customerId)

  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}
