import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyProviderOfLead } from '@/lib/notifyProvider'
import { sendPatientClaimNotice } from '@/lib/patientClaimNotice'
import { cancelLeadNotifications } from '@/lib/cancelLeadNotifications'

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
      // phonePublic feeds the patient claim notice — recognising the number
      // that is about to ring is the whole point of that email.
      select: { id: true, name: true, phonePublic: true, phone: true }
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

    // Re-claiming a lead you just lost to the stale-claim sweep is engagement,
    // not neglect — so undo the strike the sweep put on the provider.
    //
    // The 6-hour SLA assumes someone who claims and forgets. What it actually
    // catches is someone mid-booking: Precision Care re-claimed within an hour
    // and logged APPOINTMENT_BOOKED, and has an outcome on every lead they have
    // ever taken, yet carried 4 strikes. Three other providers hit the same
    // thing. A provider who comes straight back is demonstrating exactly the
    // behaviour the counter is meant to reward.
    //
    // Only the PROVIDER counter is decremented. lead.staleReleaseCount stays —
    // that one is the loop guard behind MAX_STALE_RELEASE_CYCLES and must keep
    // counting, or a lead could cycle forever between release and re-claim.
    if (lead.releasedFromProviderId === providerId && lead.releaseReason === 'stale_claim') {
      try {
        const p = await prisma.provider.findUnique({
          where: { id: providerId },
          select: { staleReleaseCount: true },
        })
        if (p && p.staleReleaseCount > 0) {
          await prisma.provider.update({
            where: { id: providerId },
            data: { staleReleaseCount: { decrement: 1 } },
          })
          console.log(
            `[Claim] ${providerId} re-claimed lead ${leadId} after its own stale release — ` +
            `strike reversed (${p.staleReleaseCount} → ${p.staleReleaseCount - 1})`
          )
        }
      } catch (err: any) {
        // Never fail a claim over a reputation counter.
        console.error('[Claim] Failed to reverse stale strike:', err.message || err)
      }
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

    // Cancel queued/scheduled SendGrid sends for this lead and send a
    // courtesy "claimed" email to providers who already received the
    // notification — best effort, fire and forget.
    cancelLeadNotifications(leadId, providerId).catch(err => {
      console.error('Failed to cancel/notify other providers:', err)
    })

    // Tell the PATIENT who is coming. Until now a claim notified the claiming
    // provider and the providers who lost it, and said nothing to the person
    // waiting — who then sits in silence until an unknown mobile rings, while
    // working down a Google results page. PATIENT_FOUND_OTHER is the fourth
    // most common outcome on record (17 against 31 booked), every one of them
    // after a provider had already claimed and begun work.
    //
    // Fire-and-forget: a failed notice must never fail a claim.
    prisma.lead
      .findUnique({
        where: { id: leadId },
        select: { fullName: true, email: true, city: true, state: true },
      })
      .then(patient => {
        if (!patient) return
        return sendPatientClaimNotice({
          leadId,
          fullName: patient.fullName,
          email: patient.email,
          city: patient.city,
          state: patient.state,
          providerName: provider.name,
          providerPhone: provider.phonePublic || provider.phone,
        })
      })
      .catch(err => console.error('Failed to send patient claim notice:', err))

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
