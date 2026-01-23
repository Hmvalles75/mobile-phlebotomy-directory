'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BreadcrumbNav } from '@/components/seo/BreadcrumbSchema'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'
import { getProviderBadge, isProviderRegistered } from '@/lib/provider-tiers'
import { getMetrosByState } from '@/data/top-metros'
import { SimpleAccordion } from '@/components/ui/Accordion'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { SITE_URL } from '@/lib/seo'
import { ListingTierBadge } from '@/components/ui/ListingTierBadge'

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

export { stateData }

interface StatePageClientProps {
  stateSlug: string
}

export default function StatePageClient({ stateSlug }: StatePageClientProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [showLeadForm, setShowLeadForm] = useState(false)

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

  // Available services
  const availableServices = ['At-Home Blood Draw', 'Specimen Pickup', 'Lab Partner']

  // Filter providers
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = !searchQuery ||
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.address?.city?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesServices = selectedServices.length === 0 ||
      selectedServices.some(service => provider.services.includes(service as any))

    const matchesRating = !minRating ||
      (provider.rating && provider.rating >= minRating)

    return matchesSearch && matchesServices && matchesRating
  })

  // Categorize and sort providers by monetization tier
  const categorizedProviders = {
    featured: [] as Provider[],
    premium: [] as Provider[],
    basic: [] as Provider[]
  }

  filteredProviders.forEach(provider => {
    // @ts-ignore - listingTier exists in database but may not be in type yet
    const tier = provider.listingTier || 'BASIC'
    // @ts-ignore - isFeaturedCity exists in database
    const isFeaturedCity = provider.isFeaturedCity || false
    // @ts-ignore - isFeatured exists in database (pilot - visibility only)
    const isFeatured = provider.isFeatured || false

    if (tier === 'FEATURED' || isFeaturedCity || isFeatured) {
      categorizedProviders.featured.push(provider)
    } else if (tier === 'PREMIUM') {
      categorizedProviders.premium.push(provider)
    } else {
      categorizedProviders.basic.push(provider)
    }
  })

  // Sort all sections alphabetically
  categorizedProviders.featured.sort((a, b) => a.name.localeCompare(b.name))
  categorizedProviders.premium.sort((a, b) => a.name.localeCompare(b.name))
  categorizedProviders.basic.sort((a, b) => a.name.localeCompare(b.name))

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

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
            "url": `${SITE_URL}/us/${stateSlug}`,
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

      {/* Backlink to National Guide */}
      <div className="bg-gradient-to-r from-primary-50 to-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Link
            href="/mobile-phlebotomy-near-me"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 hover:underline"
          >
            ← Back to the national mobile phlebotomy guide
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Lead Form CTA */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Get Matched with a Mobile Phlebotomist in {stateName}
            </h2>
            <p className="text-gray-700 mb-6 text-lg">
              Tell us your location and needs – we&apos;ll connect you with qualified providers in your area.
            </p>
            <button
              onClick={() => setShowLeadForm(true)}
              className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
            >
              Match me with a mobile phlebotomist in {stateName}
            </button>
          </div>
        </div>

        {/* SEO Content - Summary + Accordion */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              Mobile phlebotomists come directly to your home, office, or care facility in {stateName} to collect lab samples. Instead of driving to a draw site and waiting in line, a licensed phlebotomist meets you where you are and delivers your samples to the lab.
            </p>
            <p className="text-gray-700 leading-relaxed">
              MobilePhlebotomy.org is a directory of publicly listed mobile phlebotomy providers. Some providers on this page are verified, others are not. Always confirm details directly with the provider before scheduling a visit.
            </p>
          </div>

          <SimpleAccordion
            summary={`Read the full guide to mobile phlebotomy in ${stateName}`}
            defaultOpen={false}
          >
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                How mobile blood draws work in {stateName}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                In most parts of the United States, including {stateName}, a mobile phlebotomist can collect blood, urine, or other specimens at home and transport them to a national or local lab. Many providers partner with major labs, while others work with functional medicine practices or independent laboratories.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Appointments are scheduled in a set time window at your home or workplace.</li>
                <li>The phlebotomist verifies your identity and lab order, then collects the samples.</li>
                <li>Samples are labeled and taken to a partner lab for testing.</li>
                <li>Results are sent back to your ordering provider or the lab portal, not to MobilePhlebotomy.org.</li>
              </ul>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Typical mobile phlebotomy pricing in {stateName}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Pricing is set by each provider, but most mobile blood draw services in the U.S. charge a separate convenience fee for the home visit. Nationally, mobile phlebotomy visits often range from about <strong className="text-gray-900">$70 to $150 or more per visit</strong>, depending on travel distance, urgency, and the number of patients seen at the same address.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Large national lab services sometimes advertise flat in-home collection fees around <strong className="text-gray-900">$75–$80</strong> as an add-on to your lab test. Smaller independent services in {stateName} may charge more or less based on mileage, after-hours requests, or special handling.
              </p>
              <p className="text-sm text-gray-600 italic">
                The prices above are general estimates, not quotes. Always confirm the exact fee, what is included, and any cancellation policy directly with the provider before you book.
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Insurance coverage for mobile blood draws in {stateName}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Insurance coverage for mobile phlebotomy depends on your health plan, the lab that processes your samples, and whether the testing is medically necessary. In many cases, when a licensed healthcare provider orders your labs, the laboratory testing itself can be billed to insurance, while the <em>mobile visit fee</em> is paid out of pocket as a convenience charge.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You almost always need a valid lab order from a doctor, nurse practitioner, or other approved provider.</li>
                <li>Some plans and Medicare programs may cover home draws for homebound or high-risk patients in {stateName}.</li>
                <li>Many independent mobile services are self-pay only for the visit fee, even if the lab accepts your insurance.</li>
              </ul>
              <p className="text-sm text-gray-600 italic">
                Always call your insurance and the lab listed on your order to confirm coverage, copays, and any home-draw rules before scheduling.
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Who mobile phlebotomy helps in {stateName}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Mobile phlebotomy is especially helpful for patients in {stateName} who have trouble getting to a lab, are immunocompromised, have tight work schedules, or simply prefer the convenience of an at-home draw. It is also commonly used for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Homebound or post-surgery patients</li>
                <li>Parents scheduling labs for children at home</li>
                <li>Busy professionals who cannot leave work for a lab visit</li>
                <li>Senior living communities and long-term care facilities</li>
                <li>Wellness, hormone, or functional medicine testing</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Use the providers listed below to find a mobile phlebotomist serving {stateName}, or submit the request form to have available providers review your case and contact you directly.
              </p>
            </section>

            {/* NEW YORK SPECIAL: Featured NYC Metro Section */}
            {stateAbbr === 'NY' && (
              <section className="mt-6 mb-8">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg shadow-md p-6 border-2 border-primary-200">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🏙️</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">New York City Metro Area</h2>
                        <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full font-medium">NOW SERVING</span>
                      </div>
                      <p className="text-gray-700 mb-4">
                        Mobile phlebotomy services across all five NYC boroughs and Northern New Jersey
                      </p>

                      {/* NYC Hub */}
                      <div className="mb-4">
                        <Link
                          href="/new-york-ny/mobile-phlebotomy"
                          className="block p-5 bg-gradient-to-br from-primary-100 to-white rounded-lg hover:from-primary-200 hover:shadow-lg border-2 border-primary-400 transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🗽</span>
                            <span className="font-bold text-gray-900 text-xl">New York City Mobile Phlebotomy</span>
                          </div>
                          <div className="text-sm text-primary-700 group-hover:text-primary-800 font-medium">View all NYC providers & boroughs →</div>
                        </Link>
                      </div>

                      {/* Five Boroughs */}
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">NYC Boroughs</h3>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <Link
                            href="/manhattan-ny/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Manhattan</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/brooklyn-ny/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Brooklyn</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/queens-ny/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Queens</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/bronx-ny/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Bronx</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/staten-island-ny/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Staten Island</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                        </div>
                      </div>

                      {/* Northern NJ */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Northern New Jersey</h3>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <Link
                            href="/newark-nj/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Newark, NJ</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/jersey-city-nj/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Jersey City, NJ</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/bayonne-nj/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Bayonne, NJ</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* CALIFORNIA SPECIAL: Featured LA Metro Section */}
            {stateAbbr === 'CA' && (
              <section className="mt-6 mb-8">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg shadow-md p-6 border-2 border-primary-200">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🌴</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">Los Angeles Metro Area</h2>
                        <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full font-medium">NOW SERVING</span>
                      </div>
                      <p className="text-gray-700 mb-4">
                        Mobile phlebotomy services throughout Greater Los Angeles and surrounding communities
                      </p>

                      {/* LA Hub */}
                      <div className="mb-4">
                        <Link
                          href="/los-angeles-ca/mobile-phlebotomy"
                          className="block p-5 bg-gradient-to-br from-primary-100 to-white rounded-lg hover:from-primary-200 hover:shadow-lg border-2 border-primary-400 transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🌟</span>
                            <span className="font-bold text-gray-900 text-xl">Los Angeles Mobile Phlebotomy</span>
                          </div>
                          <div className="text-sm text-primary-700 group-hover:text-primary-800 font-medium">View all LA providers & suburbs →</div>
                        </Link>
                      </div>

                      {/* LA Suburbs */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Greater Los Angeles</h3>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <Link
                            href="/pasadena-ca/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Pasadena</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/santa-monica-ca/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Santa Monica</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/burbank-ca/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Burbank</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/glendale-ca/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Glendale</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/long-beach-ca/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Long Beach</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/torrance-ca/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Torrance</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/west-hollywood-ca/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">West Hollywood</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/beverly-hills-ca/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Beverly Hills</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* MICHIGAN SPECIAL: Featured Detroit Metro Section */}
            {stateAbbr === 'MI' && (
              <section className="mt-6 mb-8">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg shadow-md p-6 border-2 border-primary-200">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🏙️</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">Detroit Metro Area</h2>
                        <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full font-medium">NOW SERVING</span>
                      </div>
                      <p className="text-gray-700 mb-4">
                        Mobile phlebotomy services in Detroit and surrounding metro areas
                      </p>

                      {/* Detroit Hub */}
                      <div className="mb-4">
                        <Link
                          href="/detroit-mi/mobile-phlebotomy"
                          className="block p-5 bg-gradient-to-br from-primary-100 to-white rounded-lg hover:from-primary-200 hover:shadow-lg border-2 border-primary-400 transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🚗</span>
                            <span className="font-bold text-gray-900 text-xl">Detroit Mobile Phlebotomy</span>
                          </div>
                          <div className="text-sm text-primary-700 group-hover:text-primary-800 font-medium">View all Detroit providers & suburbs →</div>
                        </Link>
                      </div>

                      {/* Detroit Suburbs */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Metro Detroit</h3>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <Link
                            href="/dearborn-mi/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Dearborn</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/livonia-mi/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Livonia</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/troy-mi/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Troy</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/southfield-mi/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Southfield</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                          <Link
                            href="/warren-mi/mobile-phlebotomy"
                            className="block p-4 bg-white rounded-lg hover:bg-primary-50 hover:shadow-md border border-gray-200 hover:border-primary-300 transition-all group"
                          >
                            <div className="font-bold text-gray-900 mb-1">Warren</div>
                            <div className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Major Cities in State - Internal Linking */}
            {(() => {
              const metros = getMetrosByState(stateAbbr)
              if (metros.length > 0) {
                return (
                  <section className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Major cities we serve in {stateName}
                    </h2>
                    <p className="text-gray-700 mb-6">
                      Find mobile phlebotomy providers in these {stateName} metro areas:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {metros.map((metro) => (
                        <Link
                          key={metro.slug}
                          href={`/us/metro/${metro.slug}`}
                          className="flex items-center px-4 py-3 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors group"
                        >
                          <span className="text-primary-600 mr-2 group-hover:text-primary-700">→</span>
                          <span className="text-gray-900 font-medium group-hover:text-primary-700">
                            {metro.city}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )
              }
              return null
            })()}
          </SimpleAccordion>
        </div>

        {/* Featured Providers - Top of Page */}
        {!loading && categorizedProviders.featured.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-lg border-2 border-amber-300">
              <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 p-4 border-b border-amber-200">
                <div className="flex items-center mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    Featured Providers in {stateName}
                  </h2>
                </div>
                <p className="text-gray-700 font-medium">
                  Premium providers with verified credentials and enhanced visibility
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {categorizedProviders.featured.map((provider) => {
                  const isVerified = isProviderRegistered(provider.id)

                  return (
                  <div key={provider.id} className={`p-5 bg-gradient-to-r from-amber-50/40 to-transparent hover:from-amber-50/60 transition-all ${isVerified ? 'border-l-4 border-l-green-500' : ''}`}>
                    {/* Provider Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                      {/* Logo */}
                      {provider.logo && (
                        <div className="flex-shrink-0 mr-6">
                          <Image
                            src={provider.logo}
                            alt={`${provider.name} logo`}
                            width={80}
                            height={80}
                            className="rounded-lg shadow-md object-contain bg-white p-2"
                          />
                        </div>
                      )}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-2xl font-bold text-gray-900">
                            {provider.name}
                          </h3>
                          {/* Featured Badge */}
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md">
                            ⭐ Featured Provider
                          </span>
                        </div>

                        {/* Badges Row */}
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          {(provider as any).is_nationwide === 'Yes' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
                              🌎 Nationwide Service
                            </span>
                          )}
                          {isVerified && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                              ✓ Platform Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {provider.description && (
                      <div className="mb-4 p-3 bg-white/60 rounded-lg border border-gray-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {provider.description}
                        </p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {/* Left Column - Contact & Coverage */}
                      <div className="space-y-4">
                        {/* Contact Information */}
                        <div className="bg-white/60 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Contact Information</h4>
                          <div className="space-y-2 text-sm">
                            {provider.phone && (
                              <div className="flex items-center gap-2">
                                <span className="text-primary-600">📞</span>
                                <span className="font-medium text-gray-900">{provider.phone}</span>
                              </div>
                            )}
                            {provider.address?.city && (
                              <div className="flex items-center gap-2">
                                <span className="text-primary-600">📍</span>
                                <span className="text-gray-700">Based in {provider.address.city}, {provider.address.state}</span>
                              </div>
                            )}
                            {provider.website && (
                              <div className="flex items-center gap-2">
                                <span className="text-primary-600">🌐</span>
                                <a
                                  href={provider.website}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="text-primary-600 hover:text-primary-700 font-medium underline"
                                >
                                  Visit Website
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Coverage Area */}
                        <div className="bg-white/60 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Service Coverage</h4>
                          <p className="text-gray-700 text-sm">
                            {formatCoverageDisplay(provider.coverage)}
                          </p>
                        </div>

                        {/* Rating */}
                        {provider.rating && (
                          <div className="bg-white/60 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Rating</h4>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                <span className="text-yellow-400 text-xl">★</span>
                                <span className="text-xl font-bold text-gray-900 ml-1">
                                  {provider.rating}
                                </span>
                              </div>
                              {provider.reviewsCount && (
                                <span className="text-sm text-gray-600">
                                  ({provider.reviewsCount} reviews)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Services */}
                      <div className="space-y-4">
                        {/* Profile Image */}
                        {provider.profileImage && (
                          <div className="bg-white/60 p-4 rounded-lg border border-gray-200">
                            <Image
                              src={provider.profileImage}
                              alt={`${provider.name} office`}
                              width={400}
                              height={300}
                              className="rounded-lg w-full h-auto object-cover"
                            />
                          </div>
                        )}
                        <div className="bg-white/60 p-4 rounded-lg border border-gray-200 h-full">
                          <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Services Offered</h4>
                          <div className="flex flex-wrap gap-2">
                            {provider.services.map((service) => (
                              <span
                                key={service}
                                className="bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 text-xs font-medium px-3 py-1.5 rounded-full border border-primary-300"
                              >
                                {service}
                              </span>
                            ))}
                        </div>
                          </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-gray-200">
                      <ProviderActions
                        provider={provider}
                        currentLocation={stateName}
                        className="justify-start"
                      />
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content - Provider Listings */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  All Mobile Phlebotomy Providers in {stateName}
                </h2>
                <p className="text-gray-600 mt-2">
                  {loading ? 'Loading providers...' : `${filteredProviders.length} of ${providers.length} providers shown`}
                </p>

                {/* Search and Filters */}
                <div className="mt-6 space-y-4">
                  {/* Search Bar */}
                  <div>
                    <input
                      type="text"
                      placeholder="Search by name, city, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>

                  {/* Service Filters */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Filter by Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {availableServices.map(service => (
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

                  {/* Rating Filter */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Minimum Rating:</p>
                    <div className="flex gap-2">
                      {[null, 3, 4, 4.5].map(rating => (
                        <button
                          key={rating || 'all'}
                          onClick={() => setMinRating(rating)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            minRating === rating
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {rating ? `${rating}+ ⭐` : 'All'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">⏳</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading providers...</h3>
                  <p className="text-gray-600">Please wait while we load providers in {stateName}.</p>
                </div>
              ) : filteredProviders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {providers.length === 0 ? `No providers found in ${stateName}` : 'No matching providers found'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {providers.length === 0 ? (
                      <>We&apos;re working to expand our network to {stateName}. Check back soon or search in nearby states.</>
                    ) : (
                      'Try adjusting your filters or search terms'
                    )}
                  </p>
                  {providers.length > 0 && (selectedServices.length > 0 || minRating || searchQuery) ? (
                    <button
                      onClick={() => {
                        setSelectedServices([])
                        setMinRating(null)
                        setSearchQuery('')
                      }}
                      className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  ) : (
                    <Link
                      href="/#browse-by-state"
                      className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Browse Other States
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Premium Providers Section */}
                  {categorizedProviders.premium.length > 0 && (
                    <div className="border-b border-gray-200">
                      <div className="bg-primary-50 p-6 border-b border-primary-100">
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-primary-600">★</span>
                          Premium Providers
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          Enhanced listings with verified credentials in {stateName}
                        </p>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {categorizedProviders.premium.map((provider) => {
                          const isVerified = isProviderRegistered(provider.id)

                          return (
                          <div key={provider.id} className={`p-6 ${isVerified ? 'border-l-4 border-l-green-500' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="text-xl font-semibold text-gray-900">
                                    {provider.name}
                                  </h3>
                                  {/* Nationwide/Multi-State Badge */}
                                  {(provider as any).is_nationwide === 'Yes' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                      🌎 Nationwide Service
                                    </span>
                                  )}
                                  {/* Monetization Tier Badge */}
                                  <ListingTierBadge
                                    tier={(provider as any).listingTier || 'BASIC'}
                                    isFeaturedCity={(provider as any).isFeaturedCity || false}
                                    isFeatured={(provider as any).isFeatured || false}
                                  />
                                </div>
                          {provider.description && (
                            <p className="text-gray-600 mb-3">
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
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <ProviderActions
                        provider={provider}
                        currentLocation={stateName}
                        className="justify-start"
                      />
                    </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Basic Listings Section */}
            {categorizedProviders.basic.length > 0 && (
              <div>
                <div className="bg-gray-50 p-6 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900">
                    All Providers
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Licensed mobile phlebotomy providers in {stateName}
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {categorizedProviders.basic.map((provider) => {
                    const isVerified = isProviderRegistered(provider.id)

                    return (
                    <div key={provider.id} className={`p-6 ${isVerified ? 'border-l-4 border-l-green-500' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {provider.name}
                            </h3>
                            {/* Nationwide/Multi-State Badge */}
                            {(provider as any).is_nationwide === 'Yes' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                🌎 Nationwide Service
                              </span>
                            )}
                            {/* Monetization Tier Badge */}
                            <ListingTierBadge
                              tier={(provider as any).listingTier || 'BASIC'}
                              isFeaturedCity={(provider as any).isFeaturedCity || false}
                              isFeatured={(provider as any).isFeatured || false}
                            />
                          </div>

                          {provider.description && (
                            <p className="text-gray-600 mb-3 text-sm">
                              {provider.description}
                            </p>
                          )}

                          {/* Services - Compact */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {provider.services.slice(0, 2).map((service) => (
                              <span
                                key={service}
                                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                              >
                                {service}
                              </span>
                            ))}
                            {provider.services.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{provider.services.length - 2} more
                              </span>
                            )}
                          </div>

                          {/* Contact Info - Compact */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {provider.phone && (
                              <span>📞 {provider.phone}</span>
                            )}
                            {provider.address?.city && (
                              <span>📍 {provider.address.city}, {provider.address.state}</span>
                            )}
                            {provider.rating && (
                              <span>⭐ {provider.rating}</span>
                            )}
                            {provider.website && (
                              <span>
                                🌐{' '}
                                <a
                                  href={provider.website}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                  className="text-gray-600 hover:text-primary-600 underline text-xs"
                                >
                                  Website
                                </a>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Compact */}
                      <ProviderActions
                        provider={provider}
                        currentLocation={stateName}
                        className="justify-start"
                      />
                    </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">Popular States</h3>
                <div className="space-y-2">
                  <Link href="/us/california" className="block text-primary-600 hover:text-primary-700 text-sm">
                    California →
                  </Link>
                  <Link href="/us/texas" className="block text-primary-600 hover:text-primary-700 text-sm">
                    Texas →
                  </Link>
                  <Link href="/us/florida" className="block text-primary-600 hover:text-primary-700 text-sm">
                    Florida →
                  </Link>
                  <Link href="/us/new-york" className="block text-primary-600 hover:text-primary-700 text-sm">
                    New York →
                  </Link>
                  <Link href="/us/pennsylvania" className="block text-primary-600 hover:text-primary-700 text-sm">
                    Pennsylvania →
                  </Link>
                  <Link href="/us/illinois" className="block text-primary-600 hover:text-primary-700 text-sm">
                    Illinois →
                  </Link>
                  <Link href="/us/ohio" className="block text-primary-600 hover:text-primary-700 text-sm">
                    Ohio →
                  </Link>
                  <Link href="/us/georgia" className="block text-primary-600 hover:text-primary-700 text-sm">
                    Georgia →
                  </Link>
                  <Link href="/us/north-carolina" className="block text-primary-600 hover:text-primary-700 text-sm">
                    North Carolina →
                  </Link>
                  <Link href="/us/michigan" className="block text-primary-600 hover:text-primary-700 text-sm">
                    Michigan →
                  </Link>
                  <Link href="/#browse-by-state" className="block text-gray-600 hover:text-primary-600 font-medium text-sm mt-3 pt-3 border-t">
                    View All 50 States →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Corporate Services CTA */}
        <div className="mt-12 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-8 md:p-10 border border-primary-200">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-block bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
                B2B Services
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Need phlebotomists for a corporate event or health fair?
              </h3>
              <p className="text-gray-700 text-lg mb-4">
                We provide nationwide staffing for conferences, wellness programs, clinical studies,
                and on-site employee screenings. From 1 to 50+ certified phlebotomists.
              </p>
              <Link
                href="/corporate-phlebotomy"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-lg"
              >
                Learn more →
              </Link>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/corporate-phlebotomy"
                className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                Request Staffing Quote
              </Link>
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
              Whether you&apos;re in a major metropolitan area or a smaller community, you can find
              qualified mobile phlebotomy professionals who offer flexible scheduling, competitive
              pricing, and professional service. Many providers accept insurance and offer same-day
              or next-day appointments.
            </p>
          </div>
        </div>
      </div>

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        defaultState={stateAbbr}
      />
    </div>
  )
}
