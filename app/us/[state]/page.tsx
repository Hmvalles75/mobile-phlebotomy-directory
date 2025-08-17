'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BreadcrumbNav } from '@/components/seo/BreadcrumbSchema'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'

// State data with full names and abbreviations
const stateData: Record<string, {name: string, abbr: string}> = {
  'alabama': { name: 'Alabama', abbr: 'AL' },
  'alaska': { name: 'Alaska', abbr: 'AK' },
  'arizona': { name: 'Arizona', abbr: 'AZ' },
  'arkansas': { name: 'Arkansas', abbr: 'AR' },
  'california': { name: 'California', abbr: 'CA' },
  'colorado': { name: 'Colorado', abbr: 'CO' },
  'connecticut': { name: 'Connecticut', abbr: 'CT' },
  'delaware': { name: 'Delaware', abbr: 'DE' },
  'florida': { name: 'Florida', abbr: 'FL' },
  'georgia': { name: 'Georgia', abbr: 'GA' },
  'hawaii': { name: 'Hawaii', abbr: 'HI' },
  'idaho': { name: 'Idaho', abbr: 'ID' },
  'illinois': { name: 'Illinois', abbr: 'IL' },
  'indiana': { name: 'Indiana', abbr: 'IN' },
  'iowa': { name: 'Iowa', abbr: 'IA' },
  'kansas': { name: 'Kansas', abbr: 'KS' },
  'kentucky': { name: 'Kentucky', abbr: 'KY' },
  'louisiana': { name: 'Louisiana', abbr: 'LA' },
  'maine': { name: 'Maine', abbr: 'ME' },
  'maryland': { name: 'Maryland', abbr: 'MD' },
  'massachusetts': { name: 'Massachusetts', abbr: 'MA' },
  'michigan': { name: 'Michigan', abbr: 'MI' },
  'minnesota': { name: 'Minnesota', abbr: 'MN' },
  'mississippi': { name: 'Mississippi', abbr: 'MS' },
  'missouri': { name: 'Missouri', abbr: 'MO' },
  'montana': { name: 'Montana', abbr: 'MT' },
  'nebraska': { name: 'Nebraska', abbr: 'NE' },
  'nevada': { name: 'Nevada', abbr: 'NV' },
  'new-hampshire': { name: 'New Hampshire', abbr: 'NH' },
  'new-jersey': { name: 'New Jersey', abbr: 'NJ' },
  'new-mexico': { name: 'New Mexico', abbr: 'NM' },
  'new-york': { name: 'New York', abbr: 'NY' },
  'north-carolina': { name: 'North Carolina', abbr: 'NC' },
  'north-dakota': { name: 'North Dakota', abbr: 'ND' },
  'ohio': { name: 'Ohio', abbr: 'OH' },
  'oklahoma': { name: 'Oklahoma', abbr: 'OK' },
  'oregon': { name: 'Oregon', abbr: 'OR' },
  'pennsylvania': { name: 'Pennsylvania', abbr: 'PA' },
  'rhode-island': { name: 'Rhode Island', abbr: 'RI' },
  'south-carolina': { name: 'South Carolina', abbr: 'SC' },
  'south-dakota': { name: 'South Dakota', abbr: 'SD' },
  'tennessee': { name: 'Tennessee', abbr: 'TN' },
  'texas': { name: 'Texas', abbr: 'TX' },
  'utah': { name: 'Utah', abbr: 'UT' },
  'vermont': { name: 'Vermont', abbr: 'VT' },
  'virginia': { name: 'Virginia', abbr: 'VA' },
  'washington': { name: 'Washington', abbr: 'WA' },
  'west-virginia': { name: 'West Virginia', abbr: 'WV' },
  'wisconsin': { name: 'Wisconsin', abbr: 'WI' },
  'wyoming': { name: 'Wyoming', abbr: 'WY' }
}

interface StatePageProps {
  params: {
    state: string
  }
}

