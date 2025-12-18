import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { priceFor } from '@/lib/leadPricing'
import { notifyAdminUnservedLead } from '@/lib/notifyProvider'
import { sendSMSBlastToEligibleProviders } from '@/lib/smsBlast'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address1: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().min(5, 'ZIP code must be at least 5 characters'),
  urgency: z.enum(['STANDARD', 'STAT']),
  notes: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = schema.parse(body)

    const priceCents = priceFor(payload.urgency)

    // Create the lead with OPEN status for Race to Claim
    const lead = await prisma.lead.create({
      data: {
        ...payload,
        email: payload.email || null,
        source: 'web_form',
        priceCents,
        status: 'OPEN'  // Ready for claiming
      }
    })

    console.log(`✅ Lead created: ${lead.id} - ${lead.city}, ${lead.state} ${lead.zip}`)

    // Send SMS blast to all eligible providers in the area (Race to Claim)
    // Runs async and doesn't block the response
    sendSMSBlastToEligibleProviders({
      id: lead.id,
      zip: payload.zip,
      urgency: payload.urgency,
      city: payload.city,
      state: payload.state
    }).catch(err => {
      console.error('SMS blast failed:', err)
      // Also notify admin if SMS blast fails
      notifyAdminUnservedLead(lead).catch(console.error)
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
