import { NextRequest, NextResponse } from 'next/server'
import { getAllProviders } from '@/lib/providers'
import { sanitizeString } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// Load providers from the enriched CSV data
async function loadProviders() {
  try {
    const providers = await getAllProviders()
    return providers
  } catch (error) {
    console.error('Error loading providers:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Convert URLSearchParams to object for validation
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })
    
    // Temporarily skip validation for debugging
    // const validation = validateInput(providerQuerySchema, queryParams)
    // if (!validation.success) {
    //   console.error('Validation failed for params:', queryParams)
    //   console.error('Validation error:', validation.error)
    //   return NextResponse.json(
    //     { error: validation.error },
    //     { status: 400 }
    //   )
    // }
    
    const providers = await loadProviders()
    if (!providers || providers.length === 0) {
      return NextResponse.json(
        { error: 'No providers available' },
        { status: 503 }
      )
    }
    
    // Check for special endpoints
    const featured = searchParams.get('featured')
    const topRated = searchParams.get('topRated')
    const rating = searchParams.get('rating')
    const sort = searchParams.get('sort')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Handle featured providers
    if (featured === 'true') {
      const featuredProviders = providers
        .filter((p: any) => p.featured === true)
        .slice(0, limit)
      return NextResponse.json(featuredProviders)
    }

    // Handle top rated providers
    if (topRated === 'true') {
      const topProviders = providers
        .filter((p: any) => p.rating >= 4.0)
        .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        .slice(0, limit)
      return NextResponse.json(topProviders)
    }

    // Handle rating filter
    if (rating) {
      const minRating = parseFloat(rating)
      const ratedProviders = providers
        .filter((p: any) => p.rating >= minRating)
        .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
      return NextResponse.json(ratedProviders)
    }

    // Handle search and filters with sanitization
    const query = searchParams.get('query') ? sanitizeString(searchParams.get('query')!) : ''
    const city = searchParams.get('city') ? sanitizeString(searchParams.get('city')!) : undefined
    const state = searchParams.get('state')
    
    let filteredProviders = providers

    // Filter by state - check both address.state and coverage.states
    if (state) {
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

      const fullStateName = stateMap[state.toUpperCase()]

      filteredProviders = filteredProviders.filter((p: any) => {
        // Skip non-mobile phlebotomy services
        if (p.is_mobile_phlebotomy === 'No') {
          return false
        }

        // Check if provider is nationwide
        if (p.is_nationwide === 'Yes') {
          return true
        }

        // Check state match (both abbreviation and full name)
        const stateMatch = p.state === state ||
                          p.state === fullStateName ||
                          p.coverage?.states?.includes(state) ||
                          p.coverage?.states?.includes(fullStateName)

        // Check verified service areas
        const serviceAreaMatch = p.verified_service_areas?.toLowerCase().includes(fullStateName?.toLowerCase()) ||
                                p.validation_notes?.toLowerCase().includes(fullStateName?.toLowerCase())

        return stateMatch || serviceAreaMatch
      })
    }

    // Filter by city - check both address.city and coverage.cities
    if (city) {
      const cityLower = city.toLowerCase()
      filteredProviders = filteredProviders.filter((p: any) => 
        p.address?.city?.toLowerCase() === cityLower || 
        p.coverage?.cities?.some((c: string) => c.toLowerCase() === cityLower)
      )
    }
// Filter by services with sanitization
const services = searchParams.get('services')
if (services) {
  const servicesList = sanitizeString(services).split(',').map(s => s.trim())
  filteredProviders = filteredProviders.filter((p: any) => {
    if (!p.services || p.services.length === 0) return false
    
    return servicesList.some(selectedService => 
      p.services.some((providerService: string) => 
        providerService.toLowerCase() === selectedService.toLowerCase() ||
        providerService.toLowerCase().includes(selectedService.toLowerCase())
      )
    )
  })
}

// Filter by rating
const ratingParam = searchParams.get('rating')
if (ratingParam) {
  const minRating = parseFloat(ratingParam)
  filteredProviders = filteredProviders.filter((p: any) => 
    (p.rating || 0) >= minRating
  )
}
    // Filter by search query - search name, description, and services
    if (query) {
      const searchTerm = query.toLowerCase()
      filteredProviders = filteredProviders.filter((p: any) => 
        p.name?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.services?.some((s: string) => s.toLowerCase().includes(searchTerm)) ||
        p.address?.city?.toLowerCase().includes(searchTerm) ||
        p.address?.state?.toLowerCase().includes(searchTerm)
      )
    }

    // Sort based on sort parameter
    if (sort === 'name') {
      filteredProviders.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
    } else if (sort === 'distance') {
      // For now, default to rating sort since we don't have distance calculation
      filteredProviders.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
    } else {
      // Default sort by rating (highest first)
      filteredProviders.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
    }

    // Limit results
    const limitedProviders = filteredProviders.slice(0, limit)
    
    return NextResponse.json(limitedProviders)
  } catch (error) {
    console.error('Error in providers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}