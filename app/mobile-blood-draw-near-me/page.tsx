'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AutocompleteSearchBar } from '@/components/ui/AutocompleteSearchBar'
import { topMetroAreas } from '@/data/top-metros'
import { type Provider } from '@/lib/schemas'

export default function MobileBloodDrawNearMePage() {
  const [location, setLocation] = useState('')
  const [nearbyProviders, setNearbyProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [locationDetected, setLocationDetected] = useState(false)

  const topMetros = topMetroAreas.slice(0, 16)
  const stateGroups = [
    { name: 'West Coast', states: ['California', 'Washington', 'Oregon'] },
    { name: 'East Coast', states: ['New York', 'Florida', 'Massachusetts'] },
    { name: 'South', states: ['Texas', 'Georgia', 'North Carolina'] },
    { name: 'Midwest', states: ['Illinois', 'Ohio', 'Michigan'] }
  ]

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode these coordinates
          setLocationDetected(true)
          // For demo purposes, we'll just show that location was detected
        },
        (error) => {
          console.log('Location access denied or failed')
        }
      )
    }
  }, [])

  const handleSearch = async (searchLocation: string) => {
    setLocation(searchLocation)
    setLoading(true)

    try {
      // In a real app, this would search for providers near the location
      const response = await fetch(`/api/providers?location=${encodeURIComponent(searchLocation)}&limit=6`)
      if (response.ok) {
        const providers = await response.json()
        setNearbyProviders(providers)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Mobile Blood Draw Near Me - Find Local At-Home Services',
    description: 'Find mobile blood draw services near you. Search 1000+ certified phlebotomists offering at-home blood collection in your area. Same-day appointments available.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/mobile-blood-draw-near-me`,
    mainEntity: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL}/search?location={location}`
      },
      'query-input': 'required name=location'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Mobile Blood Draw Near Me
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Find certified mobile phlebotomists in your area. At-home blood collection services
              available same-day with professional, licensed providers.
            </p>

            {/* Location-based search */}
            <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
              <div className="mb-4">
                <AutocompleteSearchBar
                  placeholder="Enter your city, zip code, or address..."
                  onSearch={handleSearch}
                  className="w-full text-gray-900"
                />
              </div>

              {locationDetected && (
                <div className="text-sm text-green-600 mb-2 flex items-center justify-center">
                  <span className="mr-2">📍</span>
                  Location detected - search to find providers near you
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span className="text-gray-600">Popular searches:</span>
                <button
                  onClick={() => handleSearch('Los Angeles, CA')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Los Angeles
                </button>
                <span className="text-gray-400">•</span>
                <button
                  onClick={() => handleSearch('New York, NY')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  New York
                </button>
                <span className="text-gray-400">•</span>
                <button
                  onClick={() => handleSearch('Chicago, IL')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Chicago
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">1000+</div>
                <div className="text-sm text-blue-100">Certified Providers</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">50</div>
                <div className="text-sm text-blue-100">States Covered</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">24hrs</div>
                <div className="text-sm text-blue-100">Same-day Service</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">$60+</div>
                <div className="text-sm text-blue-100">Starting Price</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {location && (
        <div className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              {loading ? 'Searching...' : `Mobile Blood Draw Services Near ${location}`}
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">⏳</div>
                <p className="text-gray-600">Finding providers in your area...</p>
              </div>
            ) : nearbyProviders.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {nearbyProviders.map((provider) => (
                  <div key={provider.id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{provider.name}</h3>
                    <div className="text-sm text-gray-600 mb-3">
                      {provider.address?.city && (
                        <div className="flex items-center mb-1">
                          <span className="mr-2">📍</span>
                          {provider.address.city}, {provider.address.state}
                        </div>
                      )}
                      {provider.phone && (
                        <div className="flex items-center mb-1">
                          <span className="mr-2">📞</span>
                          {provider.phone}
                        </div>
                      )}
                      {provider.rating && (
                        <div className="flex items-center">
                          <span className="mr-2">⭐</span>
                          {provider.rating} ({provider.reviewsCount} reviews)
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {provider.services.slice(0, 3).map((service) => (
                        <span key={service} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {service}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/search?provider=${provider.slug}`}
                      className="block text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    >
                      View Details & Book
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  We&apos;re expanding to {location} soon! Try searching a nearby major city:
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/metros" className="text-blue-600 hover:text-blue-700">
                    View All Metro Areas
                  </Link>
                  <Link href="/search" className="text-blue-600 hover:text-blue-700">
                    Browse All Providers
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Metro Areas */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Popular Metro Areas for Mobile Blood Draws
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Find mobile phlebotomy services in major metropolitan areas across the country
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {topMetros.map((metro) => (
              <Link
                key={metro.slug}
                href={`/us/metro/${metro.slug}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {metro.city}
                    </h3>
                    <p className="text-sm text-gray-500">{metro.state}</p>
                  </div>
                  <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>💰 {metro.localInfo?.avgCost || '$60-120'}</div>
                  <div>⏱️ {metro.localInfo?.typicalWaitTime || 'Same day'}</div>
                  <div>📍 #{metro.rank} metro area</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/metros"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              View All 50 Metro Areas
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Browse by State */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Browse Mobile Blood Draw Services by State
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {stateGroups.map((group) => (
              <div key={group.name} className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{group.name}</h3>
                <div className="space-y-2">
                  {group.states.map((state) => (
                    <Link
                      key={state}
                      href={`/us/${state.toLowerCase().replace(' ', '-')}`}
                      className="block text-blue-600 hover:text-blue-700 text-sm"
                    >
                      {state} →
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/#browse-by-state"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All 50 States →
            </Link>
          </div>
        </div>
      </div>

      {/* Why Choose Mobile */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why Choose Mobile Blood Draw Services?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Convenience</h3>
                <p className="text-gray-600">
                  No travel, no waiting rooms, no parking fees. Blood draws happen in your
                  comfortable home environment on your schedule.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏱️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Time Saving</h3>
                <p className="text-gray-600">
                  15-30 minute appointments with no wait time. Many providers offer
                  same-day and next-day scheduling for urgent needs.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional</h3>
                <p className="text-gray-600">
                  All mobile phlebotomists are certified, licensed, and insured professionals
                  who maintain the same standards as hospital-based services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Common Questions About Mobile Blood Draws
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  How do I find mobile blood draw services near me?
                </h3>
                <p className="text-gray-700">
                  Use our search tool above to enter your location and find certified providers in your area.
                  You can also browse by state or metro area to see all available options near you.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  How much does mobile blood draw cost?
                </h3>
                <p className="text-gray-700">
                  Mobile blood draw services typically cost $60-150 per visit, depending on your location
                  and the complexity of tests. Many insurance plans cover these services when medically necessary.
                  <Link href="/mobile-phlebotomy-cost" className="text-blue-600 hover:text-blue-700 ml-1">
                    View detailed pricing →
                  </Link>
                </p>
              </div>

              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  How quickly can I get an appointment?
                </h3>
                <p className="text-gray-700">
                  Many mobile phlebotomy providers offer same-day or next-day appointments.
                  Some providers also offer emergency services for urgent testing needs.
                  Availability varies by provider and location.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  What types of blood tests can be done at home?
                </h3>
                <p className="text-gray-700">
                  Most routine blood tests can be performed at home including CBC, metabolic panels,
                  lipid panels, thyroid tests, diabetes monitoring, vitamin levels, and many specialized tests.
                  Your healthcare provider will specify which tests you need.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Find Mobile Blood Draw Services Near You Today
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of patients who have discovered the convenience of at-home blood collection
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/search"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Search All Providers
              </Link>
              <Link
                href="/at-home-blood-draw-services"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}