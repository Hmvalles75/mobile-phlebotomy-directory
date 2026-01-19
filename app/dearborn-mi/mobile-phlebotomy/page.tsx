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
      "name": "How much does mobile phlebotomy cost in Dearborn, MI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomy services in Dearborn typically cost $60-$150 per visit for the mobile collection fee. Lab testing costs are separate. Many insurance plans cover mobile phlebotomy when medically necessary, and Medicare/Medicaid often cover home visits for homebound patients."
      }
    },
    {
      "@type": "Question",
      "name": "Can I get same-day mobile phlebotomy in Dearborn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, several Dearborn mobile phlebotomy providers offer same-day appointments based on availability. Most providers offer appointments within 24-48 hours. Contact providers directly to check same-day availability for your Dearborn location."
      }
    },
    {
      "@type": "Question",
      "name": "Does insurance cover mobile phlebotomy in Dearborn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Many insurance plans cover mobile phlebotomy in Dearborn, especially when medically necessary or for homebound patients. Medicare and Medicaid often provide coverage. Verify with your insurance provider and the mobile phlebotomy service before scheduling to confirm coverage details."
      }
    },
    {
      "@type": "Question",
      "name": "What areas of Dearborn do mobile phlebotomists serve?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomists serve all of Dearborn including East Dearborn, West Dearborn, Dearborn Heights, and surrounding Wayne County communities. Many providers also cover nearby Detroit, Allen Park, and other metro Detroit areas."
      }
    },
    {
      "@type": "Question",
      "name": "Are Dearborn mobile phlebotomists licensed and certified?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, reputable mobile phlebotomy services in Dearborn employ licensed, certified phlebotomists who meet Michigan state requirements. They follow strict infection control protocols, use sterile equipment, and maintain HIPAA compliance. Always verify credentials when selecting a provider."
      }
    },
    {
      "@type": "Question",
      "name": "How quickly can I get lab results after a mobile blood draw in Dearborn?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Lab results from Dearborn mobile blood draws are typically available within 24-72 hours, depending on the specific tests ordered. Specimens are transported to certified laboratories (Quest, Labcorp, etc.) and processed with the same turnaround times as traditional lab visits."
      }
    }
  ]
}

export default function DearbornMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({
          city: 'Dearborn',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Mobile Phlebotomy in Dearborn, MI
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Professional at-home blood draw services in Dearborn and Wayne County.
              Licensed phlebotomists provide convenient lab specimen collection at your
              home, office, or preferred location.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Request Mobile Phlebotomy in Dearborn
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  ga4.leadCtaClick({ placement: 'hero' })
                  setLeadFormOpen(true)
                }}
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
          {!loading && providers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {providers.length} Provider{providers.length !== 1 ? 's' : ''} Serving Dearborn
              </h2>
              <div className="space-y-4">
                {providers.slice(0, 5).map(provider => (
                  <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{provider.name}</h3>
                    {provider.phone && <p className="text-gray-700 mb-2">📞 {provider.phone}</p>}
                    <ProviderActions provider={provider} currentLocation="Dearborn, MI" variant="compact" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Now Serving Dearborn & Nearby Areas</h2>
            <p className="text-gray-700 mb-4">Mobile phlebotomy available in:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/detroit-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Detroit →</Link>
              <Link href="/livonia-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Livonia →</Link>
              <Link href="/southfield-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Southfield →</Link>
              <span className="text-gray-600">Dearborn Heights</span>
              <span className="text-gray-600">Allen Park</span>
              <span className="text-gray-600">All Wayne County</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Expect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">1. Schedule Appointment</h3>
                <p className="text-gray-700">Book a convenient time at your Dearborn location. Most providers offer flexible scheduling including evenings and weekends.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">2. Prepare Your Space</h3>
                <p className="text-gray-700">Have your lab paperwork ready and ensure a comfortable, well-lit area. The phlebotomist brings all sterile equipment.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">3. Blood Collection</h3>
                <p className="text-gray-700">Licensed phlebotomist collects your specimen in 15-30 minutes using professional, sterile techniques.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">4. Lab Processing</h3>
                <p className="text-gray-700">Specimens transported to Quest, Labcorp, or your preferred lab. Results sent to your doctor within 24-72 hours.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing & Insurance</h2>
            <p className="text-gray-700 mb-4">
              <strong>Typical Costs:</strong> Mobile phlebotomy in Dearborn costs $60-$150 per visit for the convenience fee, plus lab testing charges billed separately.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Insurance Coverage:</strong> Many insurance plans cover mobile phlebotomy when medically necessary. Medicare/Medicaid often cover home visits for homebound patients.
            </p>
            <p className="text-sm text-gray-600 italic">
              Always verify coverage with your insurance provider before scheduling.
            </p>
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

      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Dearborn" defaultState="MI" defaultZip="" />
    </div>
  )
}
