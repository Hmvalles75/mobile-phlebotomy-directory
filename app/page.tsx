'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AutocompleteSearchBar } from '@/components/ui/AutocompleteSearchBar'
import { Tag } from '@/components/ui/Tag'
import { Badge } from '@/components/ui/Badge'
import { type Provider } from '@/lib/schemas'
import { topMetroAreas, getMetroBySlug } from '@/data/top-metros'
import { handleCityNameSearch, handleStateNameSearch } from '@/lib/zip-geocoding'
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA'
import { ga4 } from '@/lib/ga4'
import { ZipCodeLeadForm } from '@/components/ZipCodeLeadForm'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import {
  MARKET_CONFIG,
  isMarketLocked,
  getMarketMetroPath,
  getMarketRequestPath
} from '@/lib/config/market'

// When market is locked, prioritize that metro in the featured list
const featuredMetros = (() => {
  const metros = topMetroAreas.slice(0, 12)
  if (isMarketLocked()) {
    // Move locked market to front if it exists in list
    const lockedMetro = getMetroBySlug(MARKET_CONFIG.MARKET_SLUG)
    if (lockedMetro) {
      const filtered = metros.filter(m => m.slug !== MARKET_CONFIG.MARKET_SLUG)
      return [lockedMetro, ...filtered.slice(0, 11)]
    }
  }
  return metros
})()

const topServices = [
  'At-Home Blood Draw',
  'Corporate Wellness',
  'Fertility/IVF',
  'Pediatric',
  'Geriatric',
  'Specimen Pickup'
]

