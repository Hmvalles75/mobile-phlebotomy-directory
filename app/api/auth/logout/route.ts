import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ ok: true, message: 'Logged out successfully' })

  // Clear the session cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/'
  })

  return response
}

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(
    `${process.env.PUBLIC_SITE_URL || 'http://localhost:3002'}/dashboard/login?logout=success`
  )

  // Clear the session cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })

  return response
}
