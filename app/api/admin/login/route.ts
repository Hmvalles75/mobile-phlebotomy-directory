import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    const isValid = verifyAdminPassword(password)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = Buffer.from(JSON.stringify({
      authenticated: true,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64')

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful'
    })

    // Set cookie on response
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours in seconds
    })

    return response

  } catch (error) {
    console.error('Error during admin login:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
