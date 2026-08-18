import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PAID_HEAD_START_SECONDS } from '@/lib/leadNotifications'

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
        priorityRouting: true,
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

    // Fetch leads claimed by this provider (DPPL system).
    // Includes both currently-CLAIMED leads and DELIVERED leads (outcome already
    // recorded) from the last 30 days, so completing a lead doesn't make it
    // disappear from the provider's view. The lead row's outcome badge surfaces
    // which state each lead is in.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const claimedLeads = await prisma.lead.findMany({
      where: {
        routedToId: session.providerId,
        status: { in: ['CLAIMED', 'DELIVERED'] },
        claimedAt: { gte: thirtyDaysAgo },
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
        routedAt: true,
        claimedAt: true,
        outcome: true,
        outcomeNotes: true,
        appointmentDate: true,
        isHighValue: true,
        drawCount: true,
        hasDoctorOrder: true,
        paymentMethod: true,
      }
    })

    // Fetch OPEN leads available to claim in provider's service area
    // Only show leads if provider is currently available
    let availableLeads: any[] = []
    let recentlyClaimedLeads: any[] = []

    if (isProviderAvailableNow()) {
      // Get provider's primary ZIP code and service radius
      const providerZipCodes = provider.zipCodes ? provider.zipCodes.split(',').map(z => z.trim()) : []
      const primaryZip = providerZipCodes[0] || null
      const serviceRadius = provider.serviceRadiusMiles || 25 // Default 25 miles

      // Fetch all OPEN leads from the last 14 days (we'll filter by radius in memory)
      // Older than 14 days = stale; patient most likely got service elsewhere
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      let allOpenLeads = await prisma.lead.findMany({
        where: {
          status: 'OPEN',
          createdAt: { gte: fourteenDaysAgo },
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

      // ── Paid head-start window ──────────────────────────────────────────
      //
      // This queue is why the paid head start never worked. Holding Wave 2
      // *emails* back protected nothing while this route handed every OPEN
      // lead to every logged-in provider the instant it existed — a free
      // provider with the dashboard open saw the lead at the same moment the
      // paying provider was emailed. A paying customer asked on 2026-08-14 how
      // long his window was; the honest answer was that he had never had one.
      //
      // So the window applies here too. A non-paying provider does not see a
      // lead that is still inside the head start, and only when the window is
      // actually in force for that lead: a paying provider was notified, and
      // the request is not urgent. Everything else is unchanged, and the lead
      // appears here the moment the window closes.
      if (!provider.priorityRouting) {
        const cutoff = new Date(Date.now() - PAID_HEAD_START_SECONDS * 1000)
        const candidates = allOpenLeads.filter(l => l.urgency !== 'STAT')

        if (candidates.length > 0) {
          // Keyed on when a paying provider was NOTIFIED, not on lead age.
          //
          // Lead age was the first attempt and it was wrong: a lead released by
          // the stale-claim sweep is re-notified to everyone again, and by then
          // it is hours old, so an age-based gate silently switched off for
          // every round after the first. The Westminster lead of 2026-08-14 went
          // out in three rounds — 0, 375 and 749 minutes after creation — and
          // only the first was protected. The paying provider noticed.
          //
          // Notification recency handles first send and every re-offer
          // identically. Restricting to paying providers keeps this in step
          // with freeTierDelaySeconds(), which applies no delay when none
          // covers the area — otherwise free providers would lose leads nobody
          // was ever given a head start on.
          const contested = await prisma.leadNotification.findMany({
            where: {
              leadId: { in: candidates.map(l => l.id) },
              provider: { priorityRouting: true },
              createdAt: { gt: cutoff },
              // A passed lead is released immediately — the paying provider
              // has said they don't want it, so there is nothing left to
              // protect and the patient should stop waiting. See
              // lib/passLead.ts.
              passedAt: null,
            },
            select: { leadId: true },
            distinct: ['leadId'],
          })
          const held = new Set(contested.map(c => c.leadId))
          if (held.size > 0) {
            allOpenLeads = allOpenLeads.filter(l => !held.has(l.id))
            console.log(
              `[Dashboard] Provider ${provider.id} (free tier) — withheld ${held.size} lead(s) ` +
              `inside the ${PAID_HEAD_START_SECONDS}s paid head start`
            )
          }
        }
      }

      // Filter leads by radius if provider has a ZIP code
      if (primaryZip) {
        const { isLeadInServiceRadius } = await import('@/lib/zip-geocode')

        availableLeads = allOpenLeads.filter(lead =>
          isLeadInServiceRadius(primaryZip, lead.zip, serviceRadius)
        ).slice(0, 20) // Limit to 20 leads

        // Leads someone else took, kept visible for 7 days.
        //
        // Previously these vanished the instant they were claimed, so a
        // provider watching the dashboard saw a lead appear and silently
        // disappear with no explanation. Seeing what you missed is the point:
        // every paid subscriber converted within hours of a live lead, and a
        // lost one is the same signal.
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const claimedElsewhere = await prisma.lead.findMany({
          where: {
            status: 'CLAIMED',
            claimedAt: { gte: sevenDaysAgo },
            routedToId: { not: session.providerId },
          },
          orderBy: { claimedAt: 'desc' },
          select: {
            id: true, createdAt: true, claimedAt: true,
            city: true, state: true, zip: true, urgency: true,
          },
        })
        recentlyClaimedLeads = claimedElsewhere
          .filter(lead => isLeadInServiceRadius(primaryZip, lead.zip, serviceRadius))
          .slice(0, 20)
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
      recentlyClaimedLeads,
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
