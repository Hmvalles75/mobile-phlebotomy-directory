import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { priceFor } from '@/lib/leadPricing'
import { sendLeadToProvider, notifyAdminUnservedLead, notifyProviderLowCredits } from '@/lib/notifyProvider'
import { routeLeadToProvider } from '@/lib/routing'

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

    // Try to route to a provider
    const provider = await routeLeadToProvider(payload.zip)

    if (provider) {
      // Check if provider has credits
      if (provider.leadCredit > 0) {
        // Deliver the lead
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            routedToId: provider.id,
            routedAt: new Date(),
            status: 'DELIVERED'
          }
        })

        // Send notifications
        await sendLeadToProvider(provider, lead)

        // Decrement credits
        await prisma.provider.update({
          where: { id: provider.id },
          data: { leadCredit: { decrement: 1 } }
        })

        return NextResponse.json({
          ok: true,
          leadId: lead.id,
          routedTo: provider.slug,
          status: 'delivered'
        })
      } else {
        // Provider found but no credits
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            routedToId: provider.id,
            routedAt: new Date(),
            status: 'DELIVERED' // Still mark as delivered, but provider needs to top up
          }
        })

        // Notify provider to purchase credits
        await notifyProviderLowCredits(provider, lead)

        return NextResponse.json({
          ok: true,
          leadId: lead.id,
          routedTo: provider.slug,
          status: 'pending_credits'
        })
      }
    } else {
      // No provider found for this ZIP
      await notifyAdminUnservedLead(lead)

      return NextResponse.json({
        ok: true,
        leadId: lead.id,
        routedTo: null,
        status: 'unserved'
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
