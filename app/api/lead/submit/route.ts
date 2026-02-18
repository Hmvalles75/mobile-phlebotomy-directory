import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { priceFor } from '@/lib/leadPricing'
import { notifyAdminUnservedLead, reachOutToNearbyProviders } from '@/lib/notifyProvider'
import { sendSMSBlastToEligibleProviders } from '@/lib/smsBlast'
import { notifyFeaturedProvidersForLead } from '@/lib/leadNotifications'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address1: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().min(5, 'ZIP code must be at least 5 characters'),
  labPreference: z.string().min(1, 'Lab preference is required'),
  urgency: z.enum(['STANDARD', 'STAT']),
  notes: z.string().optional(),
  // Optional tracking fields
  source: z.string().optional(),
  preferredProviderId: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = schema.parse(body)

    const priceCents = priceFor(payload.urgency)

    // Create the lead with OPEN status for Race to Claim
    const lead = await prisma.lead.create({
      data: {
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email || null,
        address1: payload.address1,
        city: payload.city,
        state: payload.state,
        zip: payload.zip,
        labPreference: payload.labPreference,
        urgency: payload.urgency,
        notes: payload.notes,
        source: payload.source || 'web_form',
        preferredProviderId: payload.preferredProviderId || null,
        priceCents,
        status: 'OPEN'  // Ready for claiming
      }
    })

    console.log(`✅ Lead created: ${lead.id} - ${lead.city}, ${lead.state} ${lead.zip}`)

    // Send email notifications to featured providers (Phase 1)
    // Runs async and doesn't block the response
    // If this fails, the cron job at /api/cron/catch-missed-notifications will retry
    notifyFeaturedProvidersForLead(lead.id)
      .then(count => {
        console.log(`[Lead ${lead.id}] ✅ Featured provider email: ${count} sent`)
      })
      .catch(err => {
        console.error(`[Lead ${lead.id}] ❌ Featured provider email FAILED:`, err.message || err)
      })

    // Send SMS blast to all eligible providers in the area (Race to Claim)
    // Runs async and doesn't block the response
    sendSMSBlastToEligibleProviders({
      id: lead.id,
      zip: payload.zip,
      urgency: payload.urgency,
      city: payload.city,
      state: payload.state
    }).then(async (count) => {
      console.log(`[Lead ${lead.id}] ✅ SMS blast: ${count} sent`)
      // If no opted-in providers were notified, reach out to nearby non-opted-in providers
      if (count === 0) {
        console.log(`[Lead ${lead.id}] No eligible providers - reaching out to nearby providers`)
        notifyAdminUnservedLead(lead).catch(console.error)
        reachOutToNearbyProviders(lead, 30).catch(console.error) // 30 mile radius
      }
    }).catch(err => {
      console.error(`[Lead ${lead.id}] ❌ SMS blast FAILED:`, err.message || err)
      notifyAdminUnservedLead(lead).catch(console.error)
      reachOutToNearbyProviders(lead, 30).catch(console.error)
    })

    // Return success immediately
    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      status: 'open',
      message: 'Lead created and notifications sent to providers'
    })
  } catch (e: any) {
    console.error('Lead submission error:', e)

    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ok: false, error: e.message || 'Failed to submit lead' },
      { status: 400 }
    )
  }
}
