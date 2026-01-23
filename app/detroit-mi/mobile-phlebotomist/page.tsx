'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { ga4 } from '@/lib/ga4'

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I find a qualified mobile phlebotomist in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Look for mobile phlebotomists in Detroit with current state certification, liability insurance, and verified credentials. Check reviews, ask about their lab partnerships (Quest, Labcorp), and confirm they serve your Detroit area. This directory lists verified and unverified providers serving Wayne County."
      }
    },
    {
      "@type": "Question",
      "name": "What qualifications should a Detroit mobile phlebotomist have?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A qualified mobile phlebotomist in Detroit should hold state certification or licensure, current CPR certification, liability insurance, and proper training in blood collection techniques. Many also have certifications from national organizations like ASCP or AMT. Always verify credentials before booking."
      }
    },
    {
      "@type": "Question",
      "name": "How much do mobile phlebotomists charge in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomists in Detroit typically charge $60-$150 for a home visit, covering travel, collection services, and specimen transport. Rates vary based on distance, urgency, and whether multiple household members need draws. Lab testing costs are billed separately by the laboratory."
      }
    },
    {
      "@type": "Question",
      "name": "Can mobile phlebotomists draw blood for any type of test?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomists in Detroit can collect specimens for most standard blood tests including routine panels, cholesterol, glucose, thyroid, hormone tests, and more. Some specialized tests require specific handling or immediate processing. Discuss your specific testing needs when scheduling."
      }
    },
    {
      "@type": "Question",
      "name": "Are mobile phlebotomists available on weekends in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Many mobile phlebotomists in Detroit offer weekend and evening appointments to accommodate work schedules. Availability varies by provider. When requesting service, specify your preferred day and time—most providers try to accommodate flexible scheduling needs."
      }
    },
    {
      "@type": "Question",
      "name": "How do I verify a mobile phlebotomist's credentials?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ask for certification numbers and verify with the Michigan Department of Licensing and Regulatory Affairs. Request proof of liability insurance and ask about their training background. Check online reviews and ask for references from other Detroit clients."
      }
    }
  ]
}

export default function DetroitMobilePhlebotomist() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({
          city: 'Detroit',
          state: 'MI',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find a Mobile Phlebotomist in Detroit, MI
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Connect with certified mobile phlebotomists serving Detroit and Wayne County.
              Licensed professionals providing at-home blood draws with flexible scheduling
              and professional service.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Request a Mobile Phlebotomist in Detroit
            </h2>
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'hero' })
                setLeadFormOpen(true)
              }}
              className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 transition-all shadow-md"
            >
              📋 Find a Phlebotomist
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Featured Provider Card */}
          {!loading && featuredProvider && (
            <div className="bg-white rounded-lg shadow-lg border-2 border-amber-300">
              <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 p-4 border-b border-amber-200">
                <div className="flex items-center mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    Featured Provider in Detroit
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
                    )}</div>
                </div>

                <ProviderActions provider={featuredProvider} currentLocation="Detroit, MI" variant="compact" />
              </div>
            </div>
          )}

          {/* Link to Detroit Mobile Phlebotomy Hub */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg shadow-md p-8 border-2 border-primary-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Looking for Mobile Phlebotomy in Detroit?
            </h2>
            <p className="text-gray-700 mb-6">
              Explore all mobile blood draw services available throughout Detroit and the metro area.
              Compare providers, read reviews, and find the right phlebotomy service for your needs.
            </p>
            <Link
              href="/detroit-mi/mobile-phlebotomy"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
            >
              View All Detroit Mobile Phlebotomy Services →
            </Link>
          </div>

          {/* Nearby Detroit Metro Areas */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Mobile Phlebotomists in Nearby Detroit Metro Areas
            </h2>
            <p className="text-gray-700 mb-6">
              We also serve surrounding communities throughout the Detroit metro area:
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                href="/dearborn-mi/mobile-phlebotomy"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Dearborn</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">Mobile phlebotomists →</span>
              </Link>

              <Link
                href="/livonia-mi/mobile-phlebotomy"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Livonia</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">Mobile phlebotomists →</span>
              </Link>

              <Link
                href="/southfield-mi/mobile-phlebotomy"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Southfield</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">Mobile phlebotomists →</span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-medium text-gray-900">Loading Detroit mobile phlebotomists...</h3>
            </div>
          ) : providers.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {providers.length} Mobile Phlebotomist{providers.length !== 1 ? 's' : ''} in Detroit
              </h2>
              <div className="space-y-4">
                {providers.slice(0, 10).map(provider => (
                  <div key={provider.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{provider.name}</h3>
                    {provider.phone && <p className="text-gray-700 mb-2">📞 {provider.phone}</p>}
                    {provider.description && <p className="text-gray-600 text-sm mb-3">{provider.description}</p>}
                    <ProviderActions provider={provider} currentLocation="Detroit, MI" variant="compact" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Look for in a Detroit Mobile Phlebotomist</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">✓ Proper Certification & Licensing</h3>
                <p>Verify the phlebotomist holds current Michigan certification and has completed accredited training.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">✓ Liability Insurance</h3>
                <p>Confirm they carry professional liability insurance for mobile services.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">✓ Lab Partnerships</h3>
                <p>Ensure they work with reputable laboratories like Quest or Labcorp.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">✓ Experience & Reviews</h3>
                <p>Look for providers with positive Detroit client reviews and relevant experience.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map((faq, index) => (
                <div key={index} className="pb-6 border-b border-gray-200 last:border-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.name}</h3>
                  <p className="text-gray-700">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Services</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/detroit-mi/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-1">Mobile Phlebotomy Detroit</h3>
                <p className="text-sm text-gray-600">All Detroit services →</p>
              </Link>
              <Link href="/detroit-mi/in-home-blood-draw" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-1">In-Home Blood Draw</h3>
                <p className="text-sm text-gray-600">Home blood collection →</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Detroit" defaultState="MI" defaultZip="" />
    </div>
  )
}
