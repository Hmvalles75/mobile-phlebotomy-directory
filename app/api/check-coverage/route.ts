import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import zipcodes from 'zipcodes'

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

    // Step 1: Look up city and state from ZIP code
    const zipInfo = zipcodes.lookup(zipCode)

    if (!zipInfo) {
      console.log(`[Coverage Check] ZIP ${zipCode}: Invalid or unknown ZIP code`)
      return NextResponse.json({
        ok: false,
        error: 'Invalid ZIP code or coverage area not found'
      }, { status: 404 })
    }

    const { city, state } = zipInfo
    console.log(`[Coverage Check] ZIP ${zipCode} → ${city}, ${state}`)

    // Step 2: Find the state in database
    const stateRecord = await prisma.state.findFirst({
      where: {
        OR: [
          { abbr: state },
          { name: { contains: state, mode: 'insensitive' } }
        ]
      }
    })

    if (!stateRecord) {
      console.log(`[Coverage Check] State ${state} not found in database`)
      // Fallback: show all providers if state not in DB
      const allProviders = await prisma.provider.findMany({
        where: { status: { in: ['VERIFIED', 'PENDING'] } },
        select: { id: true, name: true, listingTier: true }
      })

      return NextResponse.json({
        ok: true,
        coverage: allProviders.length >= 3 ? 'high' : 'low',
        providerCount: allProviders.length,
        action: allProviders.length >= 3 ? 'lead_form' : 'affiliate',
        affiliateUrl: AFFILIATE_URL,
        message: `We found ${allProviders.length} providers (nationwide search - ${state} not in our database yet)`
      })
    }

    // Step 3: Find city in database (optional - city might not be in DB)
    const cityRecord = await prisma.city.findFirst({
      where: {
        AND: [
          { stateId: stateRecord.id },
          { name: { contains: city, mode: 'insensitive' } }
        ]
      }
    })

    // Step 4: Query providers that service this state (and optionally city)
    const providers = await prisma.provider.findMany({
      where: {
        AND: [
          { status: { in: ['VERIFIED', 'PENDING'] } },
          {
            coverage: {
              some: {
                OR: [
                  // Providers covering this specific city
                  cityRecord ? { cityId: cityRecord.id } : {},
                  // Providers covering the entire state
                  { stateId: stateRecord.id, cityId: null }
                ].filter(obj => Object.keys(obj).length > 0) // Remove empty objects
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        listingTier: true
      }
    })

    console.log(`[Coverage Check] ZIP ${zipCode} (${city}, ${state}): Found ${providers.length} providers`)

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
