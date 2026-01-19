'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AutocompleteSearchBar } from '@/components/ui/AutocompleteSearchBar'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { ListingTierBadge } from '@/components/ui/ListingTierBadge'
import { trackRatingFilter, trackRatingView } from '@/lib/provider-actions'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'
import { US_STATES } from '@/lib/states'

export default function SearchContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'reviews' | 'name'>('rating')
  const [loading, setLoading] = useState(false)
  const [stateProviderCounts, setStateProviderCounts] = useState<Record<string, number>>({})

 const serviceOptions = [
  'At-Home Blood Draw',
  'Specimen Pickup',
  'Lab Partner',
  'Corporate Wellness',
  'Mobile Laboratory',
  'Laboratory Services',
  'Diagnostic Services'
]

  useEffect(() => {
    // Get initial query from URL params
    const queryParam = searchParams.get('q')
    if (queryParam) {
      setSearchQuery(queryParam)
    }

    // Get initial services from URL params
    const servicesParam = searchParams.get('services')
    if (servicesParam) {
      setSelectedServices([servicesParam])
    }

    // Get initial rating filter from URL params
    const ratingParam = searchParams.get('rating')
    if (ratingParam) {
      const rating = parseFloat(ratingParam)
      if (rating >= 3.0 && rating <= 5.0) {
        setMinRating(rating)
      }
    }
  }, [searchParams])

  // Fetch provider counts for each state (for directory view)
  useEffect(() => {
    async function fetchStateCounts() {
      try {
        const response = await fetch('/api/providers/stats/by-state')
        if (response.ok) {
          const data = await response.json()
          setStateProviderCounts(data)
        }
      } catch (error) {
        console.error('Error fetching state counts:', error)
      }
    }
    fetchStateCounts()
  }, [])

  // Determine if we should show providers or state directory
  const showProviderResults = searchQuery.trim().length > 0 || selectedServices.length > 0 || minRating !== null

  useEffect(() => {
    // Only search providers if we have search criteria
    if (!showProviderResults) {
      setProviders([])
      setLoading(false)
      return
    }

    const searchProviders = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append('query', searchQuery)
        if (selectedServices.length > 0) {
          params.append('services', selectedServices.join(','))
        }
        if (minRating !== null) {
          params.append('rating', minRating.toString())
        }
        params.append('sort', sortBy)

        const response = await fetch(`/api/providers?${params}`)
        const data = await response.json()

        if (response.ok && Array.isArray(data)) {
          setProviders(data)
        } else {
          console.error('API Error:', data)
          setProviders([])
        }
      } catch (error) {
        console.error('Error searching providers:', error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    searchProviders()
  }, [searchQuery, selectedServices, minRating, sortBy, showProviderResults])

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  const handleRatingFilter = (rating: number | null) => {
    setMinRating(rating)
    if (rating !== null) {
      trackRatingFilter(rating.toString(), 'search-page')
    }
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedServices([])
    setMinRating(null)
  }

  const sortedProviders = (Array.isArray(providers) ? [...providers] : []).sort((a, b) => {
    // First, sort by tier (Featured > Premium > Basic)
    const tierA = (a as any).listingTier || 'BASIC'
    const tierB = (b as any).listingTier || 'BASIC'
    const isFeaturedA = (a as any).isFeaturedCity || (a as any).isFeatured || false
    const isFeaturedB = (b as any).isFeaturedCity || (b as any).isFeatured || false

    const tierOrder = { FEATURED: 3, PREMIUM: 2, BASIC: 1 }
    const effectiveTierA = (tierA === 'FEATURED' || isFeaturedA) ? tierOrder.FEATURED : tierOrder[tierA as keyof typeof tierOrder] || tierOrder.BASIC
    const effectiveTierB = (tierB === 'FEATURED' || isFeaturedB) ? tierOrder.FEATURED : tierOrder[tierB as keyof typeof tierOrder] || tierOrder.BASIC

    if (effectiveTierA !== effectiveTierB) {
      return effectiveTierB - effectiveTierA
    }

    // Within same tier, sort by user-selected criteria
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'reviews':
        return (b.reviewsCount || 0) - (a.reviewsCount || 0)
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  // Group states by region for better organization
  const statesByRegion = {
    'West': US_STATES.filter(s => ['WA', 'OR', 'CA', 'NV', 'AZ', 'UT', 'ID', 'MT', 'WY', 'CO', 'NM', 'AK', 'HI'].includes(s.abbr)),
    'Midwest': US_STATES.filter(s => ['ND', 'SD', 'NE', 'KS', 'MN', 'IA', 'MO', 'WI', 'IL', 'IN', 'MI', 'OH'].includes(s.abbr)),
    'South': US_STATES.filter(s => ['TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY', 'WV', 'VA', 'NC', 'SC', 'GA', 'FL', 'MD', 'DE'].includes(s.abbr)),
    'Northeast': US_STATES.filter(s => ['PA', 'NY', 'NJ', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME'].includes(s.abbr))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Find Mobile Phlebotomy Providers</h1>
          <AutocompleteSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={setSearchQuery}
            className="max-w-2xl"
            placeholder="Search by provider name, city, or keyword..."
            enableAutocomplete={true}
          />
          {showProviderResults && (
            <p className="mt-4 text-primary-100">
              Showing search results • <button onClick={clearAllFilters} className="underline hover:text-white">Browse by state instead</button>
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {showProviderResults ? (
          // PROVIDER RESULTS VIEW
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg">Filters</h2>
                  {(selectedServices.length > 0 || minRating !== null) && (
                    <button
                      onClick={() => {
                        setSelectedServices([])
                        setMinRating(null)
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Services Filter */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Services</h3>
                  <div className="space-y-2">
                    {serviceOptions.map(service => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Minimum Rating</h3>
                  <div className="space-y-2">
                    {[null, 4.5, 4.0, 3.5, 3.0].map(rating => (
                      <label key={rating || 'all'} className="flex items-center">
                        <input
                          type="radio"
                          checked={minRating === rating}
                          onChange={() => handleRatingFilter(rating)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {rating === null ? 'All ratings' : `${rating}+ stars`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="reviews">Most Reviews</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {loading ? 'Searching...' : `${sortedProviders.length} Providers Found`}
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600">Searching for providers...</p>
                </div>
              ) : sortedProviders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="text-gray-400 text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No providers found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or browse providers by state
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Browse by State
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Link
                              href={`/provider/${provider.slug}`}
                              className="text-xl font-bold text-gray-900 hover:text-primary-600"
                            >
                              {provider.name}
                            </Link>
                            <ListingTierBadge
                              tier={(provider as any).listingTier || 'BASIC'}
                              isFeaturedCity={(provider as any).isFeaturedCity || false}
                              isFeatured={(provider as any).isFeatured || false}
                            />
                          </div>
                          {provider.rating && (
                            <div
                              onClick={() => {
                                trackRatingView(provider, 'search-results')
                              }}
                            >
                              <RatingBadge
                                rating={provider.rating}
                                reviewsCount={provider.reviewsCount}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {provider.description && (
                        <p className="text-gray-600 mb-4">
                          {provider.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-4">
                        {provider.services.slice(0, 3).map(service => (
                          <span
                            key={service}
                            className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                          >
                            {service}
                          </span>
                        ))}
                        {provider.services.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            +{provider.services.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-500 mb-4">
                        {formatCoverageDisplay(provider.coverage)}
                      </div>

                      <div className="flex justify-between items-center">
                        <ProviderActions
                          provider={provider}
                          variant="compact"
                          currentLocation="search"
                        />
                        <Link
                          href={`/provider/${provider.slug}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Full Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // STATE DIRECTORY VIEW
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse Providers by State</h2>
              <p className="text-gray-600">Select your state to find mobile phlebotomy providers in your area</p>
            </div>

            {/* Featured: Detroit Metro Suggestion */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg shadow-md p-6 mb-8 border-2 border-primary-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🏙️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">Popular in Michigan:</h3>
                    <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full font-medium">NOW SERVING</span>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Find mobile phlebotomy providers serving Detroit and the surrounding metro area
                  </p>
                  <Link
                    href="/detroit-mi/mobile-phlebotomy"
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Detroit Mobile Phlebotomy →
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {Object.entries(statesByRegion).map(([region, states]) => (
                <div key={region}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-primary-600">{region}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {states.map(state => {
                      const count = stateProviderCounts[state.abbr] || 0
                      return (
                        <Link
                          key={state.abbr}
                          href={`/us/${state.slug}`}
                          className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg hover:bg-primary-50 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-primary-600">{state.name}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {count > 0 ? `${count} provider${count !== 1 ? 's' : ''}` : 'No providers yet'}
                              </div>
                            </div>
                            <div className="text-gray-400 group-hover:text-primary-600">→</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
