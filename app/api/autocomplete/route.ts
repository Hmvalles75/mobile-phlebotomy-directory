import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { sanitizeString } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// Load providers for autocomplete suggestions
function loadProviders() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'providers.json')
    if (!fs.existsSync(filePath)) {
      return []
    }
    const fileContent = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Error loading providers:', error)
    return []
  }
}

// Common cities and states for quick suggestions
const commonLocations = [
  // Top cities
  { type: 'city', name: 'Los Angeles', state: 'CA', display: 'Los Angeles, CA' },
  { type: 'city', name: 'New York', state: 'NY', display: 'New York, NY' },
  { type: 'city', name: 'Chicago', state: 'IL', display: 'Chicago, IL' },
  { type: 'city', name: 'Houston', state: 'TX', display: 'Houston, TX' },
  { type: 'city', name: 'Phoenix', state: 'AZ', display: 'Phoenix, AZ' },
  { type: 'city', name: 'Philadelphia', state: 'PA', display: 'Philadelphia, PA' },
  { type: 'city', name: 'San Antonio', state: 'TX', display: 'San Antonio, TX' },
  { type: 'city', name: 'San Diego', state: 'CA', display: 'San Diego, CA' },
  { type: 'city', name: 'Dallas', state: 'TX', display: 'Dallas, TX' },
  { type: 'city', name: 'San Jose', state: 'CA', display: 'San Jose, CA' },
  { type: 'city', name: 'Austin', state: 'TX', display: 'Austin, TX' },
  { type: 'city', name: 'Jacksonville', state: 'FL', display: 'Jacksonville, FL' },
  { type: 'city', name: 'Fort Worth', state: 'TX', display: 'Fort Worth, TX' },
  { type: 'city', name: 'Columbus', state: 'OH', display: 'Columbus, OH' },
  { type: 'city', name: 'Charlotte', state: 'NC', display: 'Charlotte, NC' },
  { type: 'city', name: 'San Francisco', state: 'CA', display: 'San Francisco, CA' },
  { type: 'city', name: 'Indianapolis', state: 'IN', display: 'Indianapolis, IN' },
  { type: 'city', name: 'Seattle', state: 'WA', display: 'Seattle, WA' },
  { type: 'city', name: 'Denver', state: 'CO', display: 'Denver, CO' },
  { type: 'city', name: 'Boston', state: 'MA', display: 'Boston, MA' },

  // States
  { type: 'state', name: 'California', abbr: 'CA', display: 'California (CA)' },
  { type: 'state', name: 'Texas', abbr: 'TX', display: 'Texas (TX)' },
  { type: 'state', name: 'Florida', abbr: 'FL', display: 'Florida (FL)' },
  { type: 'state', name: 'New York', abbr: 'NY', display: 'New York (NY)' },
  { type: 'state', name: 'Pennsylvania', abbr: 'PA', display: 'Pennsylvania (PA)' },
  { type: 'state', name: 'Illinois', abbr: 'IL', display: 'Illinois (IL)' },
  { type: 'state', name: 'Ohio', abbr: 'OH', display: 'Ohio (OH)' },
  { type: 'state', name: 'Georgia', abbr: 'GA', display: 'Georgia (GA)' },
  { type: 'state', name: 'North Carolina', abbr: 'NC', display: 'North Carolina (NC)' },
  { type: 'state', name: 'Michigan', abbr: 'MI', display: 'Michigan (MI)' }
]

const commonServices = [
  'At-Home Blood Draw',
  'Corporate Wellness',
  'Fertility/IVF Testing',
  'Pediatric Blood Draw',
  'Senior Care',
  'DOT Physical',
  'Drug Testing',
  'Health Screening',
  'Lab Collection',
  'Mobile Testing'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const sanitizedQuery = sanitizeString(query.toLowerCase())
    const suggestions: Array<{
      type: 'city' | 'state' | 'provider' | 'service'
      display: string
      value: string
      category: string
    }> = []

    // Search common locations
    const locationMatches = commonLocations.filter(location =>
      location.name.toLowerCase().includes(sanitizedQuery) ||
      location.display.toLowerCase().includes(sanitizedQuery) ||
      (location.type === 'state' && location.abbr?.toLowerCase().includes(sanitizedQuery))
    )

    locationMatches.forEach(match => {
      suggestions.push({
        type: match.type as 'city' | 'state',
        display: match.display,
        value: match.type === 'city' ? `${match.name}, ${match.state}` : match.name,
        category: match.type === 'city' ? '📍 Cities' : '🏛️ States'
      })
    })

    // Search services
    const serviceMatches = commonServices.filter(service =>
      service.toLowerCase().includes(sanitizedQuery)
    )

    serviceMatches.forEach(service => {
      suggestions.push({
        type: 'service',
        display: service,
        value: service,
        category: '🩺 Services'
      })
    })

    // Search provider names
    const providers = loadProviders()
    const providerMatches = providers
      .filter((provider: any) =>
        provider.name?.toLowerCase().includes(sanitizedQuery) ||
        provider.description?.toLowerCase().includes(sanitizedQuery)
      )
      .slice(0, 5) // Limit provider suggestions

    providerMatches.forEach((provider: any) => {
      const location = provider.address ? `${provider.address.city}, ${provider.address.state}` : ''
      suggestions.push({
        type: 'provider',
        display: `${provider.name} ${location ? `- ${location}` : ''}`,
        value: provider.name,
        category: '🏥 Providers'
      })
    })

    // Sort suggestions by relevance and limit to 8 total
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // Exact matches first
        const aExact = a.value.toLowerCase() === sanitizedQuery
        const bExact = b.value.toLowerCase() === sanitizedQuery
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1

        // Then by type priority: locations, services, providers
        const typePriority = { city: 1, state: 2, service: 3, provider: 4 }
        return typePriority[a.type] - typePriority[b.type]
      })
      .slice(0, 8)

    return NextResponse.json(sortedSuggestions)
  } catch (error) {
    console.error('Error in autocomplete API:', error)
    return NextResponse.json([])
  }
}