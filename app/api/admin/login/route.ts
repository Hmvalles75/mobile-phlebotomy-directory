import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, createAdminSession } from '@/lib/admin-auth'

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

    // Set the httpOnly admin_session cookie so server components (e.g.
    // /admin/institutional/*) can verify auth via verifyAdminSession().
    // Also returns the token in the response body for the existing
    // localStorage-based admin pages to keep working unchanged.
    const sessionToken = await createAdminSession()

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
