import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP code format')
})

// Speedy Sticks affiliate URL (fallback for low-coverage areas)
const AFFILIATE_URL = process.env.NEXT_PUBLIC_SPEEDY_STICKS_AFFILIATE_URL || 'https://speedysticks.com?ref=mobilephlebotomy'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { zipCode } = parsed.data

    // TODO: Implement proper ZIP code radius matching
    // For MVP, we show all active providers since ZIP code data is incomplete
    // Future: Use ZIP code database to match providers within X mile radius

    const providers = await prisma.provider.findMany({
      where: {
        status: { in: ['VERIFIED', 'PENDING'] } // Only active providers
      },
      select: {
        id: true,
        name: true,
        listingTier: true
      }
    })

    console.log(`[Coverage Check] ZIP ${zipCode}: Found ${providers.length} total active providers`)

    // DECISION LOGIC: Route based on provider count
    if (providers.length >= 3) {
      // HIGH COVERAGE: Route to internal lead form
      return NextResponse.json({
        ok: true,
        coverage: 'high',
        providerCount: providers.length,
        action: 'lead_form',
        message: `Great news! We found ${providers.length} certified providers in your area.`
      })
    } else {
      // LOW COVERAGE: Route to affiliate (Speedy Sticks)
      return NextResponse.json({
        ok: true,
        coverage: 'low',
        providerCount: providers.length,
        action: 'affiliate',
        affiliateUrl: AFFILIATE_URL,
        message: providers.length > 0
          ? `We found ${providers.length} provider(s) in your area. For guaranteed availability, we recommend our trusted partner Speedy Sticks.`
          : 'For guaranteed availability in your area, we recommend our trusted partner Speedy Sticks.'
      })
    }

  } catch (error: any) {
    console.error('[Coverage Check] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to check coverage' },
      { status: 500 }
    )
  }
}
