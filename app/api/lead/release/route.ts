import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyFeaturedProvidersForLead, recordProviderDecline, renotifyOpenLead } from '@/lib/leadNotifications'

/**
 * Release a claimed lead back to the pool.
 *
 * Allows a provider to return a lead they claimed (via accidental click, no
 * contact, scheduling conflict, wrong service type, etc.) back to status OPEN
 * so other providers in the ZIP can claim and fulfill it.
 *
 * Atomic guard: updateMany with WHERE routedToId matches providerId. Prevents
 * cross-provider tampering — only the current claimer can release.
 *
 * POST body: { leadId: string, providerId: string, reason?: string }
 */
const VALID_REASONS = ['NO_CONTACT', 'SCHEDULING_CONFLICT', 'WRONG_SERVICE', 'ACCIDENTAL_CLAIM', 'OTHER'] as const
type ReleaseReason = typeof VALID_REASONS[number]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadId, providerId } = body as { leadId?: string; providerId?: string; reason?: string }
    const reason = (body.reason || 'OTHER') as ReleaseReason

    if (!leadId || !providerId) {
      return NextResponse.json(
        { ok: false, error: 'Lead ID and Provider ID are required' },
        { status: 400 }
      )
    }

    // Atomic release: only succeeds if the lead is currently CLAIMED and owned
    // by the requesting provider. This single UPDATE prevents race conditions
    // and cross-provider tampering in one shot.
    const released = await prisma.lead.updateMany({
      where: {
        id: leadId,
        routedToId: providerId,
        status: 'CLAIMED',
      },
      data: {
        status: 'OPEN',
        routedToId: null,
        claimedAt: null,
        firstContactAt: null,
        callAttempts: 0,
        outcome: null,
        outcomeNotes: reason,  // Capture release reason in outcomeNotes for audit
        // Stamp who let go so the re-offer does not go straight back to them
        // (Dynamic Stix, 2026-09-21: released from the dashboard, then got the
        // admin "still unclaimed" reminder for the same lead).
        releasedFromProviderId: providerId,
        releasedAt: new Date(),
        releaseReason: 'provider_released',
      },
    })

    if (released.count === 0) {
      // Diagnose: does the lead exist? Is it claimed by someone else?
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { status: true, routedToId: true },
      })
      if (!lead) {
        return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
      }
      if (lead.status !== 'CLAIMED') {
        return NextResponse.json(
          { ok: false, error: `Lead cannot be released (status is ${lead.status}, not CLAIMED)` },
          { status: 400 }
        )
      }
      if (lead.routedToId !== providerId) {
        return NextResponse.json(
          { ok: false, error: 'You do not own this lead — only the claiming provider can release it' },
          { status: 403 }
        )
      }
    }

    await recordProviderDecline(leadId, providerId)
    console.log(`[LeadRelease] Lead ${leadId} released back to pool by provider ${providerId} (reason: ${reason})`)

    // Re-offer the lead. Awaited: Next 14 on Vercel has no waitUntil, so a
    // fire-and-forget send can be cut off when the response returns.
    //   1. Providers who never actually saw it: matched providers with no row,
    //      plus rows CANCELLED at SendGrid during the claimer's head start
    //      (Palm Springs 2026-09-12: three free listings were skipped here as
    //      "already notified" and the lead sat OPEN for days).
    //   2. Providers who did see it and did not claim: the still-unclaimed
    //      reminder, which keeps its own 12-hour minimum, so a quick
    //      claim-and-release does not double-email anyone.
    try {
      await notifyFeaturedProvidersForLead(leadId, { onlyNewProviders: true })
      await renotifyOpenLead(leadId, { excludeProviderIds: [providerId] })
    } catch (err: any) {
      console.error(`[LeadRelease] Re-notification failed for ${leadId}:`, err.message || err)
    }

    return NextResponse.json({
      ok: true,
      message: 'Lead released back to the pool. Other providers in the area have been re-notified.',
    })
  } catch (error: any) {
    console.error('Release error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to release lead' },
      { status: 400 }
    )
  }
}
