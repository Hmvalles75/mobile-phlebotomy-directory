import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')

    if (!leadId) {
      return NextResponse.json(
        { ok: false, error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        status: true,
        routedToId: true,
        priceCents: true,
        urgency: true,
        zip: true,
        city: true,
        state: true
      }
    })

    if (!lead) {
      return NextResponse.json(
        { ok: false, error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Map database status to frontend status
    let status: 'open' | 'claimed' | 'unknown' = 'unknown'

    if (lead.status === 'OPEN') {
      status = 'open'
    } else if (lead.status === 'CLAIMED') {
      status = 'claimed'
    }

    return NextResponse.json({
      ok: true,
      status,
      leadId: lead.id,
      priceCents: lead.priceCents,
      urgency: lead.urgency,
      zip: lead.zip,
      city: lead.city,
      state: lead.state
    })

  } catch (error: any) {
    console.error('Lead status check error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to check lead status' },
      { status: 500 }
    )
  }
}
