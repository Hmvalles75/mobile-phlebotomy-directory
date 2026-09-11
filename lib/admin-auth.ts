/**
 * Admin authentication.
 *
 * Sessions are signed. Until 2026-09-11 the token was plain base64 JSON of
 * `{ authenticated: true, expiresAt }` and every /api/admin/* route and /admin
 * page accepted it on sight, so anyone who knew the shape could mint admin
 * access without the password. Now the token is `payload.signature` where the
 * signature is HMAC-SHA256 over the payload, same scheme as the client portal
 * (lib/client-auth.ts). Unsigned tokens are rejected once a signing secret is
 * available; the only cost is one re-login.
 *
 * Secret: ADMIN_SESSION_SECRET if set, otherwise derived from ADMIN_PASSWORD so
 * signing works with no new deployment config. Rotating either invalidates
 * every session, which is the behaviour you want from a password change.
 */

import crypto from 'crypto'
import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export interface AdminSession {
  authenticated: boolean
  expiresAt: number
  iat?: number
}

function signingSecret(): string | null {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET
  const pw = process.env.ADMIN_PASSWORD
  if (!pw || pw === 'your_secure_password_here') return null
  return crypto.createHash('sha256').update(`admin-session-v1:${pw}`).digest('hex')
}

/**
 * Check if the admin password is correct
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || adminPassword === 'your_secure_password_here') {
    console.warn('ADMIN_PASSWORD not set in .env.local - using default (INSECURE)')
    return password === 'admin123' // Fallback for development only
  }

  const a = Buffer.from(password)
  const b = Buffer.from(adminPassword)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function signSession(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  const secret = signingSecret()
  if (!secret) {
    console.warn('[admin-auth] No signing secret (ADMIN_SESSION_SECRET / ADMIN_PASSWORD); issuing UNSIGNED session. Development only.')
    return payload
  }
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

/**
 * Validate a session token. Signed tokens must verify; unsigned (legacy)
 * tokens are accepted only when no signing secret exists at all, i.e. local
 * development with no ADMIN_PASSWORD.
 */
export function verifyAdminSessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null
  const secret = signingSecret()
  const dot = token.lastIndexOf('.')
  let payload: string

  if (dot > 0) {
    payload = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    if (!secret) return null
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null
  } else {
    if (secret) return null // unsigned token while signing is in force: forged or pre-upgrade
    payload = token
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as AdminSession
    if (!session || session.authenticated !== true || typeof session.expiresAt !== 'number') return null
    if (session.expiresAt < Date.now()) return null
    return session
  } catch {
    return null
  }
}

/**
 * Create an admin session (sets the cookie and returns the token for
 * Authorization: Bearer use by the admin panel).
 */
export async function createAdminSession(): Promise<string> {
  const session: AdminSession = {
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION,
    iat: Date.now(),
  }
  const sessionToken = signSession(session)

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION / 1000
  })

  return sessionToken
}

/**
 * Verify admin session from an Authorization header (Bearer) or a Cookie header.
 */
export function verifyAdminSessionFromCookies(cookieOrAuth: string | null): boolean {
  try {
    if (!cookieOrAuth) return false

    let sessionToken: string | undefined
    if (cookieOrAuth.startsWith('Bearer ')) {
      sessionToken = cookieOrAuth.substring(7)
    } else {
      const parsed = Object.fromEntries(
        cookieOrAuth.split('; ').map(c => {
          const [key, ...v] = c.split('=')
          return [key, v.join('=')]
        })
      )
      sessionToken = parsed[ADMIN_SESSION_COOKIE]
    }
    return verifyAdminSessionToken(sessionToken) !== null
  } catch (error) {
    console.error('Error verifying admin session:', error)
    return false
  }
}

/**
 * Verify admin session from the request cookies (server components / pages).
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value) !== null
  } catch (error) {
    console.error('Error verifying admin session:', error)
    return false
  }
}

/**
 * Clear admin session (logout)
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}
