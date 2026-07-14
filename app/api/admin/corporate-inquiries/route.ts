import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

// Admin auth via the shared cookie-session (same as /api/admin/leads). The
// previous ADMIN_TOKEN bearer check was broken: ADMIN_TOKEN was never set, so
// it expected the literal 'default-admin-token' while the panel sends the
// session token — 401ing every request and showing an empty Coverage Requests
// panel despite rows existing.
function validateAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  return verifyAdminSessionFromCookies(authHeader || cookieHeader)
}

export async function GET(req: NextRequest) {
  // Validate admin token
  if (!validateAdminToken(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const inquiries = await prisma.coverageRequest.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      inquiries
    })
  } catch (error: any) {
    console.error('Failed to fetch corporate inquiries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inquiries' },
      { status: 500 }
    )
  }
}
