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
      "name": "How much does mobile phlebotomy cost in Livonia, MI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomy services in Livonia typically cost $60-$150 per visit. Lab testing costs are separate. Many insurance plans cover mobile phlebotomy, and Medicare/Medicaid often cover home visits for eligible patients."
      }
    },
    {
      "@type": "Question",
      "name": "What areas of Livonia do mobile phlebotomists serve?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomists serve all of Livonia and surrounding communities including Detroit, Dearborn, Farmington Hills, Westland, and Redford. Coverage areas vary by provider."
      }
    },
    {
      "@type": "Question",
      "name": "How quickly can I get a mobile blood draw in Livonia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most Livonia mobile phlebotomy providers offer appointments within 24-48 hours. Some offer same-day service for urgent needs. Evening and weekend appointments are often available."
      }
    },
    {
      "@type": "Question",
      "name": "Does insurance cover mobile phlebotomy in Livonia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Many insurance plans cover mobile phlebotomy in Livonia when medically necessary. Medicare and Medicaid typically cover home visits for homebound patients. Verify coverage with your insurance provider before scheduling."
      }
    }
  ]
}

export default function LivoniaMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({ city: 'Livonia', state: 'MI', grouped: 'true' })
        const response = await fetch(`/api/providers/city?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch providers')
        const data = await response.json()
        const allProviders = [...(data.citySpecific || []), ...(data.regional || []), ...(data.statewide || [])]
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Mobile Phlebotomy in Livonia, MI</h1>
            <p className="text-xl text-primary-100 mb-6">
              Professional at-home blood draw services in Livonia. Licensed phlebotomists provide convenient
              lab specimen collection at your home, office, or preferred location.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Mobile Phlebotomy in Livonia</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => { ga4.leadCtaClick({ placement: 'hero' }); setLeadFormOpen(true) }}
                className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 shadow-md"
              >
                📋 Request a Blood Draw
              </button>
              <a href="tel:+1" className="px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-lg border-2 border-primary-600 hover:bg-primary-50">
                📞 Call a Provider
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Featured Provider Card */}
          {!loading && featuredProvider && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-400 rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⭐</span>
                <h2 className="text-2xl font-bold text-gray-900">Featured Provider in Livonia</h2>
              </div>
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{featuredProvider.name}</h3>
                {featuredProvider.description && <p className="text-gray-700 mb-4">{featuredProvider.description}</p>}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {featuredProvider.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <span>📞</span>
                      <span>{featuredProvider.phone}</span>
                    </div>
                  )}
                  {featuredProvider.website && (
                    <div className="flex items-center gap-2">
                      <span>🌐</span>
                      <a href={featuredProvider.website} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-600 hover:text-primary-700 underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
                <ProviderActions provider={featuredProvider} currentLocation="Livonia, MI" variant="compact" />
              </div>
            </div>
          )}

          {!loading && providers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{providers.length} Provider{providers.length !== 1 ? 's' : ''} Serving Livonia</h2>
              <div className="space-y-4">
                {providers.slice(0, 5).map(provider => (
                  <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{provider.name}</h3>
                    {provider.phone && <p className="text-gray-700 mb-2">📞 {provider.phone}</p>}
                    <ProviderActions provider={provider} currentLocation="Livonia, MI" variant="compact" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Now Serving Livonia & Nearby Areas</h2>
            <p className="text-gray-700 mb-4">Mobile phlebotomy available in:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/detroit-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Detroit →</Link>
              <Link href="/dearborn-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Dearborn →</Link>
              <span className="text-gray-600">Farmington Hills</span>
              <span className="text-gray-600">Westland</span>
              <span className="text-gray-600">Redford</span>
              <span className="text-gray-600">All Wayne County</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Expect</h2>
            <div className="space-y-4 text-gray-700">
              <div><h3 className="font-bold text-gray-900 mb-2">1. Schedule Appointment</h3><p>Book a convenient time at your Livonia location. Most providers offer flexible scheduling.</p></div>
              <div><h3 className="font-bold text-gray-900 mb-2">2. Prepare Your Space</h3><p>Have your lab paperwork ready. The phlebotomist brings all sterile equipment.</p></div>
              <div><h3 className="font-bold text-gray-900 mb-2">3. Blood Collection</h3><p>Licensed phlebotomist collects your specimen in 15-30 minutes.</p></div>
              <div><h3 className="font-bold text-gray-900 mb-2">4. Lab Processing</h3><p>Specimens transported to Quest, Labcorp, or your preferred lab.</p></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing & Insurance</h2>
            <p className="text-gray-700 mb-4"><strong>Typical Costs:</strong> Mobile phlebotomy in Livonia costs $60-$150 per visit.</p>
            <p className="text-gray-700"><strong>Insurance:</strong> Many plans cover mobile phlebotomy when medically necessary.</p>
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
        </div>
      </div>

      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Livonia" defaultState="MI" defaultZip="" />
    </div>
  )
}
