import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')
    // Also accept ?providerId=... for email-based claim URLs that don't have a session cookie
    const providerIdParam = searchParams.get('providerId')

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
        urgency: true,
        zip: true,
        city: true,
        state: true,
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
    if (lead.status === 'OPEN') status = 'open'
    else if (lead.status === 'CLAIMED') status = 'claimed'

    // Check if the requesting provider is the one who claimed this lead.
    // We check either:
    //   1. A logged-in dashboard session (cookie-based)
    //   2. A ?providerId=... URL param (used when returning via email link)
    const session = getSessionFromRequest(req)
    const requestingProviderId = session?.providerId || providerIdParam

    const isClaimedByRequester = !!(
      lead.status === 'CLAIMED' &&
      lead.routedToId &&
      requestingProviderId &&
      lead.routedToId === requestingProviderId
    )

    // If the requester is the claimer, return full patient contact info
    // so they can see the details on repeat visits to the claim URL
    if (isClaimedByRequester) {
      const fullLead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          address1: true,
          city: true,
          state: true,
          zip: true,
          urgency: true,
          notes: true,
          labPreference: true,
        }
      })
      return NextResponse.json({
        ok: true,
        status,
        leadId: lead.id,
        isClaimedByYou: true,
        lead: fullLead,
      })
    }

    // Otherwise, return only the preview info (no PHI)
    return NextResponse.json({
      ok: true,
      status,
      leadId: lead.id,
      urgency: lead.urgency,
      zip: lead.zip,
      city: lead.city,
      state: lead.state,
      isClaimedByYou: false,
    })

  } catch (error: any) {
    console.error('Lead status check error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to check lead status' },
      { status: 500 }
    )
  }
}
