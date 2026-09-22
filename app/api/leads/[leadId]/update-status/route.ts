import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadOutcome } from '@prisma/client'
import { notifyFeaturedProvidersForLead, renotifyOpenLead } from '@/lib/leadNotifications'

/**
 * Outcomes that end the provider's involvement (2026-09-22).
 *
 * Until now every outcome, terminal or not, left the lead CLAIMED by the
 * provider who logged it. Any non-null outcome also stops the stale-claim
 * release, so a lead the provider could not serve sat frozen on their account:
 * Dynamic Stix told a Newark, DE patient they don't cover Delaware, logged
 * "not interested", and the request stayed with them for a day while the
 * provider 13 miles away never saw it. Comfort Mobile's patient declined on
 * price; nothing was logged, the clock released it, and the provider got an
 * auto-release notice for doing the right thing on the phone.
 *
 *  - CANNOT_SERVE (OUTSIDE_SERVICE_AREA, WRONG_SERVICE, NO_AVAILABILITY): the
 *    patient is fine, this provider is not the one. Release and re-offer at
 *    once, to providers who never saw it plus the still-unclaimed reminder,
 *    excluding the provider who bowed out.
 *  - PATIENT_CLOSED (DECLINED, NOT_INTERESTED): the patient said no. Closed,
 *    not re-offered; the next provider would hear the same answer. The claim
 *    stays on the provider's record.
 */
const CANNOT_SERVE = new Set<string>(['OUTSIDE_SERVICE_AREA', 'WRONG_SERVICE', 'NO_AVAILABILITY'])
const PATIENT_CLOSED = new Set<string>(['DECLINED', 'NOT_INTERESTED'])

/**
 * Update lead status and tracking information
 * Used by providers to report on lead outcomes
 * Can be called via:
 * 1. Web interface (authenticated)
 * 2. SMS webhook (verified via Twilio signature)
 * 3. Email webhook (verified via SendGrid)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params
    const body = await request.json()

    const {
      action, // 'claim' | 'contact' | 'update_outcome' | 'complete'
      outcome, // LeadOutcome enum value
      outcomeNotes,
      appointmentDate,
      providerNotes,
      providerId // Required for verification
    } = body

    // Verify lead exists and belongs to this provider
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { provider: true }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      )
    }

    if (lead.routedToId !== providerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - lead not assigned to this provider' },
        { status: 403 }
      )
    }

    // Build update data based on action
    const updateData: any = {}

    switch (action) {
      case 'claim':
        updateData.claimedAt = new Date()
        updateData.status = 'CLAIMED'
        updateData.callAttempts = (lead.callAttempts || 0) + 1
        break

      case 'contact':
        if (!lead.firstContactAt) {
          updateData.firstContactAt = new Date()
        }
        updateData.callAttempts = (lead.callAttempts || 0) + 1
        break

      case 'update_outcome':
        if (outcome && Object.values(LeadOutcome).includes(outcome)) {
          updateData.outcome = outcome
          // The soft-outcome nudge (lib/softOutcomeNudge.ts) counts from here.
          if (outcome !== lead.outcome) updateData.outcomeUpdatedAt = new Date()
        }
        if (outcomeNotes) {
          updateData.outcomeNotes = outcomeNotes
        }
        if (appointmentDate) {
          updateData.appointmentDate = new Date(appointmentDate)
        }
        if (updateData.outcome && PATIENT_CLOSED.has(updateData.outcome) && lead.status === 'CLAIMED') {
          updateData.status = 'CLOSED_DECLINED'
        }
        if (updateData.outcome && CANNOT_SERVE.has(updateData.outcome) && lead.status === 'CLAIMED') {
          // Atomic: only the current claimer can hand it back, and only once.
          const released = await prisma.lead.updateMany({
            where: { id: leadId, routedToId: providerId, status: 'CLAIMED' },
            data: {
              status: 'OPEN', routedToId: null, claimedAt: null, firstContactAt: null, callAttempts: 0,
              outcome: null,
              outcomeNotes: `${lead.provider?.name?.trim() || providerId} could not serve this request (${String(updateData.outcome).toLowerCase().replace(/_/g, ' ')})${outcomeNotes ? `: ${outcomeNotes}` : ''}`,
              releasedFromProviderId: providerId, releasedAt: new Date(), releaseReason: 'provider_cannot_serve',
              ...(providerNotes ? { providerNotes } : {}),
            },
          })
          if (released.count === 0) {
            return NextResponse.json({ success: false, error: 'Lead is no longer claimed by this provider' }, { status: 409 })
          }
          console.log(`[update-status] ${providerId} cannot serve ${leadId} (${updateData.outcome}); released and re-offering`)
          // Awaited: Next 14 on Vercel has no waitUntil, so a fire-and-forget
          // send can be cut off when the response returns. Same pair as the
          // release route: never-notified providers, then the 12h-gated reminder.
          try {
            await notifyFeaturedProvidersForLead(leadId, { onlyNewProviders: true })
            await renotifyOpenLead(leadId, { excludeProviderIds: [providerId] })
          } catch (err: any) {
            console.error(`[update-status] re-offer after cannot-serve failed for ${leadId}:`, err?.message || err)
          }
          return NextResponse.json({ success: true, released: true, lead: { id: leadId, status: 'OPEN' } })
        }
        break

      case 'complete':
        updateData.completedAt = new Date()
        updateData.status = 'DELIVERED'
        if (outcome) {
          updateData.outcome = outcome
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Add provider notes if provided
    if (providerNotes) {
      updateData.providerNotes = providerNotes
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      lead: {
        id: updatedLead.id,
        status: updatedLead.status,
        claimedAt: updatedLead.claimedAt,
        firstContactAt: updatedLead.firstContactAt,
        callAttempts: updatedLead.callAttempts,
        outcome: updatedLead.outcome,
        appointmentDate: updatedLead.appointmentDate,
        completedAt: updatedLead.completedAt
      }
    })

  } catch (error) {
    console.error('Error updating lead status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get lead status and tracking info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Verify provider access
    if (providerId && lead.routedToId !== providerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        status: lead.status,
        claimedAt: lead.claimedAt,
        firstContactAt: lead.firstContactAt,
        callAttempts: lead.callAttempts,
        outcome: lead.outcome,
        outcomeNotes: lead.outcomeNotes,
        appointmentDate: lead.appointmentDate,
        completedAt: lead.completedAt,
        providerNotes: lead.providerNotes
      }
    })

  } catch (error) {
    console.error('Error fetching lead status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
