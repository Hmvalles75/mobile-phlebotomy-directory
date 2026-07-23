import crypto from 'crypto'
import { nanoid } from 'nanoid'
import { prisma } from './prisma'
import sg from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

/**
 * Client-portal magic-link authentication.
 *
 * Distinct from the provider auth in lib/auth.ts in two important ways:
 *  1. Sessions are HMAC-SIGNED (not plain base64), so they cannot be forged.
 *     The provider session in lib/auth.ts is base64-only and IS forgeable —
 *     do not copy that pattern here; this flow accepts PHI writes under a BAA.
 *  2. Every auth/submission event is written to the append-only ClientAuthEvent
 *     audit log (who / when / IP).
 *
 * The magic token itself is a nanoid stored on ClientUser with a real expiry
 * column (magicTokenExpiresAt), single-use, and gated on `disabled`.
 */

const FROM = 'hector@mobilephlebotomy.org'
const SITE = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mobilephlebotomy.org').replace(/\/+$/, '')

export const CLIENT_SESSION_COOKIE = 'client_session'
const TOKEN_TTL_MIN = 15
const SESSION_TTL_DAYS = 30

export interface ClientSession {
  clientUserId: string
  clientId: string
  email: string
  expiresAt: number // epoch ms
}

// ────────────────────────────────────────────────────────────────────
// Audit — append-only. Never throws into the caller (audit failure must
// not block or leak into the auth flow), but always logged.
// ────────────────────────────────────────────────────────────────────
export type ClientAuthEventType =
  | 'link_requested'
  | 'link_verified'
  | 'link_failed'
  | 'order_submitted'
  | 'user_created'
  | 'user_disabled'
  | 'user_enabled'

export async function logClientAuthEvent(
  event: ClientAuthEventType,
  opts: { clientUserId?: string | null; email?: string | null; ip?: string | null; userAgent?: string | null } = {},
): Promise<void> {
  try {
    await prisma.clientAuthEvent.create({
      data: {
        event,
        clientUserId: opts.clientUserId ?? null,
        email: opts.email ?? null,
        ip: opts.ip ?? null,
        userAgent: opts.userAgent ?? null,
      },
    })
  } catch (err) {
    console.error('[client-auth] audit write failed:', err)
  }
}

// ────────────────────────────────────────────────────────────────────
// Magic link
// ────────────────────────────────────────────────────────────────────
/**
 * Request a login link. ALWAYS returns { ok: true } regardless of whether the
 * email maps to an enabled ClientUser — never reveal account existence. A link
 * is only actually sent when the email matches an enabled user.
 */
export async function createClientMagicLink(
  email: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<{ ok: true }> {
  const normalized = email.toLowerCase().trim()
  await logClientAuthEvent('link_requested', { email: normalized, ip: ctx.ip, userAgent: ctx.userAgent })

  const user = await prisma.clientUser.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' }, disabled: false },
  })
  if (!user) return { ok: true } // silent no-op — do not disclose

  const token = nanoid(64)
  const magicTokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000)
  await prisma.clientUser.update({
    where: { id: user.id },
    data: { magicToken: token, magicTokenExpiresAt },
  })
  await sendMagicLinkEmail(user.email, token)
  return { ok: true }
}

async function sendMagicLinkEmail(to: string, token: string): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('[client-auth] SENDGRID_API_KEY not set — cannot send magic link')
    return
  }
  const link = `${SITE}/orders/verify?token=${token}`
  // Anti-phishing framing: identify the sender + service, say what it is, state
  // the 15-minute expiry, and make clear we never ask for a password. Clients
  // receive these alongside HIPAA-covered work — they must not wonder if it's phishing.
  const text = `Hello,

Here is your secure login link for the MobilePhlebotomy.org Order Portal, where you can submit and track blood-draw orders for your organization:

${link}

This link expires in 15 minutes and can be used once. For your security, MobilePhlebotomy.org never asks for a password — you always sign in through a one-time link like this, sent to your email on file.

If you did not request this link, you can safely ignore this email. No one can access your account without it.

— MobilePhlebotomy.org
hector@mobilephlebotomy.org`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color:#1f2937;">
      <h2 style="color:#0f766e;">MobilePhlebotomy.org — Order Portal login</h2>
      <p>Here is your secure login link for the <strong>Order Portal</strong>, where you can submit and track blood-draw orders for your organization:</p>
      <p style="margin:28px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 28px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Sign in to the Order Portal</a>
      </p>
      <p style="color:#374151;font-size:14px;">This link <strong>expires in 15 minutes</strong> and can be used once. For your security, MobilePhlebotomy.org never asks for a password — you always sign in through a one-time link like this, sent to your email on file.</p>
      <p style="color:#6b7280;font-size:13px;">If you did not request this link, you can safely ignore this email — no one can access your account without it.</p>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">MobilePhlebotomy.org · hector@mobilephlebotomy.org</p>
    </div>`

  await sg.send({
    to,
    from: FROM,
    replyTo: FROM,
    subject: 'Your MobilePhlebotomy.org Order Portal login link',
    text,
    html,
  })
}

/**
 * Verify a magic-link token. Single-use: on success the token is cleared and
 * lastLoginAt is stamped. Returns a session to be signed by the caller.
 */
export async function verifyClientMagicLink(
  token: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<{ ok: boolean; session?: ClientSession; error?: string }> {
  const user = token ? await prisma.clientUser.findFirst({ where: { magicToken: token } }) : null

  const invalid =
    !user ||
    user.disabled ||
    !user.magicTokenExpiresAt ||
    user.magicTokenExpiresAt.getTime() < Date.now()

  if (invalid) {
    await logClientAuthEvent('link_failed', {
      clientUserId: user?.id ?? null,
      email: user?.email ?? null,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    })
    return { ok: false, error: 'This login link is invalid or has expired. Please request a new one.' }
  }

  // Single-use: clear the token and stamp login.
  await prisma.clientUser.update({
    where: { id: user!.id },
    data: { magicToken: null, magicTokenExpiresAt: null, lastLoginAt: new Date() },
  })
  await logClientAuthEvent('link_verified', {
    clientUserId: user!.id,
    email: user!.email,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  })

  const session: ClientSession = {
    clientUserId: user!.id,
    clientId: user!.clientId,
    email: user!.email,
    expiresAt: Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  }
  return { ok: true, session }
}

// ────────────────────────────────────────────────────────────────────
// HMAC-signed session (forgery-resistant, unlike the provider base64 session)
// ────────────────────────────────────────────────────────────────────
function sessionSecret(): string {
  const s = process.env.CLIENT_SESSION_SECRET
  if (!s) throw new Error('CLIENT_SESSION_SECRET is not set — client sessions cannot be signed')
  return s
}

export function signClientSession(session: ClientSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  const sig = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyClientSessionToken(token: string | undefined | null): ClientSession | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const expected = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as ClientSession
    if (!session.expiresAt || session.expiresAt < Date.now()) return null
    if (!session.clientUserId || !session.clientId) return null
    return session
  } catch {
    return null
  }
}

/** Read + verify the client session from a Request's Cookie header. */
export function getClientSession(req: Request): ClientSession | null {
  const cookie = req.headers.get('cookie')
  if (!cookie) return null
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${CLIENT_SESSION_COOKIE}=([^;]+)`))
  return m ? verifyClientSessionToken(decodeURIComponent(m[1])) : null
}
