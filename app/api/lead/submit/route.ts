import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { priceFor } from '@/lib/leadPricing'
import { notifyAdminUnservedLead } from '@/lib/notifyProvider'
import { routeLeadAndCharge } from '@/lib/leadRouting'

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

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        ...payload,
        email: payload.email || null,
        source: 'web_form',
        priceCents
      }
    })

    // Automatically route lead to an eligible provider (DPPL system)
    // This function handles:
    // 1. Finding providers with saved payment methods in the ZIP code
    // 2. Attempting to charge each provider via Stripe
    // 3. If charge succeeds, updating lead status and sending notification
    // 4. If charge fails, trying next provider and notifying failed provider
    const routedProviderId = await routeLeadAndCharge({
      id: lead.id,
      zip: payload.zip,
      priceCents,
      urgency: payload.urgency,
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      city: payload.city,
      state: payload.state,
      address1: payload.address1,
      notes: payload.notes
    })

    if (routedProviderId) {
      // Successfully routed and provider charged
      return NextResponse.json({
        ok: true,
        leadId: lead.id,
        status: 'routed',
        message: 'Lead successfully delivered to provider'
      })
    } else {
      // No eligible provider found (no one in area with valid payment method)
      await notifyAdminUnservedLead(lead)

      return NextResponse.json({
        ok: true,
        leadId: lead.id,
        status: 'unserved',
        message: 'Lead created but no eligible provider found'
      })
    }
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
