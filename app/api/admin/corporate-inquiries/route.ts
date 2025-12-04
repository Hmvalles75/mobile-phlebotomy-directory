import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple token validation (matches your existing admin auth)
function validateAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const validToken = process.env.ADMIN_TOKEN || 'default-admin-token'
  return token === validToken
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
    const inquiries = await prisma.corporateEventInquiry.findMany({
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
