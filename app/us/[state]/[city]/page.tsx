'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SearchBar } from '@/components/ui/SearchBar'
import InlineLeadForm from '@/components/InlineLeadForm'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'
import { ProviderSchema } from '@/components/seo/ProviderSchema'
import { generateLocalBusinessSchema, generateProviderListSchema, generateBreadcrumbSchema } from '@/lib/schema-generators'
import { getProviderBadge } from '@/lib/provider-tiers'
import { ga4 } from '@/lib/ga4'
import { PhoneReveal } from '@/components/PhoneReveal'
import { ProviderDescription } from '@/components/ui/ProviderDescription'
import { cityByStateCity, CITY_MAPPING } from '@/data/cities-full'

// Use the standardized coverage display function
function getProviderCoverageDisplay(provider: Provider, currentCity?: string): string {
  return formatCoverageDisplay(provider.coverage);
}


interface PageProps {
  params: {
    state: string
    city: string
  }
}

export default function CityPage({ params }: PageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [groupedResults, setGroupedResults] = useState<{
    citySpecific: Provider[]
    regional: Provider[]
    statewide: Provider[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  const cityInfo = cityByStateCity(params.state, params.city)

  // Handle city not in mapping - show conversion-optimized page
  const cityNotFound = !cityInfo

  // For unfound cities, create synthetic city info from URL params
  const cityName = cityInfo?.name || params.city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const state = cityInfo?.state || params.state.toUpperCase()
  
  useEffect(() => {
    async function fetchProviders() {
      if (cityNotFound) {
        // For unfound cities, try state-level search
        setLoading(false)
        setProviders([])
        return
      }

      setLoading(true)
      try {
        // Try enhanced search first with grouped results
        const params = new URLSearchParams({
          city: cityName,
          state: state,
          grouped: 'true'
        })

        const response = await fetch(`/api/providers/city?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch providers')
        }

        const data = await response.json()

        // Check if we got grouped results or flat array
        if (data.citySpecific || data.regional || data.statewide) {
          // Store grouped results and combine for display
          setGroupedResults(data)
          const allProviders = [
            ...(data.citySpecific || []),
            ...(data.regional || []),
            ...(data.statewide || [])
          ]
          setProviders(allProviders)
        } else {
          // Fallback to flat array
          setGroupedResults(null)
          setProviders(data)
        }
      } catch (error) {
        console.error('Error fetching providers:', error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [cityName, state, cityNotFound])

  const serviceOptions = [
    'At-Home Blood Draw',
    'Corporate Wellness',
    'Pediatric',
    'Geriatric',
    'Fertility/IVF',
    'Specimen Pickup',
    'Lab Partner'
  ]

  // Filter providers based on search and services
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = !searchQuery || 
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.coverage.cities?.some(city => city.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesServices = selectedServices.length === 0 ||
      selectedServices.some(service => provider.services.includes(service as any))

    return matchesSearch && matchesServices
  })

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }


  // City Not Found - Show Conversion Page
  if (cityNotFound) {
    // Get nearby cities from same state
    const nearbyCities = Object.values(CITY_MAPPING)
      .filter((info) => info.state === state)
      .slice(0, 6)

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl">
              <h1 className="text-4xl font-bold mb-4">
                Looking for Mobile Phlebotomy in {cityName}, {state}?
              </h1>
              <p className="text-xl text-primary-100 mb-6">
                We don&apos;t have providers specifically listed for {cityName} yet, but we can still help you find mobile blood draw services in your area.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Primary CTA - Lead Form */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl p-8 shadow-lg border-2 border-primary-200">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Submit Your Request - We&apos;ll Match You Manually
                </h2>
                <p className="text-lg text-gray-700 mb-2">
                  Don&apos;t have providers listed in {cityName}? No problem.
                </p>
                <p className="text-gray-600">
                  Submit your request and we&apos;ll personally connect you with licensed mobile phlebotomists who serve your area.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    ga4.leadCtaClick({ placement: 'not_found' })
                    setLeadFormOpen(true)
                  }}
                  className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-xl transform hover:scale-105"
                >
                  📋 Request a Mobile Blood Draw
                </button>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Free service</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>No obligation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Quick response</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nearby Cities */}
          {nearbyCities.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Or Browse Nearby Cities in {state}
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {nearbyCities.map(city => (
                  <Link
                    key={city.citySlug}
                    href={`/us/${city.stateSlug}/${city.citySlug}`}
                    className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-primary-500 text-center group"
                  >
                    <div className="text-3xl mb-2">📍</div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600">
                      {city.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">View Providers →</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* State-Level Fallback */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                All Mobile Phlebotomy Providers in {state}
              </h2>
              <p className="text-gray-600 mb-6">
                Browse all mobile blood draw services available across {state}. Many providers serve multiple cities and may cover your area.
              </p>
              <Link
                href={`/us/${state.toLowerCase()}`}
                className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                View All {state} Providers
              </Link>
            </div>
          </div>

          {/* Why Choose Mobile Phlebotomy */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Why Choose Mobile Phlebotomy?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Convenience</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Skip the wait at traditional labs</li>
                    <li>• Comfortable home environment</li>
                    <li>• Flexible scheduling</li>
                    <li>• No travel required</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Service</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Licensed phlebotomists</li>
                    <li>• Same accuracy as traditional labs</li>
                    <li>• Insurance often accepted</li>
                    <li>• HIPAA compliant</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Form Modal */}
        <LeadFormModal
          isOpen={leadFormOpen}
          onClose={() => setLeadFormOpen(false)}
          defaultCity={cityName}
          defaultState={state}
          defaultZip=""
        />
      </div>
    )
  }

  // Normal city page for cities in mapping
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">
              Mobile Phlebotomy Services in {cityName}, {state}
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Find certified mobile phlebotomists for at-home blood draws and lab collections in {cityName}.
              Licensed, insured, and professional services available 7 days a week.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Same-day appointments</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Licensed professionals</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Insured & bonded</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>HIPAA compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search providers in ${cityName}...`}
            className="mb-4"
          />

          <div className="mb-4">
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
        </div>
      </div>

      {/* Providers Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {filteredProviders.length} Provider{filteredProviders.length !== 1 ? 's' : ''} Available in {cityName}
            </h2>
            {groupedResults && (
              <div className="text-sm text-gray-600 mb-2">
                {groupedResults.citySpecific.length > 0 && (
                  <span className="mr-4">
                    <span className="font-medium text-green-700">{groupedResults.citySpecific.length}</span> city-specific
                  </span>
                )}
                {groupedResults.regional.length > 0 && (
                  <span className="mr-4">
                    <span className="font-medium text-blue-700">{groupedResults.regional.length}</span> regional
                  </span>
                )}
                {groupedResults.statewide.length > 0 && (
                  <span className="mr-4">
                    <span className="font-medium text-gray-700">{groupedResults.statewide.length}</span> statewide
                  </span>
                )}
              </div>
            )}
            <p className="text-gray-600">
              Professional mobile phlebotomy services available in your area
            </p>
          </div>
          
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>Sort by Rating</option>
            <option>Sort by Reviews</option>
            <option>Sort by Experience</option>
          </select>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Loading providers...</h3>
              <p className="text-gray-600">Please wait while we find providers in {cityName}.</p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <InlineLeadForm city={cityName} state={state} variant="no-results" />
          ) : (
            filteredProviders.map((provider) => {
              // Determine provider type for visual indicator
              let providerType = 'statewide';
              if (groupedResults?.citySpecific.some(p => p.id === provider.id)) {
                providerType = 'city-specific';
              } else if (groupedResults?.regional.some(p => p.id === provider.id)) {
                providerType = 'regional';
              }

              const registeredBadge = getProviderBadge(provider.id)

              return (
              <div key={provider.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Individual Provider Schema */}
                <ProviderSchema
                  provider={provider}
                  location={`${cityName}, ${state}`}
                />

                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/provider/${provider.slug}`}
                        className="text-xl font-bold text-gray-900 hover:text-primary-600"
                      >
                        {provider.name}
                      </Link>
                      {/* Nationwide/Multi-State Badge */}
                      {(provider as any).is_nationwide === 'Yes' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          🌎 Nationwide Service
                        </span>
                      )}
                      {/* Registered/Featured Badge */}
                      {registeredBadge && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${registeredBadge.color}`}>
                          {registeredBadge.icon} {registeredBadge.text}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      {provider.address?.city && provider.address.city.trim() ? (
                        <span>📍 {provider.address.city}{provider.address.state ? `, ${provider.address.state}` : ''}{provider.address.zip ? ` ${provider.address.zip}` : ''}</span>
                      ) : (
                        <span>🌐 Online Services</span>
                      )}
                      {provider.phone && !provider.isFeatured && (
                        <PhoneReveal
                          phone={provider.phone}
                          providerId={provider.id}
                          providerName={provider.name}
                          variant="compact"
                        />
                      )}
                      {provider.rating && provider.reviewsCount && (
                        <div className="flex items-center">
                          <span className="text-yellow-400">
                            {'★'.repeat(Math.floor(provider.rating))}{'☆'.repeat(5 - Math.floor(provider.rating))}
                          </span>
                          <span className="ml-1">{provider.rating} ({provider.reviewsCount} reviews)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      {provider.availability && (
                        <span>📅 {provider.availability.join(', ')}</span>
                      )}
                      {provider.payment && (
                        <span>💳 {provider.payment.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {/* Coverage type indicator with improved messaging */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full text-center ${
                        providerType === 'city-specific' ? 'bg-green-100 text-green-800' :
                        providerType === 'regional' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {providerType === 'city-specific' ? '📍 Serves This Area' :
                       providerType === 'regional' ? '🌐 Regional Coverage' :
                       '🗺️ Statewide Service'}
                    </span>
                    {provider.badges?.map((badge) => (
                      <span
                        key={badge}
                        className={`text-xs px-2 py-1 rounded-full text-center ${
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
                  <div className="mb-4">
                    <ProviderDescription
                      description={provider.description}
                      flagged={!!(provider as any).descriptionFlagged}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Services Offered:</h4>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const services = provider.services || []
                      const isFeatured = !!provider.isFeatured
                      const visible = isFeatured ? services : services.slice(0, 3)
                      const hidden = isFeatured ? 0 : Math.max(0, services.length - 3)
                      return (
                        <>
                          {visible.map((service) => (
                            <span
                              key={service}
                              className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded"
                            >
                              {service}
                            </span>
                          ))}
                          {hidden > 0 && (
                            <span className="text-xs text-gray-500 self-center">+{hidden} more</span>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Coverage:</span> {getProviderCoverageDisplay(provider, cityName)}
                  {(provider as any).serviceRadiusMiles && (
                    <span> — within {(provider as any).serviceRadiusMiles} mile radius</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <ProviderActions
                    provider={provider}
                    currentLocation={`${cityName}, ${state}`}
                    variant="compact"
                  />
                  <Link
                    href={`/provider/${provider.slug}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Full Details →
                  </Link>
                </div>
              </div>
              )
            })
          )}
        </div>

        {/* Inline Lead Form */}
        <div className="mt-12">
          <InlineLeadForm city={cityName} state={state} />
        </div>

        {/* Local Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            About Mobile Phlebotomy in {cityName}, {state}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Choose Mobile Phlebotomy?</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Skip the wait at traditional labs</li>
                <li>• Comfortable home environment</li>
                <li>• Flexible scheduling around your needs</li>
                <li>• Professional, licensed phlebotomists</li>
                <li>• Same accuracy as traditional lab draws</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What to Expect</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Quick 15-30 minute appointments</li>
                <li>• Professional, sterile equipment</li>
                <li>• Results sent directly to your doctor</li>
                <li>• Insurance often covers services</li>
                <li>• Follow-up support if needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}