const trustBadges = [
  'Licensed & Certified',
  'HIPAA Compliant',
  'Insured Providers',
  'Background Checked'
]

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [providerCounts, setProviderCounts] = useState<Record<string, number>>({})
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  const handleSearch = (query: string) => {
    if (!query.trim()) return

    // Try to route to city page if it's a city query (e.g., "San Diego, CA")
    const cityRouting = handleCityNameSearch(query.trim())
    if (cityRouting) {
      window.location.href = cityRouting.route
      return
    }

    // Try to route to state page if it's a state query (e.g., "Pennsylvania" or "PA")
    const stateRouting = handleStateNameSearch(query.trim())
    if (stateRouting) {
      window.location.href = stateRouting.route
      return
    }

    // Fall back to search page
    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
  }

  useEffect(() => {
    async function fetchProviderCounts() {
      try {
        // State abbreviation to full name mapping
        const stateMap: Record<string, string> = {
          'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
          'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
          'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
          'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
          'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
          'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
          'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
          'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
          'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
          'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
          'DC': 'District of Columbia'
        }

        // Get provider counts for each metro area
        const counts: Record<string, number> = {}

        // Get all providers to count by metro area
        const response = await fetch('/api/providers?limit=200')
        if (response.ok) {
          const allProviders = await response.json()

          // Count providers for each featured metro area
          featuredMetros.forEach(metro => {
            const fullStateName = stateMap[metro.stateAbbr] || metro.state

            counts[metro.slug] = allProviders.filter((provider: Provider) => {
              // Check if provider serves this city
              const cityMatch = provider.coverage?.cities?.some((city: string) =>
                city.toLowerCase().includes(metro.city.toLowerCase())
              ) || provider.address?.city?.toLowerCase() === metro.city.toLowerCase()

              // Check if provider serves this state (compare full state names)
              const stateMatch = provider.coverage?.states?.some((state: string) =>
                state.toLowerCase() === fullStateName.toLowerCase() ||
                state.toLowerCase() === metro.stateAbbr.toLowerCase()
              ) || provider.address?.state?.toLowerCase() === fullStateName.toLowerCase()

              return cityMatch || stateMatch
            }).length
          })

          setProviderCounts(counts)
        }
      } catch (error) {
        console.error('Failed to fetch provider counts:', error)
      }
    }

    fetchProviderCounts()
  }, [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MobilePhlebotomy.org',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org',
    description: 'Find certified mobile phlebotomy services near you. Professional at-home blood draws, lab collections, and mobile health services nationwide.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does mobile phlebotomy work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mobile phlebotomy brings professional blood draw services directly to your location. A certified phlebotomist travels to your home, office, or preferred location with all necessary equipment. They collect your blood samples safely and transport them to the laboratory for testing. Results are typically available within 24-48 hours.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is mobile phlebotomy covered by insurance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Many mobile phlebotomy services accept major insurance plans including Medicare, Medicaid, and private insurance. Coverage varies by provider and your specific plan. Most providers also accept HSA/FSA payments and offer competitive cash rates. Contact your chosen provider to verify coverage before scheduling.'
        }
      },
      {
        '@type': 'Question',
        name: 'What types of blood tests can be done at home?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most routine blood tests can be performed through mobile phlebotomy including: complete blood count (CBC), metabolic panels, lipid panels, thyroid tests, diabetes monitoring (A1C), vitamin levels, hormone testing, and many specialized tests. Your healthcare provider will specify which tests you need.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much does mobile phlebotomy cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Costs vary by location and provider, but most mobile phlebotomy services charge a separate convenience fee for the at-home visit. Typical collection fees range from about $60–150 per visit, depending on your area, appointment time, and how complex the tests are. Laboratory processing fees are usually billed separately by the lab.'
        }
      },
      {
        '@type': 'Question',
        name: 'Are mobile phlebotomists licensed and certified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all professional mobile phlebotomists must be licensed and certified. They complete specialized training programs and maintain current certifications through organizations like ASCP, NCA, or AMT. Our directory only includes verified, insured professionals who meet strict safety and quality standards.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I prepare for an at-home blood draw?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Preparation depends on your specific tests. Some require fasting (no food or drink except water) for 8-12 hours. Drink plenty of water unless instructed otherwise. Wear loose-fitting sleeves for easy access. Your provider will give you specific instructions when you schedule your appointment.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is at-home blood collection safe and sterile?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely. Mobile phlebotomists follow the same strict safety protocols as hospitals and clinics. They use sterile, single-use equipment and follow proper infection control procedures. All waste is disposed of safely according to medical regulations.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I get same-day blood draw service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Many mobile phlebotomy providers offer same-day and next-day appointments, especially in major metropolitan areas. Emergency services may be available for urgent medical needs. Scheduling depends on provider availability and your location. Contact providers directly for fastest service.'
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      {/* HERO SECTION - Market-locked vs National */}
      {isMarketLocked() ? (
        /* LA CONVERSION LANDING PAGE - Above the fold */
        <div
          className="relative bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-bg.jpg')"
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>

          <div className="relative container py-20 lg:py-32">
            <div className="text-center max-w-2xl mx-auto">
              {/* H1 */}
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Mobile Phlebotomy in Los Angeles
              </h1>

              {/* Subhead */}
              <p className="text-xl lg:text-2xl text-white mb-4">
                Same-day in-home blood draws. We come to you.
              </p>

              {/* Trust line */}
              <p className="text-white/90 text-sm mb-8">
                Certified mobile phlebotomists serving Los Angeles County · Most patients contacted within 10–15 minutes
              </p>

              {/* ZIP input + primary CTA */}
              <div className="mb-6">
                <ZipCodeLeadForm />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* NATIONAL DIRECTORY HERO */
        <div
          className="relative bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-bg.jpg')"
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>

          <div className="relative container py-16 lg:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Professional <span className="text-primary-400">Mobile Phlebotomy & At-Home Blood Draws</span> Nationwide
              </h1>
              <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
                Skip the clinic. Licensed phlebotomists come to you for safe, convenient blood collection. Get matched with a certified provider in your area today.
              </p>

              {/* ZIP Code Lead Segmentation Form */}
              <div className="mb-8">
                <ZipCodeLeadForm />
              </div>

              {/* Compliance disclaimer */}
              <div className="text-white/80 text-xs max-w-2xl mx-auto mb-6 leading-relaxed">
                MobilePhlebotomy.org is a directory of publicly listed mobile phlebotomy services.
                Providers marked as Verified have confirmed service availability and licensing.
              </div>

              {/* Or browse providers */}
              <div className="text-white/90 text-sm mb-4">or browse our provider directory:</div>

              <AutocompleteSearchBar
                onSearch={handleSearch}
                placeholder="Enter your ZIP code or city..."
                className="mb-6"
                enableZipCodeRouting={true}
              />

              {/* Link to comprehensive guide */}
              <div className="mb-4">
                <Link
                  href="/mobile-phlebotomy-near-me"
                  className="text-white/90 hover:text-white text-sm underline hover:no-underline transition-all"
                >
                  Learn more about mobile phlebotomy near you →
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {topServices.map((service) => (
                  <Link
                    key={service}
                    // @ts-ignore - Next.js typedRoutes compatibility
                    href={`/search?services=${encodeURIComponent(service)}`}
                    className="inline-block"
                  >
                    <Tag variant="primary" className="hover:bg-primary-200 transition-colors cursor-pointer">
                      {service}
                    </Tag>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Trust Section - Simplified for LA */}
      {isMarketLocked() ? (
        <section className="py-6 bg-white border-b border-gray-100">
          <div className="container">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <span>✅ Licensed & Insured</span>
              <span>🏥 Lab drop-off included</span>
              <span>⏱️ Same-day available</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-sm md:text-base">
                <span className="text-green-600 text-xl">✅</span>
                <span className="text-gray-700 font-medium">Licensed professionals</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm md:text-base">
                <span className="text-blue-600 text-xl">🏥</span>
                <span className="text-gray-700 font-medium">Insurance-friendly providers available</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm md:text-base">
                <span className="text-purple-600 text-xl">🏠</span>
                <span className="text-gray-700 font-medium">Homebound patients welcome</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm md:text-base">
                <span className="text-orange-600 text-xl">⏱️</span>
                <span className="text-gray-700 font-medium">No waiting rooms</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section - Show for both, but simplified CTA for LA */}
      <section className="py-16 bg-gray-50" id="how-it-works">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get matched with a certified mobile phlebotomist in 3 simple steps.
              Safe, convenient, and professional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center bg-white rounded-lg p-6 shadow-sm">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Request Service</h3>
              <p className="text-gray-600">
                Submit your request online or call us. Tell us your location and when you need service.
                We&apos;ll match you with a qualified provider instantly.
              </p>
            </div>

            <div className="text-center bg-white rounded-lg p-6 shadow-sm">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Matched</h3>
              <p className="text-gray-600">
                We connect you with a licensed, insured phlebotomist in your area.
                Same-day and next-day appointments available.
              </p>
            </div>

            <div className="text-center bg-white rounded-lg p-6 shadow-sm">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">At-Home Collection</h3>
              <p className="text-gray-600">
                Your phlebotomist arrives with all equipment for safe, sterile blood collection.
                Results typically available within 24-48 hours.
              </p>
            </div>
          </div>

          {/* CTA - for national, show lead form button */}
          <div className="text-center">
            {!isMarketLocked() && (
              <>
                <button
                  onClick={() => {
                    ga4.leadCtaClick({ placement: 'hero' })
                    setLeadFormOpen(true)
                  }}
                  className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  Request a Mobile Blood Draw
                </button>
                <p className="text-gray-600 text-sm mt-3">
                  🏥 Licensed & insured professionals · Same-day appointments available
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Corporate Services Section - Hide when market locked */}
      {!isMarketLocked() && (
      <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-white">
                <div className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                  B2B Services
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Corporate & Event Phlebotomy Staffing
                </h2>
                <p className="text-lg text-primary-50 mb-6 leading-relaxed">
                  Professional phlebotomists for conferences, health fairs, wellness programs,
                  and clinical studies. From 1 to 50+ certified technicians, we handle the logistics
                  so you can focus on your event.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-green-300 mt-1">✓</span>
                    <span className="text-primary-50">Nationwide event coverage in major metros</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-300 mt-1">✓</span>
                    <span className="text-primary-50">Certified, background-checked technicians</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-300 mt-1">✓</span>
                    <span className="text-primary-50">Full specimen handling & shipping support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-300 mt-1">✓</span>
                    <span className="text-primary-50">HIPAA-compliant workflows</span>
                  </li>
                </ul>
                <Link
                  href="/corporate-phlebotomy"
                  className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-lg hover:bg-primary-50 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  Learn More
                  <span>→</span>
                </Link>
              </div>

              {/* Right: Visual Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <h3 className="text-white text-xl font-bold mb-6">Perfect for:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">🏢</div>
                    <p className="text-white text-sm font-medium">Corporate Wellness</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">🎤</div>
                    <p className="text-white text-sm font-medium">Conferences</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">🔬</div>
                    <p className="text-white text-sm font-medium">Clinical Studies</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">🏥</div>
                    <p className="text-white text-sm font-medium">Health Fairs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Popular States Section - SEO Internal Linking - Hide when market locked */}
      {!isMarketLocked() && (
      <section className="py-16 bg-white border-y">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Find Mobile Phlebotomy in Your State
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Licensed mobile phlebotomists available nationwide. Browse providers by state to find at-home blood draw services near you.
            </p>
          </div>

          {/* Priority State Links */}
          <div className="max-w-4xl mx-auto mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Popular States:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/us/indiana"
                className="flex items-center justify-center px-6 py-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors group border border-primary-200"
              >
                <span className="text-primary-700 font-semibold group-hover:text-primary-800">Indiana</span>
              </Link>
              <Link
                href="/us/montana"
                className="flex items-center justify-center px-6 py-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors group border border-primary-200"
              >
                <span className="text-primary-700 font-semibold group-hover:text-primary-800">Montana</span>
              </Link>
              <Link
                href="/us/iowa"
                className="flex items-center justify-center px-6 py-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors group border border-primary-200"
              >
                <span className="text-primary-700 font-semibold group-hover:text-primary-800">Iowa</span>
              </Link>
              <Link
                href="/us/ohio"
                className="flex items-center justify-center px-6 py-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors group border border-primary-200"
              >
                <span className="text-primary-700 font-semibold group-hover:text-primary-800">Ohio</span>
              </Link>
            </div>
          </div>

          {/* All States Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {Object.entries({
                'Alabama': 'alabama', 'Alaska': 'alaska', 'Arizona': 'arizona', 'Arkansas': 'arkansas',
                'California': 'california', 'Colorado': 'colorado', 'Connecticut': 'connecticut', 'Delaware': 'delaware',
                'Florida': 'florida', 'Georgia': 'georgia', 'Hawaii': 'hawaii', 'Idaho': 'idaho',
                'Illinois': 'illinois', 'Kansas': 'kansas', 'Kentucky': 'kentucky', 'Louisiana': 'louisiana',
                'Maine': 'maine', 'Maryland': 'maryland', 'Massachusetts': 'massachusetts', 'Michigan': 'michigan',
                'Minnesota': 'minnesota', 'Mississippi': 'mississippi', 'Missouri': 'missouri', 'Nebraska': 'nebraska',
                'Nevada': 'nevada', 'New Hampshire': 'new-hampshire', 'New Jersey': 'new-jersey', 'New Mexico': 'new-mexico',
                'New York': 'new-york', 'North Carolina': 'north-carolina', 'North Dakota': 'north-dakota', 'Oklahoma': 'oklahoma',
                'Oregon': 'oregon', 'Pennsylvania': 'pennsylvania', 'Rhode Island': 'rhode-island', 'South Carolina': 'south-carolina',
                'South Dakota': 'south-dakota', 'Tennessee': 'tennessee', 'Texas': 'texas', 'Utah': 'utah',
                'Vermont': 'vermont', 'Virginia': 'virginia', 'Washington': 'washington', 'West Virginia': 'west-virginia',
                'Wisconsin': 'wisconsin', 'Wyoming': 'wyoming'
              }).map(([name, slug]) => (
                <Link
                  key={slug}
                  href={`/us/${slug}`}
                  className="text-primary-600 hover:text-primary-700 hover:underline text-sm py-2 px-3 hover:bg-gray-50 rounded transition-colors"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Top Metro Areas Section - Hide when market locked */}
      {!isMarketLocked() && (
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Top Metro Areas We Serve
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional mobile phlebotomy services available in major metropolitan areas nationwide
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
            {featuredMetros.map((metro) => (
              <Link
                key={metro.slug}
                href={`/us/metro/${metro.slug}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {metro.city}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {metro.state} • {providerCounts[metro.slug] || 0} provider{providerCounts[metro.slug] !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-primary-600 group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>💰 {metro.localInfo?.avgCost || '$60-120'}</div>
                  <div>⏱️ {metro.localInfo?.typicalWaitTime || '24-48 hrs'}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/metros"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              View All 50 Metro Areas
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* All Providers Directory Section - Hide when market locked */}
      {!isMarketLocked() && (
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Provider Directory
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Browse our full directory of certified mobile phlebotomy services. Filter by location, services, and availability to find the perfect provider for your needs.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              View All Providers
              <span>→</span>
            </Link>
          </div>

          {/* Quick Links Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors">
              <div className="text-4xl mb-3">🏥</div>
              <h3 className="font-semibold text-gray-900 mb-2">By Service Type</h3>
              <p className="text-sm text-gray-600 mb-4">Find specialists for your specific needs</p>
              <Link href="/search?services=At-Home%20Blood%20Draw" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Browse Services →
              </Link>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="font-semibold text-gray-900 mb-2">By Location</h3>
              <p className="text-sm text-gray-600 mb-4">Search by city, state, or ZIP code</p>
              <Link href="/search" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Search Now →
              </Link>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="font-semibold text-gray-900 mb-2">Top Rated</h3>
              <p className="text-sm text-gray-600 mb-4">View providers with highest ratings</p>
              <Link href="/search?rating=4.0" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View Top Rated →
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Premium Provider Placement Section - Hide when market locked */}
      {!isMarketLocked() && (
      <section className="py-12 bg-gradient-to-b from-primary-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-primary-100 p-8 md:p-10 text-center">
            {/* Heading with Star Icon */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">🌟</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Premium Provider Placement
              </h2>
            </div>

            {/* Launch Offer Badge */}
            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold text-sm mb-6">
              Now Available - Starting at $49/month
            </div>

            {/* Description */}
            <p className="text-gray-600 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Get premium placement at the top of search results and exclusive market coverage.
              Founding Partner rates available for new markets.
            </p>

            {/* CTA Button */}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              View Pricing
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* Browse by State Section - Internal Linking - Hide when market locked */}
      {!isMarketLocked() && (
      <section id="browse-by-state" className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Find Mobile Phlebotomy by State
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse certified mobile blood draw services across all 50 states. Find licensed phlebotomists in your area.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* High-Volume States (Top 10) */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Popular States
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { name: 'California', slug: 'california', abbr: 'CA' },
                  { name: 'Texas', slug: 'texas', abbr: 'TX' },
                  { name: 'Florida', slug: 'florida', abbr: 'FL' },
                  { name: 'New York', slug: 'new-york', abbr: 'NY' },
                  { name: 'Pennsylvania', slug: 'pennsylvania', abbr: 'PA' },
                  { name: 'Illinois', slug: 'illinois', abbr: 'IL' },
                  { name: 'Ohio', slug: 'ohio', abbr: 'OH' },
                  { name: 'Georgia', slug: 'georgia', abbr: 'GA' },
                  { name: 'North Carolina', slug: 'north-carolina', abbr: 'NC' },
                  { name: 'Michigan', slug: 'michigan', abbr: 'MI' }
                ].map((state) => (
                  <Link
                    key={state.slug}
                    href={`/us/${state.slug}`}
                    className="flex items-center justify-between px-4 py-3 bg-white hover:bg-primary-50 rounded-lg border border-gray-200 transition-all group shadow-sm hover:shadow-md"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-primary-700">
                      {state.name}
                    </span>
                    <span className="text-primary-600 group-hover:text-primary-700">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* All States A-Z */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                All States
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 text-sm">
                {[
                  { name: 'Alabama', slug: 'alabama' },
                  { name: 'Alaska', slug: 'alaska' },
                  { name: 'Arizona', slug: 'arizona' },
                  { name: 'Arkansas', slug: 'arkansas' },
                  { name: 'California', slug: 'california' },
                  { name: 'Colorado', slug: 'colorado' },
                  { name: 'Connecticut', slug: 'connecticut' },
                  { name: 'Delaware', slug: 'delaware' },
                  { name: 'Florida', slug: 'florida' },
                  { name: 'Georgia', slug: 'georgia' },
                  { name: 'Hawaii', slug: 'hawaii' },
                  { name: 'Idaho', slug: 'idaho' },
                  { name: 'Illinois', slug: 'illinois' },
                  { name: 'Indiana', slug: 'indiana' },
                  { name: 'Iowa', slug: 'iowa' },
                  { name: 'Kansas', slug: 'kansas' },
                  { name: 'Kentucky', slug: 'kentucky' },
                  { name: 'Louisiana', slug: 'louisiana' },
                  { name: 'Maine', slug: 'maine' },
                  { name: 'Maryland', slug: 'maryland' },
                  { name: 'Massachusetts', slug: 'massachusetts' },
                  { name: 'Michigan', slug: 'michigan' },
                  { name: 'Minnesota', slug: 'minnesota' },
                  { name: 'Mississippi', slug: 'mississippi' },
                  { name: 'Missouri', slug: 'missouri' },
                  { name: 'Montana', slug: 'montana' },
                  { name: 'Nebraska', slug: 'nebraska' },
                  { name: 'Nevada', slug: 'nevada' },
                  { name: 'New Hampshire', slug: 'new-hampshire' },
                  { name: 'New Jersey', slug: 'new-jersey' },
                  { name: 'New Mexico', slug: 'new-mexico' },
                  { name: 'New York', slug: 'new-york' },
                  { name: 'North Carolina', slug: 'north-carolina' },
                  { name: 'North Dakota', slug: 'north-dakota' },
                  { name: 'Ohio', slug: 'ohio' },
                  { name: 'Oklahoma', slug: 'oklahoma' },
                  { name: 'Oregon', slug: 'oregon' },
                  { name: 'Pennsylvania', slug: 'pennsylvania' },
                  { name: 'Rhode Island', slug: 'rhode-island' },
                  { name: 'South Carolina', slug: 'south-carolina' },
                  { name: 'South Dakota', slug: 'south-dakota' },
                  { name: 'Tennessee', slug: 'tennessee' },
                  { name: 'Texas', slug: 'texas' },
                  { name: 'Utah', slug: 'utah' },
                  { name: 'Vermont', slug: 'vermont' },
                  { name: 'Virginia', slug: 'virginia' },
                  { name: 'Washington', slug: 'washington' },
                  { name: 'West Virginia', slug: 'west-virginia' },
                  { name: 'Wisconsin', slug: 'wisconsin' },
                  { name: 'Wyoming', slug: 'wyoming' }
                ].map((state) => (
                  <Link
                    key={state.slug}
                    href={`/us/${state.slug}`}
                    className="text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {state.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* FAQ Section for SEO - Keep for both LA and national */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get answers to common questions about mobile phlebotomy services and at-home blood draws.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    How does mobile phlebotomy work?
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Mobile phlebotomy brings professional blood draw services directly to your location.
                    A certified phlebotomist travels to your home, office, or preferred location with all
                    necessary equipment. They collect your blood samples safely and transport them to
                    the laboratory for testing. Results are typically available within 24-48 hours.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Is mobile phlebotomy covered by insurance?
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Many mobile phlebotomy services accept major insurance plans including Medicare, 
                    Medicaid, and private insurance. Coverage varies by provider and your specific plan. 
                    Most providers also accept HSA/FSA payments and offer competitive cash rates. 
                    Contact your chosen provider to verify coverage before scheduling.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    What types of blood tests can be done at home?
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Most routine blood tests can be performed through mobile phlebotomy including: 
                    complete blood count (CBC), metabolic panels, lipid panels, thyroid tests, 
                    diabetes monitoring (A1C), vitamin levels, hormone testing, and many specialized 
                    tests. Your healthcare provider will specify which tests you need.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    How much does mobile phlebotomy cost?
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Costs vary by location and provider, but most mobile phlebotomy services charge
                    a separate convenience fee for the at-home visit. Typical collection fees range
                    from about $60–150 per visit, depending on your area, appointment time, and how
                    complex the tests are. Laboratory processing fees are usually billed separately by the lab.
                    The convenience fee is often worth 
                    it for the time saved and comfort of at-home service.
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Are mobile phlebotomists licensed and certified?
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Yes, all professional mobile phlebotomists must be licensed and certified. 
                    They complete specialized training programs and maintain current certifications 
                    through organizations like ASCP, NCA, or AMT. Our directory only includes 
                    verified, insured professionals who meet strict safety and quality standards.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    How do I prepare for an at-home blood draw?
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Preparation depends on your specific tests. Some require fasting (no food or 
                    drink except water) for 8-12 hours. Drink plenty of water unless instructed 
                    otherwise. Wear loose-fitting sleeves for easy access. Your provider will 
                    give you specific instructions when you schedule your appointment.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Is at-home blood collection safe and sterile?
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Absolutely. Mobile phlebotomists follow the same strict safety protocols as 
                    hospitals and clinics. They use sterile, single-use equipment and follow 
                    proper infection control procedures. All waste is disposed of safely according 
                    to medical regulations.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Can I get same-day blood draw service?
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Many mobile phlebotomy providers offer same-day and next-day appointments, 
                    especially in major metropolitan areas. Emergency services may be available 
                    for urgent medical needs. Scheduling depends on provider availability and 
                    your location. Contact providers directly for fastest service.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional SEO Content */}
            <div className="mt-12 text-center">
              <div className="bg-primary-50 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {isMarketLocked()
                    ? `Need a Same-Day Blood Draw in ${MARKET_CONFIG.MARKET_NAME}?`
                    : 'Ready to Schedule Your At-Home Blood Draw?'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  {isMarketLocked()
                    ? "Enter your ZIP above. We'll connect you fast."
                    : 'Find certified mobile phlebotomy services in your area. Our network includes licensed professionals available 7 days a week across all 50 states.'}
                </p>
                {!isMarketLocked() && (
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link
                      href="/search"
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Find Providers Near You
                    </Link>
                    <Link
                      href="/about"
                      className="border border-primary-600 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Learn More
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking & Related Content Section for SEO - Hide when market locked */}
      {!isMarketLocked() && (
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Mobile Phlebotomy Services by Location
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find certified mobile phlebotomists in major cities and metropolitan areas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* NOW SERVING: Detroit Metro - PRIORITY PLACEMENT */}
            <div className="bg-gradient-to-br from-primary-50 to-white rounded-lg p-6 shadow-md border-2 border-primary-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏙️</span>
                <h3 className="text-lg font-semibold text-gray-900">Detroit Metro</h3>
                <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full font-medium">NOW SERVING</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/detroit-mi/mobile-phlebotomy" className="text-primary-600 hover:text-primary-700 font-medium">
                    Detroit Mobile Phlebotomy
                  </Link>
                </li>
                <li>
                  <Link href="/dearborn-mi/mobile-phlebotomy" className="text-primary-600 hover:text-primary-700">
                    Dearborn Blood Draw Services
                  </Link>
                </li>
                <li>
                  <Link href="/livonia-mi/mobile-phlebotomy" className="text-primary-600 hover:text-primary-700">
                    Livonia At-Home Phlebotomy
                  </Link>
                </li>
                <li>
                  <Link href="/troy-mi/mobile-phlebotomy" className="text-primary-600 hover:text-primary-700">
                    Troy Mobile Lab Collection
                  </Link>
                </li>
                <li>
                  <Link href="/us/michigan" className="text-gray-600 hover:text-primary-600 font-medium">
                    View All Michigan Providers →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Major Cities with Internal Links */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">California</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/us/california/los-angeles" className="text-primary-600 hover:text-primary-700">
                    Mobile Phlebotomy in Los Angeles
                  </Link>
                </li>
                <li>
                  <Link href="/us/california/san-francisco" className="text-primary-600 hover:text-primary-700">
                    At-Home Blood Draw San Francisco
                  </Link>
                </li>
                <li>
                  <Link href="/san-diego-ca/mobile-phlebotomy" className="text-primary-600 hover:text-primary-700">
                    San Diego Mobile Lab Services
                  </Link>
                </li>
                <li>
                  <Link href="/us/california" className="text-gray-600 hover:text-primary-600 font-medium">
                    View All California Providers →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Florida</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/us/florida/miami" className="text-primary-600 hover:text-primary-700">
                    Mobile Phlebotomy in Miami
                  </Link>
                </li>
                <li>
                  <Link href="/us/florida/tampa" className="text-primary-600 hover:text-primary-700">
                    Tampa Bay Area Blood Draw
                  </Link>
                </li>
                <li>
                  <Link href="/us/florida/orlando" className="text-primary-600 hover:text-primary-700">
                    Orlando Mobile Lab Collection
                  </Link>
                </li>
                <li>
                  <Link href="/us/florida" className="text-gray-600 hover:text-primary-600 font-medium">
                    View All Florida Providers →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Texas</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/houston-tx/mobile-phlebotomy" className="text-primary-600 hover:text-primary-700">
                    Houston Mobile Phlebotomy
                  </Link>
                </li>
                <li>
                  <Link href="/us/texas/dallas" className="text-primary-600 hover:text-primary-700">
                    Dallas-Fort Worth Blood Draw
                  </Link>
                </li>
                <li>
                  <Link href="/us/texas/austin" className="text-primary-600 hover:text-primary-700">
                    Austin At-Home Lab Services
                  </Link>
                </li>
                <li>
                  <Link href="/us/texas" className="text-gray-600 hover:text-primary-600 font-medium">
                    View All Texas Providers →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">New York</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/us/new-york/new-york" className="text-primary-600 hover:text-primary-700">
                    NYC Mobile Phlebotomy Services
                  </Link>
                </li>
                <li>
                  <Link href="/us/new-york/buffalo" className="text-primary-600 hover:text-primary-700">
                    Buffalo Area Blood Collection
                  </Link>
                </li>
                <li>
                  <Link href="/us/new-york/rochester" className="text-primary-600 hover:text-primary-700">
                    Rochester Mobile Lab Draw
                  </Link>
                </li>
                <li>
                  <Link href="/us/new-york" className="text-gray-600 hover:text-primary-600 font-medium">
                    View All New York Providers →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Illinois</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/chicago-il/mobile-phlebotomy" className="text-primary-600 hover:text-primary-700">
                    Chicago Mobile Phlebotomy
                  </Link>
                </li>
                <li>
                  <Link href="/us/illinois/rockford" className="text-primary-600 hover:text-primary-700">
                    Rockford At-Home Blood Draw
                  </Link>
                </li>
                <li>
                  <Link href="/us/illinois/peoria" className="text-primary-600 hover:text-primary-700">
                    Peoria Mobile Lab Services
                  </Link>
                </li>
                <li>
                  <Link href="/us/illinois" className="text-gray-600 hover:text-primary-600 font-medium">
                    View All Illinois Providers →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ohio</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/columbus-oh/mobile-phlebotomy" className="text-primary-600 hover:text-primary-700">
                    Columbus Mobile Phlebotomy
                  </Link>
                </li>
                <li>
                  <Link href="/us/ohio/cleveland" className="text-primary-600 hover:text-primary-700">
                    Cleveland At-Home Blood Draw
                  </Link>
                </li>
                <li>
                  <Link href="/us/ohio/cincinnati" className="text-primary-600 hover:text-primary-700">
                    Cincinnati Mobile Lab Services
                  </Link>
                </li>
                <li>
                  <Link href="/us/ohio" className="text-gray-600 hover:text-primary-600 font-medium">
                    View All Ohio Providers →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">North Carolina</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/charlotte-nc/mobile-phlebotomy" className="text-primary-600 hover:text-primary-700">
                    Charlotte Mobile Phlebotomy
                  </Link>
                </li>
                <li>
                  <Link href="/us/north-carolina/raleigh" className="text-primary-600 hover:text-primary-700">
                    Raleigh At-Home Blood Draw
                  </Link>
                </li>
                <li>
                  <Link href="/us/north-carolina/durham" className="text-primary-600 hover:text-primary-700">
                    Durham Mobile Lab Services
                  </Link>
                </li>
                <li>
                  <Link href="/us/north-carolina" className="text-gray-600 hover:text-primary-600 font-medium">
                    View All North Carolina Providers →
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Washington</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/us/washington/seattle" className="text-primary-600 hover:text-primary-700">
                    Seattle Mobile Phlebotomy
                  </Link>
                </li>
                <li>
                  <Link href="/us/washington/spokane" className="text-primary-600 hover:text-primary-700">
                    Spokane Area Blood Collection
                  </Link>
                </li>
                <li>
                  <Link href="/us/washington/tacoma" className="text-primary-600 hover:text-primary-700">
                    Tacoma Mobile Lab Draw
                  </Link>
                </li>
                <li>
                  <Link href="/us/washington" className="text-gray-600 hover:text-primary-600 font-medium">
                    View All Washington Providers →
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Service Type Internal Links */}
          <div className="bg-white rounded-lg p-8 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Specialized Mobile Phlebotomy Services
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Healthcare Services</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link href="/search?services=Corporate%20Wellness" className="text-primary-600 hover:text-primary-700">
                      Corporate Wellness Programs
                    </Link>
                  </li>
                  <li>
                    <Link href="/search?services=Geriatric" className="text-primary-600 hover:text-primary-700">
                      Senior & Elderly Care
                    </Link>
                  </li>
                  <li>
                    <Link href="/search?services=Pediatric" className="text-primary-600 hover:text-primary-700">
                      Pediatric Blood Collection
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Specialized Testing</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link href="/search?services=Fertility%2FIVF" className="text-primary-600 hover:text-primary-700">
                      Fertility & IVF Monitoring
                    </Link>
                  </li>
                  <li>
                    <Link href="/search?services=Specimen%20Pickup" className="text-primary-600 hover:text-primary-700">
                      Laboratory Specimen Pickup
                    </Link>
                  </li>
                  <li>
                    <Link href="/search?services=Lab%20Partner" className="text-primary-600 hover:text-primary-700">
                      Hospital Lab Partnerships
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Payment Options</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link href="/search?payment=Major%20Insurance" className="text-primary-600 hover:text-primary-700">
                      Insurance Accepted
                    </Link>
                  </li>
                  <li>
                    <Link href="/search?payment=Medicare" className="text-primary-600 hover:text-primary-700">
                      Medicare Coverage
                    </Link>
                  </li>
                  <li>
                    <Link href="/search?payment=HSA%2FFSA" className="text-primary-600 hover:text-primary-700">
                      HSA/FSA Payments
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA />

      {/* Lead Form Modal - pre-populate with market defaults when locked */}
      <LeadFormModal
        isOpen={leadFormOpen}
        onClose={() => setLeadFormOpen(false)}
        defaultCity={isMarketLocked() ? MARKET_CONFIG.MARKET_NAME : ''}
        defaultState={isMarketLocked() ? MARKET_CONFIG.MARKET_STATE : ''}
        defaultZip={isMarketLocked() ? MARKET_CONFIG.DEFAULT_ZIPS[0] : ''}
      />
    </>
  )
}