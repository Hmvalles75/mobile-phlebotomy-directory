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
      // Return grouped results for enhanced UI
      const results = await getProvidersByCity(city, state)
      return NextResponse.json(results)
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