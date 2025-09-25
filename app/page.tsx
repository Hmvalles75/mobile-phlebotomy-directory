'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AutocompleteSearchBar } from '@/components/ui/AutocompleteSearchBar'
import { Tag } from '@/components/ui/Tag'
import { Badge } from '@/components/ui/Badge'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { trackTopRatedView, trackRatingView } from '@/lib/provider-actions'
import { type Provider } from '@/lib/schemas'
import { topMetroAreas } from '@/data/top-metros'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [topRatedProviders, setTopRatedProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [providerCounts, setProviderCounts] = useState<Record<string, number>>({})

  const handleSearch = (query: string) => {
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
    }
  }

  useEffect(() => {
    async function fetchTopRatedProviders() {
      try {
        const response = await fetch('/api/providers?featured=true&limit=6')
        if (response.ok) {
          const providers = await response.json()
          setTopRatedProviders(providers)
          // Track that the top-rated section was loaded
          trackTopRatedView('homepage')
        }
      } catch (error) {
        console.error('Failed to fetch top rated providers:', error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchProviderCounts() {
      try {
        // Get provider counts for each metro area
        const counts: Record<string, number> = {}

        // Get all providers to count by metro area
        const response = await fetch('/api/providers?limit=200')
        if (response.ok) {
          const allProviders = await response.json()

          // Count providers for each featured metro area
          featuredMetros.forEach(metro => {
            counts[metro.slug] = allProviders.filter((provider: Provider) => {
              // Check if provider serves this metro area
              return provider.coverage?.cities?.some((city: string) =>
                city.toLowerCase().includes(metro.city.toLowerCase())
              ) || provider.coverage?.states?.includes(metro.stateAbbr) ||
              provider.address?.city?.toLowerCase() === metro.city.toLowerCase()
            }).length
          })

          setProviderCounts(counts)
        }
      } catch (error) {
        console.error('Failed to fetch provider counts:', error)
      }
    }

    fetchTopRatedProviders()
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
              Find Mobile <span className="text-primary-400">Phlebotomy Services</span> Near You
            </h1>
            <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
              Professional at-home blood draws and lab collections. Certified, insured providers 
              available 7 days a week across the United States.
            </p>
            
            <AutocompleteSearchBar 
              onSearch={handleSearch}
              placeholder="Enter your ZIP code or city..."
              className="mb-8"
              enableZipCodeRouting={true}
            />

            <div className="flex flex-wrap justify-center gap-2 mb-8">
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

            <div className="flex flex-wrap justify-center gap-3">
              {trustBadges.map((badge) => (
                <Badge key={badge} variant="success" size="sm">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Mobile Phlebotomy Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional blood collection services that come to you. Safe, convenient, and certified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Find a Provider</h3>
              <p className="text-gray-600">
                Search our directory of certified mobile phlebotomists in your area. 
                Filter by services, availability, and insurance acceptance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Schedule Service</h3>
              <p className="text-gray-600">
                Book your appointment online or by phone. Many providers offer 
                same-day and emergency services.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">At-Home Collection</h3>
              <p className="text-gray-600">
                A certified phlebotomist visits your location with all necessary 
                equipment for safe, professional blood collection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Metro Areas Section */}
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

      {/* Top Rated Providers Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🏆 Top Rated Providers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our highest-rated mobile phlebotomy providers based on real customer reviews. 
              These trusted professionals deliver exceptional service with proven track records.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <p className="text-gray-600">Loading top-rated providers...</p>
            </div>
          ) : topRatedProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topRatedProviders.map((provider) => (
                <div key={provider.id} className="bg-white rounded-lg border-2 border-gray-100 hover:border-primary-200 p-6 transition-all duration-200 hover:shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {provider.name}
                      </h3>
                      {provider.rating && (
                        <RatingBadge 
                          rating={provider.rating} 
                          reviewsCount={provider.reviewsCount}
                          variant="featured"
                          className="mb-3"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <span>📍</span>
                      <span className="ml-2">
                        {provider.address?.city}, {provider.address?.state}
                      </span>
                    </div>
                    {provider.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span>📞</span>
                        <span className="ml-2">{provider.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {provider.services.slice(0, 2).map((service) => (
                        <span key={service} className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                          {service}
                        </span>
                      ))}
                      {provider.services.length > 2 && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          +{provider.services.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  <ProviderActions
                    provider={provider}
                    variant="compact"
                    className="mt-4"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⭐</div>
              <p className="text-gray-600">No featured providers available at this time.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link 
              href="/search?rating=4.0" 
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              View All Top Rated Providers
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="browse-by-state" className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse by State
            </h2>
            <p className="text-gray-600">
              Find mobile phlebotomy services across all 50 states
            </p>
          </div>

          {/* State Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-12">
            {[
              'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
              'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
              'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
              'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
              'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
              'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
              'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
              'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
              'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
              'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
            ].map((stateName) => (
              <Link
                key={stateName}
                // @ts-ignore - Next.js typedRoutes compatibility
                href={`/us/${stateName.toLowerCase().replace(' ', '-')}`}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center hover:shadow-md hover:border-primary-300 transition-all"
              >
                <div className="text-sm font-medium text-gray-700 hover:text-primary-600">
                  {stateName}
                </div>
              </Link>
            ))}
          </div>


          <div className="text-center mt-12">
            <Link
              // @ts-ignore - Next.js typedRoutes compatibility
              href="/search"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Search All Providers
            </Link>
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
    </>
  )
}