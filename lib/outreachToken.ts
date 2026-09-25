import crypto from 'crypto'

/**
 * Unsubscribe tokens for provider outreach (scripts/outreach-send.ts).
 * HMAC of the provider id; the link carries id + token, the route recomputes
 * and compares. No table, no expiry: an opt-out link should keep working.
 * Secret precedence mirrors admin sessions so nothing new has to be set.
 */
function secret(): string {
  const s = process.env.OUTREACH_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (!s) throw new Error('No OUTREACH_SECRET / ADMIN_SESSION_SECRET / ADMIN_PASSWORD set')
  return `outreach:${s}`
}

export function outreachToken(providerId: string): string {
  return crypto.createHmac('sha256', secret()).update(providerId).digest('base64url').slice(0, 32)
}

export function verifyOutreachToken(providerId: string, token: string): boolean {
  if (!/^[A-Za-z0-9_-]{32}$/.test(token || '')) return false
  const expected = outreachToken(providerId)
  return expected.length === token.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
}

export function unsubscribeUrl(siteUrl: string, providerId: string): string {
  return `${siteUrl}/api/outreach/unsubscribe?p=${encodeURIComponent(providerId)}&t=${outreachToken(providerId)}`
}
