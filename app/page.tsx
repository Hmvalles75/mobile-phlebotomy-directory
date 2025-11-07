'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AutocompleteSearchBar } from '@/components/ui/AutocompleteSearchBar'
import { Tag } from '@/components/ui/Tag'
import { Badge } from '@/components/ui/Badge'
import { type Provider } from '@/lib/schemas'
import { topMetroAreas } from '@/data/top-metros'
import { handleCityNameSearch, handleStateNameSearch } from '@/lib/zip-geocoding'
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA'
import { ga4 } from '@/lib/ga4'

const featuredMetros = topMetroAreas.slice(0, 12)

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
          text: 'Costs vary by location and provider, typically ranging from $25-75 for the collection fee, plus laboratory testing costs. Many insurance plans cover the service when medically necessary. The convenience fee is often worth it for the time saved and comfort of at-home service.'
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
      
      <div 
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero-bg.jpg')"
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <div className="relative container py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Professional <span className="text-primary-400">At-Home Blood Draws</span> Nationwide
            </h1>
            <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
              Skip the clinic. Licensed phlebotomists come to you for safe, convenient blood collection.
              Get matched with a certified provider in your area today.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => {
                  ga4.leadFormOpen({ source: 'homepage_hero' })
                  router.push('/coming-soon')
                }}
                className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Request Blood Draw
              </button>
              <button
                onClick={(e) => {
                  ga4.callClick({ source: 'homepage_hero' })
                  const phoneNumber = process.env.NEXT_PUBLIC_DEFAULT_PHONE || '1-800-555-0100'

                  // On mobile, open tel: link. On desktop, show phone number with copy option
                  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    window.location.href = `tel:${phoneNumber}`
                  } else {
                    // On desktop, show alert with phone number and option to copy
                    const message = `Call us at:\n\n${phoneNumber}\n\nClick OK to copy the phone number to your clipboard.`
                    if (confirm(message)) {
                      if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(phoneNumber).then(() => {
                          alert(`Phone number ${phoneNumber} copied to clipboard!`)
                        }).catch(() => {
                          alert(`Please call: ${phoneNumber}`)
                        })
                      } else {
                        alert(`Please call: ${phoneNumber}`)
                      }
                    }
                  }
                }}
                className="bg-white text-primary-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg border-2 border-primary-600"
              >
                📞 Call Now
              </button>
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

      {/* Social Trust Section */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-sm md:text-base">
              <span className="text-green-600 text-xl">✅</span>
              <span className="text-gray-700 font-medium">Licensed professionals</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm md:text-base">
              <span className="text-blue-600 text-xl">🏥</span>
              <span className="text-gray-700 font-medium">Most insurance accepted</span>
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

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
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

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => {
                ga4.leadFormOpen({ source: 'how_it_works' })
                router.push('/coming-soon')
              }}
              className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg"
            >
              Request Blood Draw
            </button>
          </div>
        </div>
      </section>

      {/* Top Metro Areas Section */}
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

      {/* All Providers Directory Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Provider Directory
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Browse our full directory of certified mobile phlebotomy services. Filter by location,
              services, and availability to find the perfect provider for your needs.
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

      {/* Featured Providers Coming Soon Section */}
      <section className="py-12 bg-gradient-to-b from-primary-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-primary-100 p-8 md:p-10 text-center">
            {/* Heading with Star Icon */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">🌟</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Featured Providers
              </h2>
            </div>

            {/* Coming Soon Badge */}
            <div className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full font-semibold text-sm mb-6">
              Coming Soon
            </div>

            {/* Description */}
            <p className="text-gray-600 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Be among the first 5 mobile phlebotomy services featured on our homepage.
              Early adopter pricing available.
            </p>

            {/* CTA Button */}
            <a
              href="mailto:hector@mobilephlebotomy.org?subject=Interested%20in%20Featured%20Provider%20Placement%20-%20MobilePhlebotomy.org"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              Get Featured
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section for SEO */}
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
                    Costs vary by location and provider, typically ranging from $25-75 for the 
                    collection fee, plus laboratory testing costs. Many insurance plans cover 
                    the service when medically necessary. The convenience fee is often worth 
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
                  Ready to Schedule Your At-Home Blood Draw?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Find certified mobile phlebotomy services in your area. Our network includes 
                  licensed professionals available 7 days a week across all 50 states.
                </p>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking & Related Content Section for SEO */}
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
                  <Link href="/us/california/san-diego" className="text-primary-600 hover:text-primary-700">
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
                  <Link href="/us/texas/houston" className="text-primary-600 hover:text-primary-700">
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
                  <Link href="/us/illinois/chicago" className="text-primary-600 hover:text-primary-700">
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

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA />
    </>
  )
}