/**
 * Simple admin authentication utilities
 * For production, consider using NextAuth.js or similar
 */

import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export interface AdminSession {
  authenticated: boolean
  expiresAt: number
}

/**
 * Check if the admin password is correct
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || adminPassword === 'your_secure_password_here') {
    console.warn('⚠️  ADMIN_PASSWORD not set in .env.local - using default (INSECURE)')
    return password === 'admin123' // Fallback for development only
  }

  return password === adminPassword
}

/**
 * Create an admin session
 */
export async function createAdminSession(): Promise<string> {
  const session: AdminSession = {
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION
  }

  const sessionToken = Buffer.from(JSON.stringify(session)).toString('base64')

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
 * Verify admin session is valid
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

    if (!sessionToken) {
      return false
    }

    const session: AdminSession = JSON.parse(
      Buffer.from(sessionToken, 'base64').toString('utf-8')
    )

    if (!session.authenticated || session.expiresAt < Date.now()) {
      return false
    }

    return true
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
