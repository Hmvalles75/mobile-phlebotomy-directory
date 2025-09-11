import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Provider } from '@/lib/schemas'
import { cityQuerySchema, validateInput, sanitizeString } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// Load providers from JSON file with error handling
function loadProviders(): Provider[] {
  try {
    const providersPath = path.join(process.cwd(), 'data', 'providers.json')
    if (!fs.existsSync(providersPath)) {
      console.error('Providers file not found:', providersPath)
      return []
    }
    const fileContent = fs.readFileSync(providersPath, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Error loading providers:', error)
    return []
  }
}

// Enhanced city search that includes regional providers
function getProvidersByCity(cityName: string, stateAbbr: string) {
  const providers = loadProviders()
  
  const results = {
    citySpecific: [] as Provider[],
    regional: [] as Provider[],
    statewide: [] as Provider[]
  }

  // Normalize inputs
  const normalizedCity = cityName.toLowerCase()
  const normalizedState = stateAbbr.toUpperCase()

  providers.forEach(provider => {
    // Check if provider serves this state
    const servesState = provider.coverage.states.some(state => 
      state.toUpperCase() === normalizedState
    )
    
    if (!servesState) return

    // 1. Direct city match
    const hasDirectCityMatch = provider.coverage.cities?.some(city =>
      city.toLowerCase() === normalizedCity
    )

    // 2. Address city match  
    const hasAddressCityMatch = provider.address?.city?.toLowerCase() === normalizedCity

    // 3. Regional match (simplified without regions file)
    const hasRegionalMatch = provider.coverage.regions && provider.coverage.regions.length > 0

    // 4. Statewide coverage (no specific cities or regions)
    const isStatewide = (!provider.coverage.cities || provider.coverage.cities.length === 0) &&
                       (!provider.coverage.regions || provider.coverage.regions.length === 0) &&
                       !provider.address?.city

    // Categorize the provider
    if (hasDirectCityMatch || hasAddressCityMatch) {
      results.citySpecific.push(provider)
    } else if (hasRegionalMatch) {
      results.regional.push(provider)
    } else if (isStatewide) {
      results.statewide.push(provider)
    }
  })

  return results
}

// Get all providers for a city (combined results)
function getAllProvidersForCity(cityName: string, stateAbbr: string): Provider[] {
  const results = getProvidersByCity(cityName, stateAbbr)
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
      const results = getProvidersByCity(city, state)
      return NextResponse.json(results)
    } else {
      // Return flat list for backward compatibility
      const providers = getAllProvidersForCity(city, state)
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