import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkToken, encodeSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        `${process.env.PUBLIC_SITE_URL || 'http://localhost:3002'}/dashboard/login?error=missing_token`
      )
    }

    // Verify the magic link token
    const result = await verifyMagicLinkToken(token)

    if (!result.ok || !result.session) {
      return NextResponse.redirect(
        `${process.env.PUBLIC_SITE_URL || 'http://localhost:3002'}/dashboard/login?error=invalid_token`
      )
    }

    // Create session token
    const sessionToken = encodeSession(result.session)

    // Redirect to dashboard with session cookie
    const response = NextResponse.redirect(
      `${process.env.PUBLIC_SITE_URL || 'http://localhost:3002'}/dashboard?login=success`
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
      `${process.env.PUBLIC_SITE_URL || 'http://localhost:3002'}/dashboard/login?error=server_error`
    )
  }
}
