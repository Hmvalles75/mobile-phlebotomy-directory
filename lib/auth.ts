import { nanoid } from 'nanoid'
import { prisma } from './prisma'

/**
 * Magic Link Authentication Utilities
 * Token-based passwordless authentication for providers
 */

export interface AuthSession {
  providerId: string
  email: string
  name: string
  status: string
  expiresAt: Date
}

// Generate a secure magic link token
export function generateAuthToken(): string {
  return nanoid(64) // Long, secure token
}

/**
 * Magic-link lifetime.
 *
 * Was 15 minutes, and the value was computed and then thrown away — it was
 * never written to the database, so verifyMagicLinkToken did no time check and
 * tokens in fact lived forever. Now that the expiry is actually enforced, 15
 * minutes is too tight to impose: the email has to be delivered, possibly
 * rescued from spam, and opened on a phone. An hour is still short enough that
 * a forwarded or screenshotted link goes stale quickly.
 */
export const MAGIC_LINK_TTL_MINUTES = 60

export function getTokenExpiration(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + MAGIC_LINK_TTL_MINUTES)
  return expiry
}

// Session expiration: 30 days
export function getSessionExpiration(): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 30)
  return expiry
}

// Create or update auth token for provider
export async function createMagicLinkToken(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    // Find provider by email (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim()
    const provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { claimEmail: { equals: normalizedEmail, mode: 'insensitive' } },
          { email: { equals: normalizedEmail, mode: 'insensitive' } }
        ]
      }
    })

    if (!provider) {
      return { ok: false, error: 'No provider account found with this email' }
    }

    // Allow any provider to request a magic link (for both login and initial verification)
    // The verify step will handle marking them as verified if needed

    // Generate new token
    const token = generateAuthToken()
    const expiresAt = getTokenExpiration()

    // Store token in provider record (we'll use claimToken field for now)
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        claimToken: token,
        // Previously computed and discarded, which is the whole reason the
        // 15-minute window never existed.
        claimTokenExpiresAt: expiresAt,
        updatedAt: new Date()
      }
    })

    return { ok: true }
  } catch (error) {
    console.error('[Auth] Create magic link error:', error)
    return { ok: false, error: 'Failed to generate magic link' }
  }
}

// Verify magic link token and return provider session
export async function verifyMagicLinkToken(token: string): Promise<{ ok: boolean; session?: AuthSession; error?: string }> {
  try {
    const provider = await prisma.provider.findFirst({
      where: { claimToken: token }
    })

    // Three different things produce this, and they used to be indistinguishable:
    // the link was already used (the token is cleared below on success), a newer
    // link was requested (claimToken holds one token, so requesting another
    // silently kills the previous), or the token is simply wrong. Providers were
    // told "expired" for all three, which pushed them to request yet another link
    // and invalidate the one they were holding.
    if (!provider) {
      return { ok: false, error: 'link_superseded' }
    }

    if (provider.claimTokenExpiresAt && provider.claimTokenExpiresAt < new Date()) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: { claimToken: null, claimTokenExpiresAt: null },
      })
      return { ok: false, error: 'link_expired' }
    }

    // Clear the token and verify the provider if not already verified
    // This handles both login (already verified) and initial verification (unverified)
    const updateData: any = { claimToken: null, claimTokenExpiresAt: null }

    if (provider.status !== 'VERIFIED') {
      updateData.status = 'VERIFIED'
      updateData.claimVerifiedAt = new Date()
    }

    await prisma.provider.update({
      where: { id: provider.id },
      data: updateData
    })

    // Create session (use VERIFIED status since we just verified them if needed)
    const session: AuthSession = {
      providerId: provider.id,
      email: provider.claimEmail || provider.email || '',
      name: provider.name,
      status: 'VERIFIED',
      expiresAt: getSessionExpiration()
    }

    return { ok: true, session }
  } catch (error) {
    console.error('[Auth] Verify magic link error:', error)
    return { ok: false, error: 'Failed to verify magic link' }
  }
}

// Encode session to JWT-like token (simple base64 for now)
export function encodeSession(session: AuthSession): string {
  const payload = JSON.stringify(session)
  return Buffer.from(payload).toString('base64url')
}

// Decode session from token
export function decodeSession(token: string): AuthSession | null {
  try {
    const payload = Buffer.from(token, 'base64url').toString('utf-8')
    const session = JSON.parse(payload) as AuthSession

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      return null
    }

    return session
  } catch (error) {
    return null
  }
}

// Verify session token is valid
export function verifySession(token: string): AuthSession | null {
  return decodeSession(token)
}

// Get provider session from request headers or cookies
export function getSessionFromRequest(request: Request): AuthSession | null {
  // Try to get from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifySession(token)
  }

  // Try to get from cookie
  const cookies = request.headers.get('cookie')
  if (cookies) {
    const match = cookies.match(/auth_token=([^;]+)/)
    if (match) {
      return verifySession(match[1])
    }
  }

  return null
}
