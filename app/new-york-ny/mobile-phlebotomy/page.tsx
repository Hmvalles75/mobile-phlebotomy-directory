'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { ga4 } from '@/lib/ga4'

export default function NewYorkMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({
          city: 'New York',
          state: 'NY',
          grouped: 'true'
        })
        const response = await fetch(`/api/providers/city?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch providers')
        const data = await response.json()
        const allProviders = [
          ...(data.citySpecific || []),
          ...(data.regional || []),
          ...(data.statewide || [])
        ]
        setProviders(allProviders)
      } catch (error) {
        console.error('Error fetching providers:', error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }
    fetchProviders()
  }, [])

  const featuredProvider = providers.find((p: any) =>
    p.isFeatured || p.listingTier === 'FEATURED' || p.isFeaturedCity
  )

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does mobile phlebotomy cost in NYC?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Mobile blood draw services in New York City typically range from $75-150 per visit. Many providers accept insurance which may cover the cost."
        }
      },
      {
        "@type": "Question",
        "name": "Which NYC boroughs do you serve?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We serve all five NYC boroughs: Manhattan, Brooklyn, Queens, Bronx, and Staten Island, plus Northern New Jersey."
        }
      },
      {
        "@type": "Question",
        "name": "Can I get same-day blood draw service in NYC?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Many NYC mobile phlebotomy providers offer same-day appointments when scheduling allows, as well as next-day availability."
        }
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Section with Availability Framing */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Mobile Phlebotomy in New York City
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              At-home blood draw services across New York City and Northern New Jersey — request same-day or next-day availability when scheduling allows.
              Licensed phlebotomists come to your location for convenient, professional lab specimen collection.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Serving All 5 Boroughs</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Same-Day & Next-Day Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Multilingual Staff</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Licensed & Insured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary CTA Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Request a Mobile Phlebotomy Visit in NYC
            </h2>
            <p className="text-gray-600 mb-6">
              Get matched with a certified local provider for at-home blood draws — same-day or next-day availability when scheduling allows
            </p>
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'hero' })
                setLeadFormOpen(true)
              }}
              className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-xl"
            >
              📋 Request a Blood Draw
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        {/* Borough Navigation - INTERNAL LINKING HUB */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-primary-100 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Serving All Five NYC Boroughs + Northern NJ
          </h2>
          <p className="text-gray-700 mb-6">
            Our network of mobile phlebotomists serves all five NYC boroughs and Northern New Jersey.
            Find providers in your borough or explore nearby areas:
          </p>

          {/* Five Boroughs */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">New York City Boroughs</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                href="/manhattan-ny/mobile-phlebotomy"
                className="block bg-gradient-to-br from-primary-50 to-white rounded-lg p-5 hover:from-primary-100 hover:to-primary-50 hover:shadow-md border-2 border-primary-200 hover:border-primary-400 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🏙️</span>
                  <span className="font-bold text-gray-900 text-lg">Manhattan Mobile Phlebotomy</span>
                </div>
                <span className="text-sm text-primary-600 group-hover:text-primary-700 font-medium">View Manhattan providers →</span>
              </Link>

              <Link
                href="/brooklyn-ny/mobile-phlebotomy"
                className="block bg-gray-50 rounded-lg p-5 hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Brooklyn</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</span>
              </Link>

              <Link
                href="/queens-ny/mobile-phlebotomy"
                className="block bg-gray-50 rounded-lg p-5 hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Queens</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</span>
              </Link>

              <Link
                href="/bronx-ny/mobile-phlebotomy"
                className="block bg-gray-50 rounded-lg p-5 hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Bronx</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</span>
              </Link>

              <Link
                href="/staten-island-ny/mobile-phlebotomy"
                className="block bg-gray-50 rounded-lg p-5 hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Staten Island</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</span>
              </Link>
            </div>
          </div>

          {/* Northern NJ */}
          <div className="mb-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Northern New Jersey</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                href="/newark-nj/mobile-phlebotomy"
                className="block bg-gray-50 rounded-lg p-5 hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Newark, NJ</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</span>
              </Link>

              <Link
                href="/jersey-city-nj/mobile-phlebotomy"
                className="block bg-gray-50 rounded-lg p-5 hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Jersey City, NJ</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</span>
              </Link>

              <Link
                href="/bayonne-nj/mobile-phlebotomy"
                className="block bg-gray-50 rounded-lg p-5 hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Bayonne, NJ</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">View providers →</span>
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'metro_links' })
                setLeadFormOpen(true)
              }}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
            >
              📋 Request Service in NYC
            </button>
          </div>
        </div>

        {/* Featured Provider Card */}
        {!loading && featuredProvider && (
          <div className="bg-white rounded-lg shadow-lg border-2 border-amber-300">
            <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 p-4 border-b border-amber-200">
              <div className="flex items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  Featured Provider in NYC
                </h2>
              </div>
              <p className="text-gray-700 font-medium">
                Premium provider with verified credentials and enhanced visibility
              </p>
            </div>
            <div className="p-5 bg-gradient-to-r from-amber-50/40 to-transparent">
              {/* Provider Header */}
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">
                  {featuredProvider.name}
                </h3>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md">
                  ⭐ Featured Provider
                </span>
              </div>

              {/* Service Scope Notice */}
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-blue-900">
                  <strong>Requests submitted through MobilePhlebotomy.org are routed for at-home blood draw and laboratory specimen collection services.</strong>
                </p>
              </div>

              {/* Description */}
              {featuredProvider.description && (
                <div className="mb-4 p-3 bg-white/60 rounded-lg border border-gray-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {featuredProvider.description}
                  </p>
                </div>
              )}

              {/* Contact & Actions */}
              <div className="bg-white/60 p-4 rounded-lg border border-gray-200 mb-4">
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  {featuredProvider.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-primary-600">📞</span>
                      <span className="font-medium text-gray-900">{featuredProvider.phone}</span>
                    </div>
                  )}
                  {featuredProvider.address?.city && featuredProvider.address?.state && (
                    <div className="flex items-center gap-2">
                      <span className="text-primary-600">📍</span>
                      <span className="text-gray-700">Based in {featuredProvider.address.city}, {featuredProvider.address.state}</span>
                    </div>
                  )}
                </div>
              </div>

              <ProviderActions provider={featuredProvider} currentLocation="New York, NY" variant="compact" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">What to Expect</h2>
          <p className="text-gray-700">Licensed phlebotomists come to your NYC location for convenient blood draws. Same-day and next-day appointments typically available when scheduling allows.</p>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="New York" defaultState="NY" defaultZip="" />
    </div>
  )
}
