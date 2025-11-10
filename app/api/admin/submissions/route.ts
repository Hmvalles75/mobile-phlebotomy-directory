import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { getPendingSubmissions } from '@/lib/pending-submissions'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    console.log('Auth header:', authHeader ? 'present' : 'missing')
    console.log('Cookie header:', cookieHeader ? 'present' : 'missing')

    const isAuthenticated = verifyAdminSessionFromCookies(authHeader || cookieHeader)
    console.log('Is authenticated:', isAuthenticated)

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const submissions = getPendingSubmissions()

    return NextResponse.json({
      success: true,
      submissions
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
