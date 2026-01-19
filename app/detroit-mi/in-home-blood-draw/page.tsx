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
      "name": "What is in-home blood draw service in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In-home blood draw service in Detroit brings certified phlebotomists directly to your residence for lab specimen collection. This eliminates the need to travel to a lab or clinic, providing convenience for busy professionals, elderly patients, families with children, or anyone who prefers the comfort of their own home."
      }
    },
    {
      "@type": "Question",
      "name": "How much does an in-home blood draw cost in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In-home blood draw services in Detroit typically cost between $60-$150 for the mobile visit fee. This is in addition to any laboratory testing charges. Many providers accept insurance coverage for medically necessary draws, and Medicare/Medicaid often cover home visits for homebound patients."
      }
    },
    {
      "@type": "Question",
      "name": "Is an in-home blood draw as accurate as going to a lab?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, in-home blood draws in Detroit are just as accurate as traditional lab visits. Licensed phlebotomists use the same sterile equipment, proper collection techniques, and specimen handling protocols. Samples are transported to the same certified laboratories (Quest, Labcorp, etc.) that process clinic-based draws."
      }
    },
    {
      "@type": "Question",
      "name": "What do I need for an in-home blood draw in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You'll need a valid lab requisition from your doctor, photo ID, and insurance information (if applicable). The phlebotomist brings all necessary equipment including needles, tubes, tourniquet, and supplies. You should have a comfortable chair or seating area with good lighting."
      }
    },
    {
      "@type": "Question",
      "name": "How quickly can I schedule an in-home blood draw in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most Detroit in-home blood draw providers offer appointments within 24-48 hours. Some services provide same-day or next-day availability for urgent needs. Evening and weekend appointments are often available to accommodate work schedules."
      }
    },
    {
      "@type": "Question",
      "name": "Do in-home blood draw services serve all of Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most in-home blood draw providers serve all of Detroit proper plus surrounding communities including Dearborn, Livonia, Troy, Southfield, Warren, and other Wayne County areas. Some also cover Oakland and Macomb counties. Confirm your specific address is within the service area when booking."
      }
    }
  ]
}

