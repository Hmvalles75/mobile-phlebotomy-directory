import { NextRequest, NextResponse } from 'next/server'
import { cityQuerySchema, validateInput, sanitizeString } from '@/lib/validation'
import { getProvidersByCity, getAllProvidersForCity } from '@/lib/providers-city'

export const dynamic = 'force-dynamic'

// The grouping logic moved to lib/providers-city.ts so the server-rendered city
// page can call it directly instead of the browser fetching it after hydration.
// This route keeps returning exactly what it always did.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Convert URLSearchParams to object for validation
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })
    
    // Validate query parameters
    const validation = validateInput(cityQuerySchema, queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    const city = sanitizeString(validation.data.city)
    const state = validation.data.state
    const grouped = searchParams.get('grouped') === 'true'


    if (grouped) {
      // Buckets are geographic now (local / regional) — see lib/providers-city.ts.
      // ~100 legacy P3 pages under app/{city}-{st}/ read citySpecific/regional/
      // statewide off this response and flatten all three, so the old key names
      // are kept as aliases. They inherit the geography fix without being edited,
      // and the legacy route tree stays out of scope. `statewide` has always been
      // empty in practice; it is returned only so those spreads keep type-checking.
      const results = await getProvidersByCity(city, state)
      return NextResponse.json({
        local: results.local,
        regional: results.regional,
        citySpecific: results.local,
        statewide: [],
      })
    } else {
      // Return flat list for backward compatibility
      const providers = await getAllProvidersForCity(city, state)
      return NextResponse.json(providers)
    }
  } catch (error) {
    console.error('Error in city providers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}