'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { ga4 } from '@/lib/ga4'

const detroitSuburbs = [
  { name: 'Dearborn', slug: 'dearborn-mi' },
  { name: 'Livonia', slug: 'livonia-mi' },
  { name: 'Troy', slug: 'troy-mi' },
  { name: 'Southfield', slug: 'southfield-mi' },
  { name: 'Warren', slug: 'warren-mi' }
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is mobile phlebotomy in Detroit, MI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomy in Detroit brings certified phlebotomists directly to your home, office, or preferred location for blood draws and lab specimen collection. This service eliminates travel to traditional labs and provides convenient, professional care throughout Wayne County and the greater Detroit metro area."
      }
    },
    {
      "@type": "Question",
      "name": "How much does mobile phlebotomy cost in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile blood draw services in Detroit typically cost between $60-$150 per visit, depending on the provider, location within the metro area, and urgency. Many providers accept insurance coverage, and Medicare/Medicaid may cover the service for homebound patients. Always confirm pricing and insurance acceptance before booking."
      }
    },
    {
      "@type": "Question",
      "name": "What areas of Detroit do mobile phlebotomists serve?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomy providers serve all of Detroit proper plus surrounding areas including Dearborn, Livonia, Troy, Southfield, Warren, and other Wayne County communities. Many providers also serve Oakland and Macomb counties. Coverage areas vary by provider, so confirm your specific location when booking."
      }
    },
    {
      "@type": "Question",
      "name": "How quickly can I get a mobile blood draw appointment in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most Detroit mobile phlebotomy providers offer appointments within 24-48 hours. Some providers offer same-day or next-day service for urgent needs. Availability depends on your location, the time of day, and current demand. Request a visit to check real-time availability."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a doctor's order for mobile phlebotomy in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, mobile phlebotomy services require a valid lab requisition or doctor's order. Your physician will provide the necessary paperwork specifying which tests to perform. The mobile phlebotomist will collect the specimens and deliver them to your designated laboratory (Quest, Labcorp, or other)."
      }
    },
    {
      "@type": "Question",
      "name": "Is mobile phlebotomy covered by insurance in Detroit, MI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Insurance coverage for mobile phlebotomy in Detroit varies by plan. The lab testing itself is often covered when ordered by a physician, but the mobile collection fee may be out-of-pocket. Medicare and Medicaid typically cover mobile visits for homebound patients. Contact your insurance provider and the mobile phlebotomy service to verify coverage before your appointment."
      }
    },
    {
      "@type": "Question",
      "name": "Are mobile phlebotomists in Detroit licensed and certified?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, reputable mobile phlebotomy services in Detroit employ licensed, certified phlebotomists who meet Michigan state requirements. They follow strict infection control protocols, use sterile equipment, and maintain HIPAA compliance. Always verify credentials and ask about certifications when selecting a provider."
      }
    },
    {
      "@type": "Question",
      "name": "What types of blood tests can be done with mobile phlebotomy in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mobile phlebotomists in Detroit can collect specimens for most standard blood tests including routine lab work, cholesterol panels, metabolic panels, thyroid tests, glucose monitoring, vitamin levels, hormone testing, and more. Specialized tests may require specific handling or lab partnerships. Discuss your testing needs with the provider when scheduling."
      }
    }
  ]
}

