import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkToken, encodeSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  // PUBLIC_SITE_URL carries a trailing slash, which produced //dashboard/login
  // on every redirect out of this route.
  const baseUrl = (process.env.PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/login?error=missing_token`
      )
    }

    // Verify the magic link token
    const result = await verifyMagicLinkToken(token)

    if (!result.ok || !result.session) {
      // Pass the specific reason through. Every failure used to arrive as
      // `invalid_token` and render as "expired", including the common case
      // where the provider was simply holding an older email — which sent them
      // to request another link and kill the one that still worked.
      const reason =
        result.error === 'link_expired' || result.error === 'link_superseded'
          ? result.error
          : 'invalid_token'
      return NextResponse.redirect(
        `${baseUrl}/dashboard/login?error=${reason}`
      )
    }

    // Create session token
    const sessionToken = encodeSession(result.session)

    // Redirect to dashboard with session cookie
    const response = NextResponse.redirect(
      `${baseUrl}/dashboard?login=success`
    )

    // Set session cookie (30 days)
    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    return response

  } catch (error: any) {
    console.error('[Auth] Verify error:', error)
    return NextResponse.redirect(
      `${baseUrl}/dashboard/login?error=server_error`
    )
  }
}