export default function DetroitInHomeBloodDraw() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProviders() {
      try {
        const params = new URLSearchParams({ city: 'Detroit', state: 'MI', grouped: 'true' })
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
              In-Home Blood Draw Services in Detroit, MI
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Professional blood collection in the comfort of your Detroit home.
              Licensed phlebotomists provide convenient, safe, and accurate specimen collection
              without the hassle of traveling to a lab or clinic.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Same Accuracy as Lab Visits</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Flexible Scheduling</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Sterile Equipment</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Medicare Accepted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Schedule Your In-Home Blood Draw in Detroit
            </h2>
            <p className="text-gray-600 mb-6">
              Connect with certified phlebotomists serving your Detroit neighborhood
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  ga4.leadCtaClick({ placement: 'hero' })
                  setLeadFormOpen(true)
                }}
                className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-xl"
              >
                📋 Request an In-Home Visit
              </button>
              <a
                href="tel:+1"
                className="px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-all"
              >
                📞 Call to Schedule
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
              In-Home Blood Draws in Nearby Detroit Metro Areas
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
                <span className="text-sm text-gray-600 group-hover:text-primary-600">In-home blood draws →</span>
              </Link>

              <Link
                href="/livonia-mi/mobile-phlebotomy"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Livonia</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">In-home blood draws →</span>
              </Link>

              <Link
                href="/troy-mi/mobile-phlebotomy"
                className="block p-5 bg-gray-50 rounded-lg hover:bg-primary-50 hover:shadow-md border-2 border-gray-200 hover:border-primary-300 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📍</span>
                  <span className="font-bold text-gray-900">Troy</span>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-primary-600">In-home blood draws →</span>
              </Link>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Why Choose In-Home Blood Draw Services in Detroit?
            </h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>
                In-home blood draw services have become increasingly popular throughout Detroit and Wayne County,
                offering a convenient alternative to traditional lab visits. Instead of driving to a clinic,
                waiting in line, and potentially exposing yourself to illness, certified phlebotomists come
                directly to your residence.
              </p>
              <p>
                This service is particularly valuable for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Elderly patients</strong> who have difficulty traveling or mobility limitations</li>
                <li><strong>Busy professionals</strong> who can't take time off work for lab visits</li>
                <li><strong>Parents with young children</strong> who prefer to avoid clinic settings</li>
                <li><strong>Patients recovering from surgery or illness</strong> who need to stay home</li>
                <li><strong>Anyone seeking convenience</strong> and a more comfortable blood draw experience</li>
              </ul>
              <p>
                Licensed phlebotomists bring all necessary sterile equipment and follow the exact same protocols
                used in traditional labs. Your samples are properly collected, labeled, and transported to
                certified laboratories for testing. Results are sent to your physician just as they would be
                from any lab visit.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              How In-Home Blood Draws Work in Detroit
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Get Your Lab Order</h3>
                  <p className="text-gray-700">
                    Your doctor provides a lab requisition specifying which blood tests are needed.
                    This is required for any blood draw service, whether at a clinic or in your home.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Schedule Your Visit</h3>
                  <p className="text-gray-700">
                    Contact an in-home blood draw provider serving Detroit. Schedule a convenient
                    time—most offer early morning, evening, and weekend appointments. Provide your
                    Detroit address and any special access instructions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Prepare Your Home</h3>
                  <p className="text-gray-700">
                    Follow any fasting instructions from your doctor. Set up a comfortable chair
                    in a well-lit area. Have your lab paperwork and ID ready. The phlebotomist
                    brings all collection supplies and equipment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Blood Collection</h3>
                  <p className="text-gray-700">
                    The certified phlebotomist arrives at your home, verifies your identity, reviews
                    the lab orders, and collects your blood sample. The process typically takes
                    15-30 minutes and uses sterile, single-use equipment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  5
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Lab Processing & Results</h3>
                  <p className="text-gray-700">
                    Your specimen is transported to the designated laboratory (Quest, Labcorp, etc.)
                    for testing. Results are typically available within 24-72 hours and sent directly
                    to your ordering physician or posted to your patient portal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              In-Home Blood Draw Costs in Detroit
            </h2>
            <p className="text-gray-700 mb-4">
              In-home blood draw services in Detroit typically charge a mobile visit fee of <strong>$60-$150</strong>
              for the phlebotomist to come to your home. This covers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>Travel time to your Detroit residence</li>
              <li>Professional phlebotomy services</li>
              <li>Sterile equipment and supplies</li>
              <li>Specimen transport to the laboratory</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Laboratory testing costs are separate and billed by the lab. Many insurance plans cover the lab work
              when ordered by a physician. Some insurance plans also cover the mobile visit fee, especially for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Homebound patients under Medicare/Medicaid</li>
              <li>Medically necessary home visits</li>
              <li>Patients with documented mobility limitations</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Insurance Tip:</strong> Call your insurance provider before scheduling to verify coverage
                for "mobile phlebotomy" or "home blood draw services." Many plans cover this benefit but don't
                advertise it widely.
              </p>
            </div>
          </div>

          {/* FAQ Section */}
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

          {/* Areas Served */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Detroit Areas We Serve
            </h2>
            <p className="text-gray-700 mb-4">
              In-home blood draw services are available throughout Detroit and surrounding Wayne County communities:
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Link href="/dearborn-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Dearborn →</Link>
              <Link href="/livonia-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Livonia →</Link>
              <Link href="/troy-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Troy →</Link>
              <Link href="/southfield-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Southfield →</Link>
              <Link href="/warren-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Warren →</Link>
              <span className="text-gray-600">Westland</span>
              <span className="text-gray-600">Redford</span>
              <span className="text-gray-600">Farmington Hills</span>
              <span className="text-gray-600">Royal Oak</span>
            </div>
            <p className="text-sm text-gray-600">
              Coverage areas vary by provider. Most serve all of Wayne County, and many extend to Oakland and Macomb counties.
            </p>
          </div>

          {/* Related Pages */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Detroit Blood Draw Services
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/detroit-mi/mobile-phlebotomy"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Mobile Phlebotomy Detroit</h3>
                <p className="text-sm text-gray-600">Main Detroit services page →</p>
              </Link>
              <Link
                href="/detroit-mi/mobile-phlebotomist"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Find a Mobile Phlebotomist</h3>
                <p className="text-sm text-gray-600">Directory of Detroit providers →</p>
              </Link>
              <Link
                href="/detroit-mi/blood-draw-at-home"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Blood Draw at Home</h3>
                <p className="text-sm text-gray-600">Home blood testing options →</p>
              </Link>
              <Link
                href="/detroit-mi/lab-draw-at-home"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-1">Lab Draw at Home</h3>
                <p className="text-sm text-gray-600">Home lab collection services →</p>
              </Link>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg p-8 shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Schedule Your In-Home Blood Draw?
            </h2>
            <p className="text-primary-100 mb-6">
              Skip the lab visit—get professional blood collection at your Detroit home
            </p>
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'inline' })
                setLeadFormOpen(true)
              }}
              className="px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition-all shadow-md"
            >
              📋 Request Your Visit
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
