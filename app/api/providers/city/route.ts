import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Provider } from '@/lib/schemas'

// Load providers from JSON file
function loadProviders(): Provider[] {
  const providersPath = path.join(process.cwd(), 'data', 'providers.json')
  return JSON.parse(fs.readFileSync(providersPath, 'utf8'))
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
    const hasRegionalMatch = provider.coverage.regions?.length > 0

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
    
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const grouped = searchParams.get('grouped') === 'true'
    
    if (!city || !state) {
      return NextResponse.json({ error: 'City and state are required' }, { status: 400 })
    }

    console.log(`Fetching providers for ${city}, ${state}${grouped ? ' (grouped)' : ''}`)
    
    if (grouped) {
      // Return grouped results for enhanced UI
      const results = getProvidersByCity(city, state)
      console.log(`Found ${results.citySpecific.length} city-specific, ${results.regional.length} regional, ${results.statewide.length} statewide providers`)
      return NextResponse.json(results)
    } else {
      // Return flat list for backward compatibility
      const providers = getAllProvidersForCity(city, state)
      console.log(`Found ${providers.length} total providers for ${city}, ${state}`)
      return NextResponse.json(providers)
    }
  } catch (error) {
    console.error('Error in city providers API:', error)
    // Return empty array instead of error to prevent crashes
    return NextResponse.json([])
  }
}