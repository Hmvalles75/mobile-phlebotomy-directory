import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

// Admin auth via the shared cookie-session (same as /api/admin/leads). The
// previous ADMIN_TOKEN bearer check was broken and 401'd every request.
function validateAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  return verifyAdminSessionFromCookies(authHeader || cookieHeader)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate admin token
  if (!validateAdminToken(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { id } = params
    const body = await req.json()
    const { status } = body

    // Validate status. Legacy values (QUOTED/BOOKED/COMPLETED/DECLINED) still
    // accepted so old rows can be edited; new pipeline stages added 2026-07-17.
    const validStatuses = ['NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'COMPLETED', 'DECLINED', 'IN_DISCUSSION', 'WON', 'LOST', 'DEAD']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Moving a lead out of NEW implies first contact has happened. If nothing
    // has been logged yet, stamp lastContactedAt now so staleness keys off
    // activity rather than createdAt (this also makes the status editor a valid
    // backfill path for leads already emailed from Gmail).
    const existing = await prisma.coverageRequest.findUnique({
      where: { id },
      select: { lastContactedAt: true },
    })
    const data: { status: string; lastContactedAt?: Date } = { status }
    if (status !== 'NEW' && existing && !existing.lastContactedAt) {
      data.lastContactedAt = new Date()
    }

    const inquiry = await prisma.coverageRequest.update({
      where: { id },
      data: data as any,
    })

    return NextResponse.json({
      success: true,
      inquiry,
      message: `Status updated to ${status}`
    })
  } catch (error: any) {
    console.error('Failed to update inquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update inquiry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validate admin token
  if (!validateAdminToken(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { id } = params

    await prisma.coverageRequest.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Inquiry deleted successfully'
    })
  } catch (error: any) {
    console.error('Failed to delete inquiry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete inquiry' },
      { status: 500 }
    )
  }
}
