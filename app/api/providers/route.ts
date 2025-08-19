import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Load providers from your JSON file
function loadProviders() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'providers.json')
    const fileContent = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Error loading providers:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providers = loadProviders()
    
    // Check for special endpoints
    const featured = searchParams.get('featured')
    const topRated = searchParams.get('topRated')
    const rating = searchParams.get('rating')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Handle featured providers (high rating)
    if (featured === 'true') {
      const featuredProviders = providers
        .filter((p: any) => p.rating >= 4.5)
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

    // Handle search and filters
    const query = searchParams.get('query') || ''
    const city = searchParams.get('city') || undefined
    const state = searchParams.get('state') || undefined
    
    let filteredProviders = providers

    // Filter by state
    if (state) {
      filteredProviders = filteredProviders.filter((p: any) => 
        p.state === state || p.coverage?.states?.includes(state)
      )
    }

    // Filter by city
    if (city) {
      filteredProviders = filteredProviders.filter((p: any) => 
        p.city === city || p.coverage?.cities?.includes(city)
      )
    }

    // Filter by search query
    if (query) {
      const searchTerm = query.toLowerCase()
      filteredProviders = filteredProviders.filter((p: any) => 
        p.name?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.services?.some((s: string) => s.toLowerCase().includes(searchTerm))
      )
    }

    // Limit results
    const limitedProviders = filteredProviders.slice(0, limit)
    
    return NextResponse.json(limitedProviders)
  } catch (error) {
    console.error('Error in providers API:', error)
    return NextResponse.json([])
  }
}