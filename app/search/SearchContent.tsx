'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/ui/SearchBar'
import { ProviderActions, ProviderDetailsModal } from '@/components/ui/ProviderActions'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { trackRatingFilter, trackRatingView } from '@/lib/provider-actions'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'

export default function SearchContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'reviews' | 'name'>('rating')
  const [loading, setLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)

  const serviceOptions = [
    'At-Home Blood Draw',
    'Corporate Wellness',
    'Pediatric',
    'Geriatric',
    'Fertility/IVF',
    'Specimen Pickup',
    'Lab Partner'
  ]

  useEffect(() => {
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

  useEffect(() => {
    // Search providers based on current filters
    const searchProviders = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append('query', searchQuery)
        if (selectedServices.length > 0) {
          params.append('services', selectedServices.join(','))
        }
        if (minRating !== null) {
          params.append('minRating', minRating.toString())
        }
        params.append('sortBy', sortBy)

        const response = await fetch(`/api/providers?${params}`)
        const data = await response.json()
        setProviders(data || [])
      } catch (error) {
        console.error('Error searching providers:', error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    searchProviders()
  }, [searchQuery, selectedServices, minRating, sortBy])

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

  const sortedProviders = [...providers].sort((a, b) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Search Mobile Phlebotomy Providers</h1>
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            className="max-w-2xl"
            placeholder="Search by location, provider name, or service..."
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="font-bold text-lg mb-4">Filters</h2>
              
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
                <p className="text-gray-600">
                  Try adjusting your filters or search in a different location
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedProviders.map((provider) => (
                  <div 
                    key={provider.id} 
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {provider.name}
                        </h3>
                        {provider.rating && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation()
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

                    <div onClick={(e) => e.stopPropagation()}>
                      <ProviderActions
                        provider={provider}
                        variant="compact"
                        currentLocation="search"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provider Details Modal */}
      {selectedProvider && (
        <ProviderDetailsModal
          provider={selectedProvider}
          isOpen={true}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  )
}