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
      if (!provider.operatingDays || !provider.operatingHoursStart || !provider.operatingHoursEnd) {
        // If no availability settings, assume available (backwards compatibility)
        return true
      }

      const now = new Date()
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      const currentDay = dayNames[now.getDay()]

      // Check if current day is in operating days
      const operatingDaysList = provider.operatingDays.split(',').map(d => d.trim())
      if (!operatingDaysList.includes(currentDay)) {
        return false
      }

      // Check if current time is within operating hours
      const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
      if (currentTime < provider.operatingHoursStart || currentTime > provider.operatingHoursEnd) {
        return false
      }

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
      // Parse provider's zip codes
      const providerZipCodes = provider.zipCodes ? provider.zipCodes.split(',').map(z => z.trim()) : []

      availableLeads = await prisma.lead.findMany({
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
    } else {
      // Provider is not available right now - don't show any leads
      console.log(`[Dashboard] Provider ${provider.id} is not available at this time`)
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
