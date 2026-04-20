import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { priceFor } from '@/lib/leadPricing'
import { notifyAdminUnservedLead, reachOutToNearbyProviders, sendExpansionEmailToLead } from '@/lib/notifyProvider'
import { sendSMSBlastToEligibleProviders } from '@/lib/smsBlast'
import { notifyFeaturedProvidersForLead } from '@/lib/leadNotifications'
import { normalizeCity } from '@/lib/normalizeCity'

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
    // Normalize city at write time so analytics + routing see consistent values
    const city = normalizeCity(payload.city)

    // Create the lead with OPEN status for Race to Claim
    const lead = await prisma.lead.create({
      data: {
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email || null,
        address1: payload.address1,
        city,
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

    // Send notifications synchronously to ensure they complete before function terminates
    // This adds ~1-3 seconds to response time but guarantees delivery
    let emailCount = 0
    let smsCount = 0

    try {
      // Send email notifications to featured providers (Phase 1)
      emailCount = await notifyFeaturedProvidersForLead(lead.id)
      console.log(`[Lead ${lead.id}] ✅ Featured provider email: ${emailCount} sent`)
    } catch (err: any) {
      console.error(`[Lead ${lead.id}] ❌ Featured provider email FAILED:`, err.message || err)
    }

    try {
      // Send SMS blast to all eligible providers in the area (Race to Claim)
      smsCount = await sendSMSBlastToEligibleProviders({
        id: lead.id,
        zip: payload.zip,
        urgency: payload.urgency,
        city,
        state: payload.state
      })
      console.log(`[Lead ${lead.id}] ✅ SMS blast: ${smsCount} sent`)
    } catch (err: any) {
      console.error(`[Lead ${lead.id}] ❌ SMS blast FAILED:`, err.message || err)
    }

    // If NO providers were notified at all, this is an uncovered area
    // Send expansion email to the lead and notify admin
    if (emailCount === 0 && smsCount === 0) {
      console.log(`[Lead ${lead.id}] No coverage in ${city}, ${payload.state} - sending expansion email`)

      // Send expansion email to the lead
      await sendExpansionEmailToLead({
        id: lead.id,
        fullName: payload.fullName,
        email: payload.email,
        city,
        state: payload.state
      }).catch(console.error)

      // Still notify admin about unserved lead
      await notifyAdminUnservedLead(lead).catch(console.error)
    }

    // Return success
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
