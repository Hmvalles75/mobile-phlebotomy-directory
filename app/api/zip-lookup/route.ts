import { NextRequest, NextResponse } from 'next/server'
import zipcodes from 'zipcodes'

/**
 * ZIP Code Lookup API
 *
 * GET /api/zip-lookup?zip=90210
 *
 * Returns city and state for a given ZIP code.
 * Used by the LA request page for autofill.
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
    return NextResponse.json(
      { ok: false, error: 'ZIP code not found' },
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
