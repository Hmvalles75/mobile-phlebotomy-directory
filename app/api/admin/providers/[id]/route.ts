import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET

    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()

    // Only allow updating specific fields
    const allowedFields = ['eligibleForLeads']
    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const provider = await prisma.provider.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        eligibleForLeads: true
      }
    })

    console.log(`[Admin] Updated provider ${provider.slug}: eligibleForLeads=${provider.eligibleForLeads}`)

    return NextResponse.json({
      ok: true,
      provider
    })

  } catch (error: any) {
    console.error('[Admin Providers] Update error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update provider' },
      { status: 500 }
    )
  }
}
