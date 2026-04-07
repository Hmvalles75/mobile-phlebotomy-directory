import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyProviderOfLead } from '@/lib/notifyProvider'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadId, providerId } = body

    if (!leadId || !providerId) {
      return NextResponse.json(
        { ok: false, error: 'Lead ID and Provider ID are required' },
        { status: 400 }
      )
    }

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, name: true }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Atomic claim: only updates if status is still OPEN
    // This prevents race conditions — if two providers click simultaneously,
    // only the first UPDATE will match the WHERE clause
    const claimed = await prisma.lead.updateMany({
      where: {
        id: leadId,
        status: 'OPEN'
      },
      data: {
        status: 'CLAIMED',
        routedToId: providerId,
        claimedAt: new Date()
      }
    })

    // If no rows were updated, the lead was already claimed or doesn't exist
    if (claimed.count === 0) {
      // Check why — not found vs already claimed
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { status: true }
      })

      if (!lead) {
        return NextResponse.json(
          { ok: false, error: 'Lead not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { ok: false, error: 'ALREADY_CLAIMED', message: 'This lead has already been claimed by another provider' },
        { status: 409 }
      )
    }

    // Fetch the full lead data to return to the provider
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json(
        { ok: false, error: 'Lead not found after claim' },
        { status: 500 }
      )
    }

    // Calculate response time (time from first notification to claim)
    let responseTimeMinutes: number | null = null
    if (lead.routedAt) {
      responseTimeMinutes = Math.round((Date.now() - lead.routedAt.getTime()) / 60000)
    }

    // Send confirmation notification to provider (async, don't block)
    notifyProviderOfLead(providerId, leadId, 0).catch(err => {
      console.error('Failed to send claim notification:', err)
    })

    console.log(`✅ Lead ${leadId} claimed by ${provider.name} (${providerId}). Response time: ${responseTimeMinutes !== null ? responseTimeMinutes + ' min' : 'N/A'}`)

    return NextResponse.json({
      ok: true,
      message: 'Lead claimed successfully',
      lead: {
        id: lead.id,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        address1: lead.address1,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        urgency: lead.urgency,
        notes: lead.notes,
      },
      chargeAmount: 0,
      isTrial: true,
      responseTimeMinutes
    })

  } catch (error: any) {
    console.error('Claim error:', error)

    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to claim lead' },
      { status: 400 }
    )
  }
}
