import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { getAllClaims } from '@/lib/business-claims'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    const isAuthenticated = verifyAdminSessionFromCookies(authHeader || cookieHeader)

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const claims = getAllClaims()

    return NextResponse.json({
      success: true,
      claims
    })

  } catch (error) {
    console.error('Error fetching claims:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
