import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple token validation (matches your existing admin auth)
function validateAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const validToken = process.env.ADMIN_TOKEN || 'default-admin-token'
  return token === validToken
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

    // Validate status
    const validStatuses = ['NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'COMPLETED', 'DECLINED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const inquiry = await prisma.corporateEventInquiry.update({
      where: { id },
      data: { status }
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

    await prisma.corporateEventInquiry.delete({
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
