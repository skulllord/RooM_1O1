export const ADMIN_SESSION_COOKIE = 'dmc_admin_session'

const encoder = new TextEncoder()

type AdminSessionPayload = {
  email: string
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

async function getSigningKey() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET

  if (!secret) {
    throw new Error('Missing required environment variable: ADMIN_SESSION_SECRET')
  }

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

async function signPayload(payload: string) {
  const key = await getSigningKey()
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))

  return base64UrlEncode(signature)
}

export async function createAdminSessionToken(email: string) {
  const payload: AdminSessionPayload = {
    email: email.toLowerCase(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 12,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = await signPayload(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export async function verifyAdminSessionToken(token?: string | null) {
  if (!token) {
    return null
  }

  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = await signPayload(encodedPayload)

  if (signature !== expectedSignature) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload

    if (!payload.email || payload.expiresAt < Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function getCurrentAdminSession() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
}

export function getAllowedAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || ''
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || ''
}
