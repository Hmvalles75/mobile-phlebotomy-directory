import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { execSync } from 'child_process'

/**
 * Trigger deployment of approved providers
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieHeader = request.headers.get('cookie')
    const isAuthenticated = verifyAdminSessionFromCookies(cookieHeader)

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚀 Starting deployment process...')

    // Run the auto-deploy script
    try {
      execSync('node scripts/auto-deploy.js', {
        cwd: process.cwd(),
        stdio: 'inherit'
      })

      return NextResponse.json({
        success: true,
        message: 'Deployment initiated successfully! Your changes will be live shortly.'
      })
    } catch (error: any) {
      // Check if error is because there are no changes
      if (error.message.includes('No changes')) {
        return NextResponse.json({
          success: false,
          error: 'No changes to deploy'
        })
      }

      throw error
    }

  } catch (error) {
    console.error('Error during deployment:', error)
    return NextResponse.json(
      { success: false, error: 'Deployment failed. Please check server logs.' },
      { status: 500 }
    )
  }
}
