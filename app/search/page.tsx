'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/ui/SearchBar'
import { ProviderActions, ProviderDetailsModal } from '@/components/ui/ProviderActions'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { trackRatingFilter, trackRatingView } from '@/lib/provider-actions'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'

export default function Search() {
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
    async function fetchProviders() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set('query', searchQuery)
        if (selectedServices.length > 0) params.set('services', selectedServices.join(','))
        if (minRating) params.set('minRating', minRating.toString())
        if (sortBy) params.set('sortBy', sortBy)
        
        const url = `/api/providers?${params.toString()}`
        console.log('Fetching providers with URL:', url)
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch providers')
        }
        
        const results = await response.json()
        console.log(`Loaded ${results.length} providers, sorted by: ${sortBy}`)
        setProviders(results)
      } catch (error) {
        console.error('Error fetching providers:', error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchProviders()
  }, [searchQuery, selectedServices, minRating, sortBy])

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Find Mobile Phlebotomy Services</h1>
          
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by location, provider name, or service..."
            className="mb-6"
          />

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Filter by Services</h3>
              <div className="flex flex-wrap gap-2">
                {serviceOptions.map((service) => (
                  <button
                    key={service}
                    onClick={() => handleServiceToggle(service)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedServices.includes(service)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Filter by Rating</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setMinRating(null)
                    trackRatingFilter('all', 'search-page')
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    minRating === null
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Ratings
                </button>
                <button
                  onClick={() => {
                    setMinRating(4.5)
                    trackRatingFilter('4.5+', 'search-page')
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    minRating === 4.5
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>🏆</span>
                  4.5+ Stars
                </button>
                <button
                  onClick={() => {
                    setMinRating(4.0)
                    trackRatingFilter('4.0+', 'search-page')
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    minRating === 4.0
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>⭐</span>
                  4.0+ Stars
                </button>
                <button
                  onClick={() => {
                    setMinRating(3.5)
                    trackRatingFilter('3.5+', 'search-page')
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    minRating === 3.5
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>✨</span>
                  3.5+ Stars
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {providers.length} provider{providers.length !== 1 ? 's' : ''} found
          </p>
          
          <select 
            value={sortBy} 
            onChange={(e) => {
              console.log('Sort changed to:', e.target.value)
              setSortBy(e.target.value as 'rating' | 'distance' | 'reviews' | 'name')
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
          >
            <option value="rating">Sort by Rating (High to Low)</option>
            <option value="reviews">Sort by Reviews (Most Reviews)</option>
            <option value="name">Sort by Name (A to Z)</option>
          </select>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Loading providers...</h3>
              <p className="text-gray-600">Please wait while we search for providers.</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No providers found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or location.</p>
            </div>
          ) : (
            providers.map((provider) => (
              <div key={provider.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{provider.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {provider.address?.city && (
                        <span>📍 Based in {provider.address.city}, {provider.address.state}</span>
                      )}
                      {provider.phone && <span>📞 {provider.phone}</span>}
                    </div>
                    {provider.rating && provider.reviewsCount && (
                      <div className="mt-2">
                        <RatingBadge 
                          rating={provider.rating} 
                          reviewsCount={provider.reviewsCount}
                          variant="default"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {provider.badges?.map((badge) => (
                      <span
                        key={badge}
                        className={`text-xs px-2 py-1 rounded-full ${
                          badge === 'Certified' ? 'bg-green-100 text-green-800' :
                          badge === 'Insured' ? 'bg-blue-100 text-blue-800' :
                          badge === 'Background-Checked' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {provider.description && (
                  <p className="text-gray-600 mb-4">{provider.description}</p>
                )}

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Services Offered:</h4>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service) => (
                      <span
                        key={service}
                        className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                  {provider.availability && (
                    <div>
                      <span className="font-medium">Availability:</span> {provider.availability.join(', ')}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Coverage:</span> {formatCoverageDisplay(provider.coverage)}
                  </div>
                  {provider.website && (
                    <div>
                      <span className="font-medium">Website:</span>{' '}
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {provider.website.replace('https://', '')}
                      </a>
                    </div>
                  )}
                </div>

                <ProviderActions
                  provider={provider}
                  currentLocation={searchQuery}
                  showStructuredData={true}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Provider Details Modal */}
      <ProviderDetailsModal
        provider={selectedProvider}
        isOpen={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        currentLocation={searchQuery}
      />
    </div>
  )
}