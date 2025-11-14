'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SearchBar } from '@/components/ui/SearchBar'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'
import { topMetroAreas, getMetroBySlug, type MetroArea } from '@/data/top-metros'
import { ProviderListSchema, ProviderSchema } from '@/components/seo/ProviderSchema'
import { generateProviderListSchema, generateBreadcrumbSchema } from '@/lib/schema-generators'
import { SimpleAccordion } from '@/components/ui/Accordion'
import { ProviderActions } from '@/components/ui/ProviderActions'

interface MetroPageProps {
  params: {
    metro: string
  }
}

export default function MetroPage({ params }: MetroPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [groupedResults, setGroupedResults] = useState<{
    citySpecific: Provider[]
    regional: Provider[]
    statewide: Provider[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllProviders, setShowAllProviders] = useState(false)

  const metro = getMetroBySlug(params.metro)

  if (!metro) {
    notFound()
  }

  useEffect(() => {
    async function fetchProviders() {
      if (!metro) return

      setLoading(true)
      try {
        const params = new URLSearchParams({
          city: metro.city,
          state: metro.stateAbbr,
          grouped: 'true'
        })

        const response = await fetch(`/api/providers/city?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch providers')
        }

        const data = await response.json()

        if (data.citySpecific || data.regional || data.statewide) {
          setGroupedResults(data)
          const allProviders = [
            ...(data.citySpecific || []),
            ...(data.regional || []),
            ...(data.statewide || [])
          ]
          setProviders(allProviders)
        } else {
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
  }, [metro])

  const serviceOptions = [
    'At-Home Blood Draw',
    'Corporate Wellness',
    'Pediatric',
    'Geriatric',
    'Fertility/IVF',
    'Specimen Pickup',
    'Lab Partner'
  ]

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

  const displayedProviders = showAllProviders ? filteredProviders : filteredProviders.slice(0, 10)

  // Generate comprehensive schema markup
  const providerListSchema = generateProviderListSchema(
    providers,
    `Mobile Phlebotomy in ${metro.city}, ${metro.state}`,
    `Find ${providers.length} certified mobile phlebotomy providers in ${metro.city}, ${metro.state}. Professional at-home blood draws starting at ${metro.localInfo?.avgCost || '$60-120'}. ${metro.localInfo?.typicalWaitTime || '24-48 hour'} appointments.`,
    typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_SITE_URL}/us/metro/${metro.slug}`
  )

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: metro.state, url: `/us/${metro.state.toLowerCase().replace(' ', '-')}` },
    { name: metro.city, url: `/us/metro/${metro.slug}` }
  ])

  // Location schema for the metro area
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "City",
    "name": metro.city,
    "alternateName": [metro.city, `${metro.city} Metro`, `${metro.city} Metropolitan Area`],
    "description": `Mobile phlebotomy services available throughout ${metro.city} and surrounding areas`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": metro.city,
      "@region": metro.state,
      "addressCountry": "US"
    },
    "containsPlace": metro.neighborhoods?.map(neighborhood => ({
      "@type": "Neighborhood",
      "name": neighborhood
    })) || [],
    "serviceProvider": providers.slice(0, 5).map(provider => ({
      "@type": "MedicalBusiness",
      "name": provider.name,
      "telephone": provider.phone,
      "aggregateRating": provider.rating ? {
        "@type": "AggregateRating",
        "ratingValue": provider.rating,
        "reviewCount": provider.reviewsCount || 1
      } : undefined
    }))
  }

  // Combined schema graph
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      providerListSchema,
      breadcrumbSchema,
      locationSchema
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph, null, 2) }}
      />

      {/* Hero Section with Local SEO */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">
              Mobile Phlebotomy in {metro.city}, {metro.state}
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Top-rated mobile phlebotomy services serving {metro.city} and surrounding areas.
              {metro.neighborhoods && metro.neighborhoods.length > 0 && (
                <> Including {metro.neighborhoods.slice(0, 3).join(', ')}
                  {metro.neighborhoods.length > 3 && ` and ${metro.neighborhoods.length - 3} more neighborhoods`}.
                </>
              )}
              {' '}Professional at-home blood draws with certified phlebotomists.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">💰</span>
                <span>Average cost: {metro.localInfo?.avgCost || '$60-120'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">⏱️</span>
                <span>{metro.localInfo?.typicalWaitTime || '24-48 hour appointments'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">📍</span>
                <span>Serving all {metro.zipCodes.length}+ zip codes</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Licensed & insured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Local Context Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href={`/us/${metro.state.toLowerCase().replace(' ', '-')}`} className="text-gray-500 hover:text-gray-700">
                {metro.state}
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{metro.city}</span>
            </nav>
            <div className="text-sm text-gray-600">
              Metro area rank: #{metro.rank} by population
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
            placeholder={`Search providers in ${metro.city}...`}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* SEO Content - Summary + Accordion */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              Mobile phlebotomists serve patients throughout the {metro.city} metropolitan area, bringing lab collection services directly to homes, offices, and assisted living facilities. Rather than traveling to a draw station and waiting, residents of {metro.city} can schedule a licensed phlebotomist to visit at a convenient time and location.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This directory lists mobile phlebotomy providers operating in the {metro.city} area. Some are verified and registered, while others are unverified public listings. We recommend confirming credentials, insurance acceptance, and pricing directly with any provider before booking an appointment.
            </p>
          </div>

          <SimpleAccordion
            summary={`Read the full guide to mobile phlebotomy in ${metro.city}`}
            defaultOpen={true}
          >
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                How at-home blood draws work in {metro.city}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Across {metro.city} and the greater {metro.state} area, mobile phlebotomy providers collect blood, urine, and other specimens in patients&apos; homes or workplaces, then deliver samples to partner laboratories for analysis. Providers typically work with national chains such as Quest or LabCorp, though some partner with regional or specialty labs.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You schedule an appointment for a specific time window at your preferred location in {metro.city}.</li>
                <li>The phlebotomist arrives, confirms your identity and lab orders, and collects the required samples.</li>
                <li>Specimens are properly labeled and transported to the designated laboratory.</li>
                <li>Test results are returned to your ordering physician or posted to your lab portal—not shared with this directory.</li>
              </ul>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Typical mobile phlebotomy costs in {metro.city}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Each provider sets their own rates, but mobile blood draw services in {metro.city} generally charge a separate visit fee on top of any laboratory testing costs. Nationally, these convenience fees typically fall between <strong className="text-gray-900">$70 and $150 per appointment</strong>, with variations based on distance traveled, appointment urgency, and whether multiple household members are being drawn.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Larger national providers often publish standard home-visit rates near <strong className="text-gray-900">$75–$80</strong>, while smaller independent services in the {metro.city} region may adjust pricing for factors like mileage from their base, weekend or evening visits, or specialized specimen handling requirements.
              </p>
              <p className="text-sm text-gray-600 italic">
                These figures are illustrative averages and not guaranteed quotes. Contact providers directly to confirm their exact fees, included services, and cancellation policies before you commit to an appointment.
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Insurance and medical orders in {metro.city}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Whether your insurance covers mobile phlebotomy in {metro.city} depends on your specific plan, the laboratory processing your tests, and the medical necessity of the work. Typically, the <em>laboratory testing</em> can be billed to insurance when ordered by a licensed provider, but the <em>mobile collection fee</em> is often an out-of-pocket convenience charge.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Most services require a valid lab requisition from a physician or other authorized healthcare provider.</li>
                <li>Medicare and some private plans may cover in-home draws for homebound patients or those meeting specific medical criteria in {metro.city}.</li>
                <li>Many mobile phlebotomy services operate on a cash-pay basis for the visit fee, even when the lab itself is in-network with your insurance.</li>
              </ul>
              <p className="text-sm text-gray-600 italic">
                Before scheduling, verify coverage details with both your insurance carrier and the laboratory named on your requisition to understand any copays, deductibles, or home-visit restrictions.
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Who benefits from mobile phlebotomy in {metro.city}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Residents of {metro.city} choose mobile phlebotomy for its convenience and accessibility. The service is particularly valuable for individuals who face challenges traveling to traditional lab locations, as well as those seeking to minimize exposure in clinical settings or coordinate testing around demanding schedules. Common use cases include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Patients recovering from surgery or managing chronic conditions at home</li>
                <li>Families arranging pediatric lab work in a familiar, comfortable environment</li>
                <li>Working professionals who cannot take time off for lab visits</li>
                <li>Residents of senior communities, assisted living, or long-term care facilities</li>
                <li>Individuals pursuing wellness panels, hormone testing, or functional medicine evaluations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Browse the providers listed below to identify mobile phlebotomists serving {metro.city}, or use the inquiry form to request quotes and availability from multiple providers at once.
              </p>
            </section>
          </SimpleAccordion>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Providers Section */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {filteredProviders.length} Provider{filteredProviders.length !== 1 ? 's' : ''} in {metro.city}
                </h2>
                {groupedResults && (
                  <div className="text-sm text-gray-600">
                    {groupedResults.citySpecific.length > 0 && (
                      <span className="mr-4">
                        <span className="font-medium text-green-700">{groupedResults.citySpecific.length}</span> local
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
              </div>

              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>Sort by Rating</option>
                <option>Sort by Reviews</option>
                <option>Sort by Experience</option>
              </select>
            </div>

            <div className="grid gap-6">
              {loading ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                  <div className="text-gray-400 text-6xl mb-4">⏳</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Loading providers...</h3>
                  <p className="text-gray-600">Finding the best mobile phlebotomy services in {metro.city}.</p>
                </div>
              ) : displayedProviders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No providers found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or check nearby cities.</p>
                  <a href="/search" className="inline-block mt-4 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                    Search All Providers
                  </a>
                </div>
              ) : (
                <>
                  {displayedProviders.map((provider) => {
                    let providerType = 'statewide';
                    if (groupedResults?.citySpecific.some(p => p.id === provider.id)) {
                      providerType = 'local';
                    } else if (groupedResults?.regional.some(p => p.id === provider.id)) {
                      providerType = 'regional';
                    }

                    return (
                      <div key={provider.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        {/* Individual Provider Schema */}
                        <ProviderSchema
                          provider={provider}
                          location={`${metro.city}, ${metro.state}`}
                        />

                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <Link
                              href={`/provider/${provider.slug}`}
                              className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600 inline-block"
                            >
                              {provider.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                              {provider.address?.city && provider.address.city.trim() && (
                                <span>📍 {provider.address.city}{provider.address.state ? `, ${provider.address.state}` : ''}</span>
                              )}
                              {provider.phone && <span>📞 {provider.phone}</span>}
                              {provider.rating && provider.reviewsCount && (
                                <div className="flex items-center">
                                  <span className="text-yellow-400">
                                    {'★'.repeat(Math.floor(provider.rating))}{'☆'.repeat(5 - Math.floor(provider.rating))}
                                  </span>
                                  <span className="ml-1">{provider.rating} ({provider.reviewsCount} reviews)</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-full text-center ${
                                providerType === 'local' ? 'bg-green-100 text-green-800' :
                                providerType === 'regional' ? 'bg-blue-100 text-blue-800' :
                                'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {providerType === 'local' ? `📍 ${metro.city} Local` :
                               providerType === 'regional' ? '🌐 Regional' :
                               `🗺️ ${metro.state}-wide`}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Coverage:</span> {formatCoverageDisplay(provider.coverage)}
                          </div>
                          {provider.website && (
                            <div>
                              🌐{' '}
                              <a
                                href={provider.website}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="text-gray-600 hover:text-primary-600 underline text-xs"
                              >
                                Website
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-center mt-4">
                          <ProviderActions
                            provider={provider}
                            currentLocation={metro.city}
                            variant="compact"
                          />
                        </div>
                      </div>
                    )
                  })}

                  {!showAllProviders && filteredProviders.length > 10 && (
                    <div className="text-center py-6">
                      <button
                        onClick={() => setShowAllProviders(true)}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Show All {filteredProviders.length} Providers
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Local Info Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {metro.city} Service Info
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Average Cost</dt>
                    <dd className="text-lg font-semibold text-gray-900">{metro.localInfo?.avgCost || '$60-120'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Typical Wait Time</dt>
                    <dd className="text-lg font-semibold text-gray-900">{metro.localInfo?.typicalWaitTime || '24-48 hours'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Service Areas</dt>
                    <dd className="text-sm text-gray-900">
                      {metro.neighborhoods ? metro.neighborhoods.slice(0, 5).join(', ') : `All ${metro.city} areas`}
                      {metro.neighborhoods && metro.neighborhoods.length > 5 && ` +${metro.neighborhoods.length - 5} more`}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Major Hospitals */}
              {metro.majorHospitals && metro.majorHospitals.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Major Medical Centers
                  </h3>
                  <ul className="space-y-2">
                    {metro.majorHospitals.map((hospital) => (
                      <li key={hospital} className="flex items-start">
                        <span className="text-primary-600 mr-2">🏥</span>
                        <span className="text-sm text-gray-600">{hospital}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    Mobile phlebotomy services work with all major hospitals and labs
                  </p>
                </div>
              )}

              {/* FAQ Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      How much does mobile phlebotomy cost in {metro.city}?
                    </h4>
                    <p className="text-sm text-gray-600">
                      Services typically range from {metro.localInfo?.avgCost || '$60-120'} per visit.
                      Many providers accept insurance which may cover the cost.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      What areas of {metro.city} do you serve?
                    </h4>
                    <p className="text-sm text-gray-600">
                      Our providers serve all neighborhoods including
                      {metro.neighborhoods ? ` ${metro.neighborhoods.slice(0, 3).join(', ')}` : ' downtown and surrounding areas'},
                      covering all {metro.zipCodes.length}+ zip codes in the metro area.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      How quickly can I get an appointment?
                    </h4>
                    <p className="text-sm text-gray-600">
                      Most providers offer {metro.localInfo?.typicalWaitTime || '24-48 hour'} scheduling,
                      with some offering same-day service for urgent needs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nearby Cities */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Nearby Metro Areas
                </h3>
                <div className="space-y-2">
                  {topMetroAreas
                    .filter(m => m.stateAbbr === metro.stateAbbr && m.slug !== metro.slug)
                    .slice(0, 3)
                    .map(nearbyMetro => (
                      <Link
                        key={nearbyMetro.slug}
                        href={`/us/metro/${nearbyMetro.slug}`}
                        className="block text-primary-600 hover:text-primary-700"
                      >
                        {nearbyMetro.city} →
                      </Link>
                    ))}
                  <Link
                    href={`/us/${metro.state.toLowerCase().replace(' ', '-')}`}
                    className="block text-gray-600 hover:text-primary-600 font-medium"
                  >
                    View All {metro.state} Cities →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom SEO Content */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            About Mobile Phlebotomy in {metro.city}, {metro.state}
          </h2>

          <div className="prose max-w-none text-gray-600 space-y-4">
            <p>
              {metro.city} residents have access to {providers.length} professional mobile phlebotomy providers
              offering convenient at-home blood draw services throughout the metro area. Whether you live in
              {metro.neighborhoods && metro.neighborhoods.length > 0
                ? ` ${metro.neighborhoods.slice(0, 3).join(', ')}, or other neighborhoods`
                : ' the city center or surrounding areas'},
              certified phlebotomists can come directly to your home or office.
            </p>

            <p>
              Mobile phlebotomy services in {metro.city} typically cost between {metro.localInfo?.avgCost || '$60-120'} per visit,
              with many providers accepting insurance coverage. Appointments are usually available within {metro.localInfo?.typicalWaitTime || '24-48 hours'},
              and some providers offer same-day service for urgent needs.
            </p>

            {metro.majorHospitals && metro.majorHospitals.length > 0 && (
              <p>
                Our network of providers works with all major medical facilities in the area, including {metro.majorHospitals.slice(0, 3).join(', ')},
                ensuring your lab results are sent directly to your healthcare provider. All phlebotomists are licensed,
                insured, and follow strict HIPAA compliance protocols.
              </p>
            )}

            {metro.localInfo?.majorEmployers && metro.localInfo.majorEmployers.length > 0 && (
              <p>
                Many {metro.city} employers, including {metro.localInfo.majorEmployers.slice(0, 2).join(' and ')},
                offer corporate wellness programs that include mobile phlebotomy services for employee health screenings
                and preventive care.
              </p>
            )}

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              Zip Codes Served in {metro.city}
            </h3>
            <p className="text-sm">
              Mobile phlebotomy services are available in all {metro.city} zip codes including: {metro.zipCodes.join(', ')},
              and surrounding areas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}