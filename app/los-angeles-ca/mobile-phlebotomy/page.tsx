'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { ga4 } from '@/lib/ga4'

const laSuburbs = [
  { name: 'Pasadena', slug: 'pasadena-ca' },
  { name: 'Santa Monica', slug: 'santa-monica-ca' },
  { name: 'Burbank', slug: 'burbank-ca' },
  { name: 'Glendale', slug: 'glendale-ca' },
  { name: 'Long Beach', slug: 'long-beach-ca' },
  { name: 'Torrance', slug: 'torrance-ca' },
  { name: 'West Hollywood', slug: 'west-hollywood-ca' },
  { name: 'Beverly Hills', slug: 'beverly-hills-ca' }
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is mobile phlebotomy in Los Angeles, CA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomy in Los Angeles brings certified phlebotomists directly to your home, office, or preferred location for blood draws and lab specimen collection. This service eliminates travel to traditional labs and provides convenient, professional care throughout Los Angeles County and the greater LA metro area."
      }
    },
    {
      "@type": "Question",
      "name": "How much does mobile phlebotomy cost in Los Angeles?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile blood draw services in Los Angeles typically cost between $60-$150 per visit, depending on the provider, location within the metro area, and urgency. Many providers accept insurance coverage, and Medicare/Medicaid may cover the service for homebound patients. Always confirm pricing and insurance acceptance before booking."
      }
    },
    {
      "@type": "Question",
      "name": "What areas of Los Angeles do mobile phlebotomists serve?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomy providers serve all of Los Angeles proper plus surrounding areas including Pasadena, Santa Monica, Burbank, Glendale, Long Beach, Torrance, West Hollywood, Beverly Hills, and other Los Angeles County communities. Many providers also serve Orange and Ventura counties. Coverage areas vary by provider, so confirm your specific location when booking."
      }
    },
    {
      "@type": "Question",
      "name": "How quickly can I get a mobile blood draw appointment in Los Angeles?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most Los Angeles mobile phlebotomy providers offer same-day or next-day service for urgent needs. Routine appointments are typically available within 24-48 hours. Availability depends on your location, the time of day, and current demand. Request a visit to check real-time availability."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a doctor's order for mobile phlebotomy in Los Angeles?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, mobile phlebotomy services require a valid lab requisition or doctor's order. Your physician will provide the necessary paperwork specifying which tests to perform. The mobile phlebotomist will collect the specimens and deliver them to your designated laboratory (Quest, Labcorp, or other)."
      }
    },
    {
      "@type": "Question",
      "name": "Is mobile phlebotomy covered by insurance in Los Angeles, CA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Insurance coverage for mobile phlebotomy in Los Angeles varies by plan. The lab testing itself is often covered when ordered by a physician, but the mobile collection fee may be out-of-pocket. Medicare and Medicaid typically cover mobile visits for homebound patients. Contact your insurance provider and the mobile phlebotomy service to verify coverage before your appointment."
      }
    },
    {
      "@type": "Question",
      "name": "Are mobile phlebotomists in Los Angeles licensed and certified?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, reputable mobile phlebotomy services in Los Angeles employ licensed, certified phlebotomists who meet California state requirements. They follow strict infection control protocols, use sterile equipment, and maintain HIPAA compliance. Always verify credentials and ask about certifications when selecting a provider."
      }
    },
    {
      "@type": "Question",
      "name": "What types of blood tests can be done with mobile phlebotomy in Los Angeles?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomists in Los Angeles can collect specimens for most standard blood tests including routine lab work, cholesterol panels, metabolic panels, thyroid tests, glucose monitoring, vitamin levels, hormone testing, and more. Specialized tests may require specific handling or lab partnerships. Discuss your testing needs with the provider when scheduling."
      }
    }
  ]
}