export default function DetroitMobilePhlebotomy() {
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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Mobile Phlebotomy in Detroit, MI
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Professional at-home blood draw services throughout Detroit and Wayne County.
              Licensed phlebotomists come to your home, office, or preferred location for convenient,
              stress-free lab specimen collection.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>24-48 Hour Appointments</span>
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
              Request a Mobile Phlebotomy Visit in Detroit
            </h2>
            <p className="text-gray-600 mb-6">
              Get matched with a certified local provider for at-home blood draws
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
                📞 Call a Detroit Provider
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Detroit Metro Areas We Serve - PRIMARY INTERNAL LINKING HUB */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-lg border-2 border-primary-100 p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Detroit Metro Areas We Serve
            </h2>
            <p className="text-gray-700 mb-6">
              Our network of mobile phlebotomists serves Detroit and surrounding communities
              throughout Wayne County. Select your area to find local providers:
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {detroitSuburbs.map(suburb => (
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
                Also serving: Westland, Redford, Farmington Hills, Royal Oak, Sterling Heights,
                and all Wayne, Oakland, and Macomb County communities
              </p>
            </div>
          </div>
        </div>

        {/* Related Detroit Services - INTENT VARIANTS */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Detroit Mobile Phlebotomy Services
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/detroit-mi/in-home-blood-draw"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md transition-all border-2 border-transparent hover:border-primary-300"
              >
                <h3 className="font-bold text-gray-900 mb-2 text-lg">In-Home Blood Draw Services</h3>
                <p className="text-sm text-gray-600">Detroit at-home blood collection →</p>
              </Link>
              <Link
                href="/detroit-mi/mobile-phlebotomist"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md transition-all border-2 border-transparent hover:border-primary-300"
              >
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Mobile Phlebotomist Directory</h3>
                <p className="text-sm text-gray-600">Find Detroit mobile phlebotomists →</p>
              </Link>
              <Link
                href="/detroit-mi/blood-draw-at-home"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md transition-all border-2 border-transparent hover:border-primary-300"
              >
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Blood Draw at Home</h3>
                <p className="text-sm text-gray-600">Convenient home blood testing →</p>
              </Link>
              <Link
                href="/detroit-mi/lab-draw-at-home"
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
                    )}
                    {featuredProvider.website && (
                      <div className="flex items-center gap-2">
                        <span className="text-primary-600">🌐</span>
                        <a
                          href={featuredProvider.website}
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

                <ProviderActions
                  provider={featuredProvider}
                  currentLocation="Detroit, MI"
                  variant="compact"
                />
              </div>
            </div>
          </div>
        )}

        {/* What to Expect Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              What to Expect with Mobile Phlebotomy in Detroit
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Schedule Your Appointment</h3>
                  <p className="text-gray-700">
                    Contact a mobile phlebotomy provider or submit a request through our platform.
                    Provide your location in Detroit, preferred date/time, and lab requisition details.
                    Most providers offer flexible scheduling including evenings and weekends.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Prepare for Your Visit</h3>
                  <p className="text-gray-700">
                    Follow any fasting or preparation instructions from your doctor. Have your
                    lab requisition form ready and ensure you have a comfortable, well-lit area
                    for the blood draw. The phlebotomist will bring all necessary sterile equipment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Professional Collection</h3>
                  <p className="text-gray-700">
                    The certified phlebotomist arrives at your Detroit location at the scheduled time.
                    They'll verify your identity, review your lab orders, and collect blood samples
                    using sterile, single-use equipment. The process typically takes 15-30 minutes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Lab Delivery & Results</h3>
                  <p className="text-gray-700">
                    Your specimens are properly labeled and transported to the designated laboratory
                    (Quest, Labcorp, or other). Results are sent directly to your ordering physician
                    or posted to your lab portal, typically within 24-72 hours depending on the tests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Insurance Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Pricing & Insurance Coverage in Detroit
            </h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Typical Costs</h3>
              <p className="text-gray-700 mb-4">
                Mobile phlebotomy services in the Detroit area typically charge between <strong>$60-$150 per visit</strong>
                for the convenience fee. This covers the phlebotomist's travel time, professional services,
                and specimen transport. Lab testing costs are separate and billed by the laboratory.
              </p>
              <p className="text-sm text-gray-600 italic">
                Pricing varies by provider, distance traveled, urgency (same-day vs. scheduled),
                and whether multiple household members are being drawn. Contact providers directly for exact quotes.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Insurance Coverage</h3>
              <p className="text-gray-700 mb-4">
                Many Detroit-area mobile phlebotomy providers accept insurance for the mobile collection fee,
                especially when medically necessary. Coverage typically includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Medicare/Medicaid:</strong> Often covers mobile visits for homebound patients or those with mobility limitations</li>
                <li><strong>Private Insurance:</strong> Coverage varies by plan; check with your carrier about mobile phlebotomy benefits</li>
                <li><strong>Lab Testing:</strong> When ordered by a physician, lab work is typically covered according to your plan's lab benefits</li>
              </ul>
              <p className="text-sm text-gray-600 italic">
                Always verify coverage with both your insurance provider and the mobile phlebotomy service before booking.
                Some providers operate on a cash-pay basis for the visit fee even when the lab itself is in-network.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Pro Tip:</strong> When calling your insurance, ask specifically about "mobile phlebotomy"
                or "home blood draw" coverage. Provide the provider's billing information to confirm whether
                they're in-network.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map((faq, index) => (
                <div key={index} className="pb-6 border-b border-gray-200 last:border-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {faq.name}
                  </h3>
                  <p className="text-gray-700">
                    {faq.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Pages */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              More Detroit Mobile Phlebotomy Resources
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/detroit-mi/in-home-blood-draw"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">In-Home Blood Draw Services</h3>
                <p className="text-sm text-gray-600">Detroit at-home blood collection →</p>
              </Link>
              <Link
                href="/detroit-mi/mobile-phlebotomist"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Mobile Phlebotomist Directory</h3>
                <p className="text-sm text-gray-600">Find Detroit mobile phlebotomists →</p>
              </Link>
              <Link
                href="/detroit-mi/blood-draw-at-home"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Blood Draw at Home</h3>
                <p className="text-sm text-gray-600">Convenient home blood testing →</p>
              </Link>
              <Link
                href="/detroit-mi/lab-draw-at-home"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Lab Draw at Home</h3>
                <p className="text-sm text-gray-600">Home lab specimen collection →</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Schedule Your Mobile Blood Draw?
            </h2>
            <p className="text-primary-100 mb-6">
              Connect with certified mobile phlebotomists serving Detroit and surrounding areas
            </p>
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'inline' })
                setLeadFormOpen(true)
              }}
              className="px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition-all shadow-md"
            >
              📋 Request a Visit Now
            </button>
          </div>
        </div>
      </div>

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={leadFormOpen}
        onClose={() => setLeadFormOpen(false)}
        defaultCity="Detroit"
        defaultState="MI"
        defaultZip=""
      />
    </div>
  )
}
