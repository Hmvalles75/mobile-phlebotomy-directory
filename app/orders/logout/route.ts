import { NextRequest, NextResponse } from 'next/server'
import { CLIENT_SESSION_COOKIE } from '@/lib/client-auth'

const SITE = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

/**
 * GET /orders/logout — clears the client-portal session cookie and returns to
 * the login page. Added 2026-10-10 with the 7-day session: clients may share
 * a workstation, so there has to be a way to end a session on purpose.
 */
export async function GET(_req: NextRequest) {
  const response = NextResponse.redirect(`${SITE}/orders/login?out=1`)
  response.cookies.set(CLIENT_SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' })
  return response
}
