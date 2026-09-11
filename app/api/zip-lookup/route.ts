import { NextRequest, NextResponse } from 'next/server'
import zipcodes from 'zipcodes'
import { resolveZipForRouting } from '@/lib/zip-geocode'

/**
 * ZIP Code Lookup API
 *
 * GET /api/zip-lookup?zip=90210[&city=Sandy&state=UT]
 *
 * Returns city and state for a given ZIP code. Used by the request forms for
 * autofill. When the ZIP is unknown and a city and state are supplied, the
 * 404 body carries a `suggestion` resolved from them, so the form can ask
 * "did you mean 84070?" before the patient submits a ZIP nobody can route.
 */
export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip')

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid ZIP code format' },
      { status: 400 }
    )
  }

  const zipInfo = zipcodes.lookup(zip)

  if (!zipInfo) {
    const city = req.nextUrl.searchParams.get('city')
    const state = req.nextUrl.searchParams.get('state')
    const resolved = resolveZipForRouting(zip, city, state)
    return NextResponse.json(
      { ok: false, error: 'ZIP code not found', suggestion: resolved.corrected ? { zip: resolved.zip, city: resolved.city, state: resolved.state } : null },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    zip,
    city: zipInfo.city,
    state: zipInfo.state,
    latitude: zipInfo.latitude,
    longitude: zipInfo.longitude
  })
}
