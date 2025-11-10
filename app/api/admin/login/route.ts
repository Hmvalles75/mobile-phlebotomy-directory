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
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      password: password // Store hashed password for verification
    })).toString('base64')

    // Return token in response body for client-side storage
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: sessionToken
    })

  } catch (error) {
    console.error('Error during admin login:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
