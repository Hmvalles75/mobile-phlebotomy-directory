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
      "name": "What is lab draw at home service in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Lab draw at home in Detroit means a mobile phlebotomist comes to your residence to collect blood or other specimens for laboratory testing. The samples are transported to certified labs like Quest or Labcorp for analysis, with results sent to your doctor—just like a traditional lab visit but without leaving home."
      }
    },
    {
      "@type": "Question",
      "name": "Which labs do Detroit home phlebotomists work with?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Detroit mobile phlebotomy services typically partner with major laboratories including Quest Diagnostics, Labcorp, and regional labs. When scheduling, specify which lab your doctor prefers or which is in-network with your insurance. Most providers can accommodate your lab preference."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use insurance for lab draw at home in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, many Detroit patients use insurance for lab draw at home services. Lab testing is often covered when ordered by a physician. The mobile collection fee may be covered for homebound patients or when medically necessary. Check with your insurance about mobile phlebotomy benefits."
      }
    },
    {
      "@type": "Question",
      "name": "How long does lab draw at home take in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A typical lab draw at home in Detroit takes 15-30 minutes from start to finish. This includes verifying your identity, reviewing lab orders, collecting specimens, and cleanup. The phlebotomist brings all equipment and handles everything efficiently."
      }
    },
    {
      "@type": "Question",
      "name": "When will I get my lab results after a home draw?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Lab results after a Detroit home draw are typically available within 24-72 hours, depending on the specific tests ordered. Results are sent to your ordering physician and may be posted to your patient portal. Turnaround time is the same as traditional lab visits."
      }
    }
  ]
}

export default function DetroitLabDrawAtHome() {
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
              Lab Draw at Home in Detroit, MI
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Complete your lab work from home in Detroit. Professional specimen collection with
              transport to Quest, Labcorp, and other certified laboratories. Convenient, accurate,
              and fully compliant with medical standards.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Schedule Your Lab Draw at Home
            </h2>
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'hero' })
                setLeadFormOpen(true)
              }}
              className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 shadow-md"
            >
              📋 Request a Home Lab Draw
            </button>
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
                <h2 className="text-2xl font-bold text-gray-900">Featured Provider in Detroit</h2>
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
                <ProviderActions provider={featuredProvider} currentLocation="Detroit, MI" variant="compact" />
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Lab Draw at Home: How It Works
            </h2>
            <p className="text-gray-700 mb-6">
              Lab draw at home services in Detroit eliminate the need to visit a Quest or Labcorp patient service center.
              A licensed phlebotomist comes to your residence, collects your specimens according to your doctor's orders,
              and transports them to the designated laboratory for processing.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Important:</strong> Lab draw at home provides the same accuracy and reliability as clinic-based collection.
                Samples are handled with identical protocols and processed by the same certified laboratories your doctor trusts.
              </p>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Common Lab Tests Performed at Home:</h3>
            <ul className="grid md:grid-cols-2 gap-2 text-gray-700">
              <li>• Routine blood panels</li>
              <li>• Cholesterol testing</li>
              <li>• Diabetes monitoring (A1C, glucose)</li>
              <li>• Thyroid function tests</li>
              <li>• Vitamin & mineral levels</li>
              <li>• Hormone testing</li>
              <li>• Metabolic panels</li>
              <li>• Liver & kidney function</li>
              <li>• PSA screening</li>
              <li>• CBC (Complete Blood Count)</li>
              <li>• Drug testing</li>
              <li>• And many more...</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Why Choose Lab Draw at Home in Detroit?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Convenience</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• No travel to lab locations</li>
                  <li>• No waiting rooms</li>
                  <li>• Flexible scheduling (mornings, evenings, weekends)</li>
                  <li>• Same-day appointments available</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Professional Service</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Licensed, certified phlebotomists</li>
                  <li>• Sterile equipment & proper protocols</li>
                  <li>• HIPAA-compliant handling</li>
                  <li>• Direct lab partnerships</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Lab Partnerships in Detroit
            </h2>
            <p className="text-gray-700 mb-4">
              Detroit mobile phlebotomy providers work with all major laboratories:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔬</span>
                <div>
                  <h3 className="font-bold text-gray-900">Quest Diagnostics</h3>
                  <p className="text-sm text-gray-600">Nationwide lab with extensive test menu and insurance acceptance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔬</span>
                <div>
                  <h3 className="font-bold text-gray-900">Labcorp</h3>
                  <p className="text-sm text-gray-600">Comprehensive testing services with broad provider network</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔬</span>
                <div>
                  <h3 className="font-bold text-gray-900">Regional & Specialty Labs</h3>
                  <p className="text-sm text-gray-600">Hospital-affiliated and specialty testing facilities as needed</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 italic">
              When booking, specify which lab your doctor prefers or which is in-network with your insurance.
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

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Services</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/detroit-mi/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-1">Mobile Phlebotomy Detroit</h3>
                <p className="text-sm text-gray-600">Main services page →</p>
              </Link>
              <Link href="/detroit-mi/in-home-blood-draw" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-1">In-Home Blood Draw</h3>
                <p className="text-sm text-gray-600">Home collection services →</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Detroit" defaultState="MI" defaultZip="" />
    </div>
  )
}
