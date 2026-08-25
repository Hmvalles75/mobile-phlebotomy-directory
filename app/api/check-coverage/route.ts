import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import zipcodes from 'zipcodes'
import { STATE_DATA } from '@/data/states-full'

const schema = z.object({
  city: z.string().min(1).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP code format').optional()
}).refine(data => data.city && data.state || data.zipCode, {
  message: 'Either provide city+state or zipCode'
})

// Speedy Sticks affiliate URL (fallback for low-coverage areas)
/** Abbreviation -> full state name, for exact matching against a malformed states table. */
const STATE_ABBR_TO_FULL: Record<string, string> = Object.fromEntries(
  Object.values(STATE_DATA).map(s => [s.abbr, s.name])
)

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

    const { city: cityParam, state: stateParam, zipCode } = parsed.data

    // Determine city and state (either from direct input or ZIP lookup)
    let city: string
    let state: string

    if (cityParam && stateParam) {
      // Direct city/state input
      city = cityParam
      state = stateParam
      console.log(`[Coverage Check] Direct input: ${city}, ${state}`)
    } else if (zipCode) {
      // ZIP code lookup
      const zipInfo = zipcodes.lookup(zipCode)
      if (!zipInfo) {
        console.log(`[Coverage Check] ZIP ${zipCode}: Invalid or unknown ZIP code`)
        return NextResponse.json({
          ok: false,
          error: 'Invalid ZIP code or coverage area not found'
        }, { status: 404 })
      }
      city = zipInfo.city
      state = zipInfo.state
      console.log(`[Coverage Check] ZIP ${zipCode} → ${city}, ${state}`)
    } else {
      return NextResponse.json({
        ok: false,
        error: 'Must provide either city+state or zipCode'
      }, { status: 400 })
    }

    // Step 2: Resolve the state — EXACT matches only.
    //
    // This previously fell back to `name: { contains: <2-letter abbr> }`, which
    // matched abbreviations against the middle of other states' names. "HI"
    // matched "O-HI-o", so a visitor in Volcano, Hawaii was shown 27 Ohio
    // providers averaging 4,400 miles away under a green "Excellent Coverage"
    // banner. A SCORE small-business mentor reported it. Sixteen states resolved
    // to the wrong record this way: AL->California, DE->Rhode Island,
    // ID->Florida, LA->Alabama, ME->New Mexico, OR->Colorado, VA->Pennsylvania,
    // and more.
    //
    // The full name is also accepted because the states table is malformed: 56
    // of its 66 rows have name === abbr, and Hawaii's row is
    // { abbr: "Hawaii", name: "Hawaii" } with no "HI" anywhere. Matching the
    // name exactly reaches those rows without reintroducing substring matching.
    // Repairing the table itself is tracked separately.
    const stateFullName = STATE_ABBR_TO_FULL[state.toUpperCase()] || null
    const stateRecord = await prisma.state.findFirst({
      where: {
        OR: [
          { abbr: { equals: state, mode: 'insensitive' as const } },
          ...(stateFullName
            ? [
                { name: { equals: stateFullName, mode: 'insensitive' as const } },
                { abbr: { equals: stateFullName, mode: 'insensitive' as const } },
              ]
            : []),
        ],
      },
    })

    if (!stateRecord) {
      // No state row: say so. This used to return EVERY provider in the
      // database as "nationwide search" results, which turned an unknown state
      // into a coverage claim of several hundred providers — the same lie the
      // Ohio bug told, by a different route.
      console.log(`[Coverage Check] State ${state} not found — reporting no coverage`)
      return NextResponse.json({
        ok: true,
        coverage: 'low',
        providerCount: 0,
        action: 'affiliate',
        affiliateUrl: AFFILIATE_URL,
        message: `We don't have coverage in ${city}, ${state} yet. For availability in your area, we recommend our partner Speedy Sticks.`,
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
          { status: { in: ['VERIFIED', 'PENDING', 'UNVERIFIED'] } },
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
        // "certified" is gone: this count includes UNVERIFIED and PENDING
        // listings and hospital draw stations. "in your area" is gone too —
        // matching is by state coverage row, not by ZIP or distance, so the
        // page must not imply a ZIP-level guarantee. Tightening the match
        // itself to ZIP + radius is tracked separately.
        message: `We found ${providers.length} providers listed in ${state}. Submit the form and we'll confirm who can cover ${city}.`
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
          ? `We found ${providers.length} provider(s) listed in ${state}. For guaranteed availability in ${city}, we recommend our trusted partner Speedy Sticks.`
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
