import { NextRequest, NextResponse } from 'next/server'
import { getAllProviders, type EnrichedProvider } from '@/lib/providers-db'
import { sanitizeString } from '@/lib/validation'
import { normalizeState, normalizeCity, looksLikeState } from '@/lib/location-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Load all providers (EnrichedProvider type)
    const allProviders = await getAllProviders()
    if (!allProviders || allProviders.length === 0) {
      return NextResponse.json(
        { error: 'No providers available' },
        { status: 503 }
      )
    }

    // Parse query parameters
    const featured = searchParams.get('featured')
    const topRated = searchParams.get('topRated')
    const sort = searchParams.get('sort')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : null

    // Query params for filtering
    const query = searchParams.get('query') ? sanitizeString(searchParams.get('query')!) : ''
    const cityParam = searchParams.get('city') ? sanitizeString(searchParams.get('city')!) : undefined
    const stateParam = searchParams.get('state') ? sanitizeString(searchParams.get('state')!) : undefined
    const servicesParam = searchParams.get('services')
    const ratingParam = searchParams.get('rating')

    // Handle special quick filters
    if (featured === 'true') {
      const featuredProviders = allProviders.filter(p => p.featured === true || p.isFeatured === true)
      const result = limit ? featuredProviders.slice(0, limit) : featuredProviders
      return NextResponse.json(result)
    }

    if (topRated === 'true') {
      const topProviders = allProviders
        .filter(p => (p.totalScore || 0) >= 4.0)
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      const result = limit ? topProviders.slice(0, limit) : topProviders
      return NextResponse.json(result)
    }

    // Start with all providers
    let filteredProviders: EnrichedProvider[] = allProviders

    // Filter by state (normalized)
    if (stateParam) {
      const normalizedState = normalizeState(stateParam)
      if (normalizedState) {
        filteredProviders = filteredProviders.filter(p => {
          // Check coverage.states array first
          if (p.coverage?.states && p.coverage.states.includes(normalizedState)) {
            return true
          }
          // Fallback to primary state
          if (p.state === normalizedState) {
            return true
          }
          return false
        })
      }
    }

    // Filter by city (normalized)
    if (cityParam) {
      const normalizedCity = normalizeCity(cityParam)
      filteredProviders = filteredProviders.filter(p => {
        // Check coverage.cities array first (case-insensitive)
        if (p.coverage?.cities) {
          if (p.coverage.cities.some(c => c.toLowerCase() === normalizedCity.toLowerCase())) {
            return true
          }
        }
        // Fallback to primary city
        if (p.city && p.city.toLowerCase() === normalizedCity.toLowerCase()) {
          return true
        }
        return false
      })
    }

    // Filter by services
    if (servicesParam) {
      const servicesList = sanitizeString(servicesParam).split(',').map(s => s.trim().toLowerCase())
      filteredProviders = filteredProviders.filter(p => {
        if (!p.services || p.services.length === 0) return false
        return servicesList.some(selectedService =>
          p.services.some(providerService =>
            providerService.toLowerCase() === selectedService ||
            providerService.toLowerCase().includes(selectedService)
          )
        )
      })
    }

    // Filter by rating
    if (ratingParam) {
      const minRating = parseFloat(ratingParam)
      filteredProviders = filteredProviders.filter(p => (p.totalScore || 0) >= minRating)
    }

    // Filter by search query (deterministic)
    if (query) {
      // Check if query is a state
      if (looksLikeState(query)) {
        const normalizedState = normalizeState(query)
        if (normalizedState) {
          filteredProviders = filteredProviders.filter(p => {
            // Check coverage.states array
            if (p.coverage?.states && p.coverage.states.includes(normalizedState)) {
              return true
            }
            // Fallback to primary state
            if (p.state === normalizedState) {
              return true
            }
            return false
          })
        }
      } else {
        // Not a state - do keyword search
        const searchTerm = query.toLowerCase()
        filteredProviders = filteredProviders.filter(p => {
          // Search in provider name
          if (p.name?.toLowerCase().includes(searchTerm)) {
            return true
          }
          // Search in services
          if (p.services?.some(s => s.toLowerCase().includes(searchTerm))) {
            return true
          }
          // Search in cities (coverage)
          if (p.coverage?.cities?.some(c => c.toLowerCase().includes(searchTerm))) {
            return true
          }
          // Search in primary city
          if (p.city?.toLowerCase().includes(searchTerm)) {
            return true
          }
          return false
        })
      }
    }

    // Sort
    if (sort === 'name') {
      filteredProviders.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else {
      // Default: sort by rating (highest first)
      filteredProviders.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
    }

    // Deduplicate by ID (EnrichedProvider already has unique IDs)
    const uniqueProviders = Array.from(
      new Map(filteredProviders.map(p => [p.id, p])).values()
    )

    // Limit results
    const limitedProviders = limit ? uniqueProviders.slice(0, limit) : uniqueProviders

    return NextResponse.json(limitedProviders)
  } catch (error) {
    console.error('Error in providers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}