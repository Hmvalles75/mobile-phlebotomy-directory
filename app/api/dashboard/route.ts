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

    // Fetch provider data with availability settings
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
        updatedAt: true,
        operatingDays: true,
        operatingHoursStart: true,
        operatingHoursEnd: true,
        serviceRadiusMiles: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Check if provider is currently available based on their settings
    const isProviderAvailableNow = () => {
      // Always show leads regardless of time/day settings
      // Providers should be able to see and claim leads 24/7
      // The operating hours are just for displaying to patients
      return true
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
    // Only show leads if provider is currently available
    let availableLeads: any[] = []

    if (isProviderAvailableNow()) {
      // Get provider's primary ZIP code and service radius
      const providerZipCodes = provider.zipCodes ? provider.zipCodes.split(',').map(z => z.trim()) : []
      const primaryZip = providerZipCodes[0] || null
      const serviceRadius = provider.serviceRadiusMiles || 25 // Default 25 miles

      // Fetch all OPEN leads (we'll filter by radius in memory)
      const allOpenLeads = await prisma.lead.findMany({
        where: {
          status: 'OPEN'
        },
        orderBy: {
          createdAt: 'desc'
        },
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

      // Filter leads by radius if provider has a ZIP code
      if (primaryZip) {
        const { isLeadInServiceRadius } = await import('@/lib/zip-geocode')

        availableLeads = allOpenLeads.filter(lead =>
          isLeadInServiceRadius(primaryZip, lead.zip, serviceRadius)
        ).slice(0, 20) // Limit to 20 leads
      } else {
        // No ZIP code set, show no leads
        availableLeads = []
      }
    }

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