export default function StatePage({ params }: StatePageProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  const stateSlug = params.state
  const stateInfo = stateData[stateSlug]
  
  if (!stateInfo) {
    notFound()
  }

  const { name: stateName, abbr: stateAbbr } = stateInfo

  // Fetch providers for this state
  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await fetch(`/api/providers?state=${stateAbbr}`)
        if (response.ok) {
          const data = await response.json()
          setProviders(data)
        }
      } catch (error) {
        console.error('Error fetching providers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [stateAbbr])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `Mobile Phlebotomy Services in ${stateName}`,
            "description": `Find certified mobile phlebotomy providers throughout ${stateName}. Professional at-home blood draws and lab collections.`,
            "url": `${process.env.NEXT_PUBLIC_SITE_URL}/us/${stateSlug}`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": providers.length,
              "itemListElement": providers.slice(0, 10).map((provider, index) => ({
                "@type": "LocalBusiness",
                "position": index + 1,
                "name": provider.name,
                "description": provider.description,
                "url": provider.website,
                "telephone": provider.phone
              }))
            }
          })
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">
              Mobile Phlebotomy Services in {stateName}
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Find certified mobile phlebotomists for at-home blood draws throughout {stateName}. 
              Professional, licensed providers available in your area.
            </p>
            <div className="flex items-center space-x-4 text-primary-100">
              <div className="flex items-center">
                <span className="font-semibold text-white">{providers.length}</span>
                <span className="ml-2">providers available</span>
              </div>
              <div>•</div>
              <div>Licensed & Insured</div>
              <div>•</div>
              <div>HIPAA Compliant</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* SEO-Optimized Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <BreadcrumbNav 
            items={[
              { name: 'Home', url: '/' },
              { name: stateName, url: `/us/${stateSlug}` }
            ]}
          />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content - Provider Listings */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  All Mobile Phlebotomy Providers in {stateName}
                </h2>
                <p className="text-gray-600 mt-2">
                  {loading ? 'Loading providers...' : `${providers.length} certified providers available`}
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">⏳</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading providers...</h3>
                  <p className="text-gray-600">Please wait while we load providers in {stateName}.</p>
                </div>
              ) : providers.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No providers found in {stateName}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We're working to expand our network to {stateName}. 
                    Check back soon or search in nearby states.
                  </p>
                  <Link
                    href="/search"
                    className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Search All Providers
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <div key={provider.id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {provider.name}
                          </h3>
                          {provider.description && (
                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {provider.description}
                            </p>
                          )}
                          
                          {/* Coverage Area */}
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-700">Coverage: </span>
                            <span className="text-sm text-gray-600">
                              {formatCoverageDisplay(provider.coverage)}
                            </span>
                          </div>

                          {/* Services */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {provider.services.slice(0, 3).map((service) => (
                              <span
                                key={service}
                                className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full"
                              >
                                {service}
                              </span>
                            ))}
                            {provider.services.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{provider.services.length - 3} more
                              </span>
                            )}
                          </div>

                          {/* Rating & Reviews */}
                          {provider.rating && (
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="flex items-center">
                                <span className="text-yellow-400">★</span>
                                <span className="text-sm font-medium text-gray-900 ml-1">
                                  {provider.rating}
                                </span>
                              </div>
                              {provider.reviewsCount && (
                                <span className="text-sm text-gray-600">
                                  ({provider.reviewsCount} reviews)
                                </span>
                              )}
                            </div>
                          )}

                          {/* Contact Info */}
                          <div className="text-sm text-gray-600 space-y-1">
                            {provider.phone && (
                              <div>📞 {provider.phone}</div>
                            )}
                            {provider.address?.city && (
                              <div>📍 Based in {provider.address.city}, {provider.address.state}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <ProviderActions
                        provider={provider}
                        currentLocation={stateName}
                        className="justify-start"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Facts */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Facts</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    <span className="text-gray-600">Licensed professionals statewide</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    <span className="text-gray-600">Same-day appointments available</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    <span className="text-gray-600">Insurance accepted by most providers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">✓</span>
                    <span className="text-gray-600">HIPAA compliant services</span>
                  </li>
                </ul>
              </div>

              {/* Search Other States */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Other States</h3>
                <div className="space-y-2">
                  <Link href="/us/california" className="block text-primary-600 hover:text-primary-700">
                    California →
                  </Link>
                  <Link href="/us/texas" className="block text-primary-600 hover:text-primary-700">
                    Texas →
                  </Link>
                  <Link href="/us/florida" className="block text-primary-600 hover:text-primary-700">
                    Florida →
                  </Link>
                  <Link href="/us/new-york" className="block text-primary-600 hover:text-primary-700">
                    New York →
                  </Link>
                  <Link href="/" className="block text-gray-600 hover:text-primary-600 font-medium">
                    View All States →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            About Mobile Phlebotomy Services in {stateName}
          </h2>
          <div className="prose max-w-none text-gray-600">
            <p>
              Mobile phlebotomy services in {stateName} provide convenient at-home blood draws 
              for patients who prefer the comfort and safety of their own environment. Our network 
              of certified phlebotomists serves all major cities and regions throughout the state.
            </p>
            <p className="mt-4">
              Whether you're in a major metropolitan area or a smaller community, you can find 
              qualified mobile phlebotomy professionals who offer flexible scheduling, competitive 
              pricing, and professional service. Many providers accept insurance and offer same-day 
              or next-day appointments.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}