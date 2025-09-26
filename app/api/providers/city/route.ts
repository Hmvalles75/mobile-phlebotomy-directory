import { NextRequest, NextResponse } from 'next/server'
import { getAllProviders } from '@/lib/providers'
import { cityQuerySchema, validateInput, sanitizeString } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// State abbreviation to full name mapping
const stateMap: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
}

// Enhanced city search that includes regional providers
async function getProvidersByCity(cityName: string, stateAbbr: string) {
  const providers = await getAllProviders()

  const results = {
    citySpecific: [] as any[],
    regional: [] as any[],
    statewide: [] as any[]
  }

  // Normalize inputs
  const normalizedCity = cityName.toLowerCase()
  const normalizedState = stateAbbr.toUpperCase()
  const fullStateName = stateMap[normalizedState]

  providers.forEach(provider => {
    // Skip non-mobile phlebotomy services
    if (provider.is_mobile_phlebotomy === 'No') {
      return
    }

    // Check if provider is nationwide
    if (provider.is_nationwide === 'Yes') {
      results.statewide.push(provider)
      return
    }

    // Check if provider serves this state (both abbreviation and full name)
    const servesState = provider.state === normalizedState ||
                       provider.state === fullStateName ||
                       provider.coverage?.states?.some(state =>
                         state.toUpperCase() === normalizedState ||
                         state.toLowerCase() === fullStateName?.toLowerCase()
                       )

    if (!servesState) return

    // 1. Direct city match
    const hasDirectCityMatch = provider.city?.toLowerCase() === normalizedCity ||
                              provider.coverage?.cities?.some(city =>
                                city.toLowerCase() === normalizedCity
                              )

    // 2. Check if city is mentioned in verified service areas or validation notes
    const serviceAreaMatch = provider.verified_service_areas?.toLowerCase().includes(normalizedCity) ||
                            provider.validation_notes?.toLowerCase().includes(normalizedCity)

    // 3. Regional match (covers state but not specifically this city)
    const hasRegionalMatch = !hasDirectCityMatch && !serviceAreaMatch && servesState

    // Categorize the provider
    if (hasDirectCityMatch || serviceAreaMatch) {
      results.citySpecific.push(provider)
    } else if (hasRegionalMatch) {
      results.regional.push(provider)
    }
  })

  return results
}

// Get all providers for a city (combined results)
async function getAllProvidersForCity(cityName: string, stateAbbr: string) {
  const results = await getProvidersByCity(cityName, stateAbbr)
  return [
    ...results.citySpecific,
    ...results.regional,
    ...results.statewide
  ]
}

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