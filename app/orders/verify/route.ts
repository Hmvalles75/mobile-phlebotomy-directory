import { NextRequest, NextResponse } from 'next/server'
import {
  verifyClientMagicLink,
  signClientSession,
  CLIENT_SESSION_COOKIE,
} from '@/lib/client-auth'
import { LOGIN_NEXT_COOKIE, DEFAULT_POST_LOGIN, safeNext } from '@/lib/client-portal'

const SITE = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || null
  const userAgent = req.headers.get('user-agent')

  const result = token ? await verifyClientMagicLink(token, { ip, userAgent }) : { ok: false as const }

  if (!result.ok || !result.session) {
    // Generic failure — send back to login to request a fresh link.
    return NextResponse.redirect(`${SITE}/orders/login?error=invalid`)
  }

  // Honor the stashed destination (same-browser only), else the default.
  const stashed = safeNext(req.cookies.get(LOGIN_NEXT_COOKIE)?.value)
  const dest = stashed || DEFAULT_POST_LOGIN

  const sessionToken = signClientSession(result.session)
  const response = NextResponse.redirect(`${SITE}${dest}`)
  response.cookies.set(CLIENT_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days — matches SESSION_TTL_DAYS
    path: '/',
  })
  // Consume the one-shot destination cookie.
  response.cookies.delete(LOGIN_NEXT_COOKIE)
  return response
}
