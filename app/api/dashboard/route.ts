import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch provider data
    const provider = await prisma.provider.findUnique({
      where: { id: session.providerId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        stripePaymentMethodId: true,
        featuredTier: true,
        claimEmail: true,
        email: true,
        phone: true,
        phonePublic: true,
        website: true,
        zipCodes: true,
        twilioNumber: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Fetch leads claimed by this provider (DPPL system)
    const claimedLeads = await prisma.lead.findMany({
      where: {
        routedToId: session.providerId,
        status: 'CLAIMED'
      },
      orderBy: {
        routedAt: 'desc'
      },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        fullName: true,
        phone: true,
        email: true,
        city: true,
        state: true,
        zip: true,
        urgency: true,
        status: true,
        priceCents: true,
        notes: true,
        routedAt: true
      }
    })

    // Fetch OPEN leads available to claim in provider's service area
    // Parse provider's zip codes
    const providerZipCodes = provider.zipCodes ? provider.zipCodes.split(',').map(z => z.trim()) : []

    const availableLeads = await prisma.lead.findMany({
      where: {
        status: 'OPEN',
        ...(providerZipCodes.length > 0 ? {
          zip: {
            in: providerZipCodes
          }
        } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        city: true,
        state: true,
        zip: true,
        urgency: true,
        status: true,
        priceCents: true
      }
    })

    // Check trial status
    const providerWithTrial = await prisma.provider.findUnique({
      where: { id: session.providerId },
      select: {
        trialStatus: true,
        trialExpiresAt: true
      }
    })

    let isTrialActive = false
    if (providerWithTrial && providerWithTrial.trialStatus === 'ACTIVE' && providerWithTrial.trialExpiresAt) {
      isTrialActive = providerWithTrial.trialExpiresAt > new Date()
    }

    // Calculate stats
    const stats = {
      totalLeads: claimedLeads.length,
      claimedLeads: claimedLeads.length,
      availableLeads: availableLeads.length,
      totalSpent: claimedLeads.reduce((sum: number, lead: typeof claimedLeads[number]) => sum + lead.priceCents, 0) / 100
    }

    return NextResponse.json({
      ok: true,
      provider,
      claimedLeads,
      availableLeads,
      stats,
      isTrialActive
    })

  } catch (error: any) {
    console.error('[Dashboard API] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