export default function LosAngelesMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({
          city: 'Los Angeles',
          state: 'CA',
          grouped: 'true'
        })

        const response = await fetch(`/api/providers/city?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch providers')
        }

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

  // Get featured provider if available
  const featuredProvider = providers.find((p: any) =>
    p.isFeatured || p.listingTier === 'FEATURED' || p.isFeaturedCity
  )

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
              Mobile Phlebotomy in Los Angeles, CA
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              At-home blood draw services in Los Angeles — request same-day or next-day availability.
              Licensed phlebotomists come to your home, office, or preferred location for convenient,
              stress-free lab specimen collection.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Same-Day & Next-Day Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Insurance Accepted</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>HIPAA Compliant</span>
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
              Request a Mobile Phlebotomy Visit in Los Angeles
            </h2>
            <p className="text-gray-600 mb-6">
              Get matched with a certified local provider for at-home blood draws — same-day or next-day availability
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  ga4.leadCtaClick({ placement: 'hero' })
                  setLeadFormOpen(true)
                }}
                className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-xl"
              >
                📋 Request a Blood Draw
              </button>
              <a
                href="tel:+1"
                className="px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-all"
              >
                📞 Call a Los Angeles Provider
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Los Angeles Metro Areas We Serve - PRIMARY INTERNAL LINKING HUB */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-lg border-2 border-primary-100 p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Los Angeles Metro Areas We Serve
            </h2>
            <p className="text-gray-700 mb-6">
              Our network of mobile phlebotomists serves Los Angeles and surrounding communities
              throughout Los Angeles County. Select your area to find local providers:
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {laSuburbs.map(suburb => (
                <Link
                  key={suburb.slug}
                  href={`/${suburb.slug}/mobile-phlebotomy`}
                  className="block bg-gradient-to-br from-primary-50 to-white rounded-lg p-5 hover:from-primary-100 hover:to-primary-50 hover:shadow-md border-2 border-primary-200 hover:border-primary-400 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">📍</span>
                    <span className="font-bold text-gray-900 text-lg">{suburb.name}</span>
                  </div>
                  <span className="text-sm text-primary-600 group-hover:text-primary-700 font-medium">View providers →</span>
                </Link>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Also serving: Culver City, El Segundo, Manhattan Beach, Redondo Beach, Inglewood,
                and all Los Angeles, Orange, and Ventura County communities
              </p>
            </div>
          </div>
        </div>

        {/* Related Los Angeles Services - INTENT VARIANTS */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Los Angeles Mobile Phlebotomy Services
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/los-angeles-ca/in-home-blood-draw"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md transition-all border-2 border-transparent hover:border-primary-300"
              >
                <h3 className="font-bold text-gray-900 mb-2 text-lg">In-Home Blood Draw Services</h3>
                <p className="text-sm text-gray-600">Los Angeles at-home blood collection →</p>
              </Link>
              <Link
                href="/los-angeles-ca/blood-draw-at-home"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md transition-all border-2 border-transparent hover:border-primary-300"
              >
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Blood Draw at Home</h3>
                <p className="text-sm text-gray-600">Convenient home blood testing →</p>
              </Link>
              <Link
                href="/los-angeles-ca/lab-draw-at-home"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md transition-all border-2 border-transparent hover:border-primary-300"
              >
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Lab Draw at Home</h3>
                <p className="text-sm text-gray-600">Home lab specimen collection →</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Provider Card */}
        {featuredProvider && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-lg shadow-lg border-2 border-amber-300">
              <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 p-4 border-b border-amber-200">
                <div className="flex items-center mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    Featured Provider in Los Angeles
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

                <ProviderActions
                  provider={featuredProvider}
                  currentLocation="Los Angeles, CA"
                  variant="compact"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Professional At-Home Blood Draw Services in Los Angeles
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Skip the wait at crowded labs. Mobile phlebotomy brings certified phlebotomists directly to
              your Los Angeles home, office, or preferred location for convenient blood draws. Our network
              serves all of Los Angeles County with same-day and next-day appointments available.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Whether you're in downtown LA, the Westside, San Fernando Valley, or South Bay, our licensed
              phlebotomists provide professional specimen collection with the same quality standards as
              traditional labs—just more convenient.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How Mobile Phlebotomy Works in Los Angeles
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Get a Doctor's Order</h3>
                  <p className="text-gray-700">Your physician provides a lab requisition specifying which tests you need.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Schedule Your Visit</h3>
                  <p className="text-gray-700">Request a mobile phlebotomy visit and choose same-day, next-day, or scheduled appointment.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Phlebotomist Arrives</h3>
                  <p className="text-gray-700">A certified phlebotomist comes to your location with all necessary sterile equipment.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Results Delivered</h3>
                  <p className="text-gray-700">Specimens are delivered to your lab (Quest, Labcorp, etc.). Results sent to your doctor as usual.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Benefits of Mobile Phlebotomy in Los Angeles
            </h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-primary-600 flex-shrink-0">✓</span>
                <span className="text-gray-700"><strong>Save Time:</strong> Avoid LA traffic and lab wait times—service comes to you</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 flex-shrink-0">✓</span>
                <span className="text-gray-700"><strong>Convenience:</strong> Home, office, or anywhere in Los Angeles County</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 flex-shrink-0">✓</span>
                <span className="text-gray-700"><strong>Flexible Scheduling:</strong> Same-day and next-day appointments available</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 flex-shrink-0">✓</span>
                <span className="text-gray-700"><strong>Comfortable Environment:</strong> Reduced stress, especially for needle-anxious patients</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 flex-shrink-0">✓</span>
                <span className="text-gray-700"><strong>Professional Service:</strong> Licensed, certified phlebotomists following strict protocols</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary-600 flex-shrink-0">✓</span>
                <span className="text-gray-700"><strong>Insurance Accepted:</strong> Many providers accept insurance; Medicare/Medicaid for homebound patients</span>
              </li>
            </ul>
          </div>

          {/* Final CTA */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Schedule Your Mobile Blood Draw in Los Angeles?
            </h2>
            <p className="text-primary-100 mb-6">
              Get matched with a local certified phlebotomist for same-day or next-day service
            </p>
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'bottom' })
                setLeadFormOpen(true)
              }}
              className="px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition-all shadow-md"
            >
              📋 Request Service Now
            </button>
          </div>
        </div>
      </div>

      <LeadFormModal
        isOpen={leadFormOpen}
        onClose={() => setLeadFormOpen(false)}
        defaultCity="Los Angeles"
        defaultState="CA"
        defaultZip=""
      />
    </div>
  )
}
