import { NextRequest, NextResponse } from 'next/server'
import { searchProviders, getFeaturedProviders, getTopRatedProviders } from '@/lib/providers-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check for special endpoints
    const featured = searchParams.get('featured')
    const topRated = searchParams.get('topRated')
    const rating = searchParams.get('rating')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Handle featured providers
    if (featured === 'true') {
      const providers = await getFeaturedProviders()
      return NextResponse.json(providers)
    }

    // Handle top rated providers
    if (topRated === 'true') {
      const providers = await getTopRatedProviders()
      return NextResponse.json(providers)
    }

    // Handle rating filter
    if (rating) {
      const minRating = parseFloat(rating)
      const providers = await searchProviders()
      })
      return NextResponse.json(providers)
    }
    
    const query = searchParams.get('query') || ''
    const services = searchParams.get('services')?.split(',').filter(Boolean) || []
    const city = searchParams.get('city') || undefined
    const state = searchParams.get('state') || undefined
    const availability = searchParams.get('availability')?.split(',').filter(Boolean) || []
    const payment = searchParams.get('payment')?.split(',').filter(Boolean) || []
    const sortBy = searchParams.get('sortBy') as 'rating' | 'distance' | 'reviews' | 'name' || 'rating'
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined

    const providers = await searchProviders()

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Error in providers API:', error)
    // Return empty array instead of error to prevent crashes
    return NextResponse.json([])
  }
}