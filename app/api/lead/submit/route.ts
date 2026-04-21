import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { priceFor } from '@/lib/leadPricing'
import { notifyAdminUnservedLead, reachOutToNearbyProviders, sendExpansionEmailToLead } from '@/lib/notifyProvider'
import { sendSMSBlastToEligibleProviders } from '@/lib/smsBlast'
import { notifyFeaturedProvidersForLead } from '@/lib/leadNotifications'
import { normalizeCity } from '@/lib/normalizeCity'
import { notifyHighValueLead } from '@/lib/notifyHighValueLead'

const DRAW_COUNTS = ['1', '2-5', '6-20', '20+'] as const
const REQUEST_TYPES = ['individual', 'organization', 'business'] as const
type DrawCount = typeof DRAW_COUNTS[number]
type RequestType = typeof REQUEST_TYPES[number]

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
  preferredProviderId: z.string().optional(),
  // High-value capture (all optional; form defaults to individual/1-person)
  drawCount: z.enum(DRAW_COUNTS).optional(),
  requestType: z.enum(REQUEST_TYPES).optional(),
  organizationName: z.string().optional(),
  timeframe: z.string().optional(),
})

/**
 * Classifies a lead as high-value when the patient is requesting for a group
 * of 6+ people OR when the requester is an organization/business (not an
 * individual/family). Returns the derived fields to persist on the lead row.
 */
function classifyLead(drawCount: DrawCount | undefined, requestType: RequestType | undefined) {
  const dc = drawCount || '1'
  const rt = requestType || 'individual'
  const isGroup = dc === '6-20' || dc === '20+'
  const isOrganization = rt === 'organization' || rt === 'business'
  const isHighValue = isGroup || isOrganization
  const estimatedValueCents =
    dc === '20+' ? 300000 :
    dc === '6-20' ? 150000 :
    0
  return { drawCount: dc, requestType: rt, isHighValue, estimatedValueCents }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = schema.parse(body)

    const priceCents = priceFor(payload.urgency)
    // Normalize city at write time so analytics + routing see consistent values
    const city = normalizeCity(payload.city)
    const { drawCount, requestType, isHighValue, estimatedValueCents } =
      classifyLead(payload.drawCount, payload.requestType)

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
        status: 'OPEN',  // Ready for claiming
        drawCount,
        requestType,
        isHighValue,
        estimatedValueCents,
        organizationName: payload.organizationName || null,
        timeframe: payload.timeframe || null,
      }
    })

    console.log(`✅ Lead created: ${lead.id} - ${lead.city}, ${lead.state} ${lead.zip}${isHighValue ? ' [HIGH VALUE]' : ''}`)

    // High-value leads — immediate admin notification so group/org requests get
    // hands-on follow-up regardless of normal routing outcomes. Fire-and-forget;
    // don't block the patient response on this email delivering.
    if (isHighValue) {
      notifyHighValueLead({
        id: lead.id,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        urgency: lead.urgency,
        notes: lead.notes,
        drawCount: lead.drawCount,
        requestType: lead.requestType,
        organizationName: lead.organizationName,
        timeframe: lead.timeframe,
        estimatedValueCents: lead.estimatedValueCents,
      }).catch(err => console.error(`[Lead ${lead.id}] ❌ High-value admin email FAILED:`, err.message || err))
    }

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
