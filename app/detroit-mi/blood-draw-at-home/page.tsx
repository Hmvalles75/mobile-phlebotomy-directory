'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { ga4 } from '@/lib/ga4'

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is blood draw at home as accurate as a lab visit in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, blood draws performed at home in Detroit are just as accurate as clinic-based draws. Licensed phlebotomists use identical sterile equipment, proper collection techniques, and specimen handling protocols. Samples go to the same certified labs (Quest, Labcorp) that process clinic specimens."
      }
    },
    {
      "@type": "Question",
      "name": "Who can benefit from blood draw at home services in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blood draw at home in Detroit benefits elderly patients with mobility issues, busy professionals, parents with young children, patients recovering from surgery, immunocompromised individuals avoiding public spaces, and anyone seeking convenience and comfort for their lab work."
      }
    },
    {
      "@type": "Question",
      "name": "What equipment does the phlebotomist bring for home blood draws?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Detroit mobile phlebotomists bring all necessary sterile equipment including needles, collection tubes, tourniquets, alcohol wipes, bandages, sharps container, and a biohazard transport cooler. You don't need to provide any supplies—just a comfortable chair and well-lit area."
      }
    },
    {
      "@type": "Question",
      "name": "Can I get fasting blood work done at home in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, fasting blood work can be done at home in Detroit. Schedule an early morning appointment before eating or drinking (except water). The phlebotomist will collect your fasting specimens at your home, allowing you to eat immediately after rather than waiting at a lab."
      }
    },
    {
      "@type": "Question",
      "name": "How much does blood draw at home cost in Detroit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Blood draw at home in Detroit typically costs $60-$150 for the mobile visit fee. Lab testing costs are separate. Many insurance plans cover both the mobile fee and lab work, especially for homebound patients or when medically necessary. Verify coverage before scheduling."
      }
    }
  ]
}

export default function DetroitBloodDrawAtHome() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blood Draw at Home in Detroit, MI
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Skip the lab visit—get professional blood draws in the comfort of your Detroit home.
              Certified phlebotomists provide convenient, accurate specimen collection with same-day
              and next-day availability.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Request a Blood Draw at Your Detroit Home
            </h2>
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'hero' })
                setLeadFormOpen(true)
              }}
              className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700 shadow-md"
            >
              📋 Schedule a Home Blood Draw
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Why Choose Blood Draw at Home in Detroit?
            </h2>
            <p className="text-gray-700 mb-4">
              Blood draw at home services bring the lab to you, eliminating travel time, waiting rooms,
              and potential exposure to illness. This is particularly valuable for Detroit residents who:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>Have mobility limitations or chronic conditions making travel difficult</li>
              <li>Cannot afford to take time off work for lab appointments</li>
              <li>Prefer the privacy and comfort of their own home</li>
              <li>Are recovering from surgery or illness and need to minimize outings</li>
              <li>Have anxiety about medical settings or needles (home environment helps relaxation)</li>
              <li>Care for young children or elderly family members and can't leave home easily</li>
            </ul>
            <p className="text-gray-700">
              Licensed phlebotomists arrive with all sterile equipment, collect your blood sample,
              and transport it to certified laboratories—all while you stay comfortable at home.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              How Blood Draw at Home Works
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">1</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Get Your Doctor's Order</h3>
                  <p className="text-gray-700">Your physician provides a lab requisition specifying which blood tests are needed.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">2</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Schedule Your Appointment</h3>
                  <p className="text-gray-700">Book a convenient time slot—many providers offer early morning, evening, and weekend appointments.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">3</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Prepare Your Space</h3>
                  <p className="text-gray-700">Set up a comfortable chair in a well-lit area. The phlebotomist brings all necessary equipment.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">4</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Quick Collection</h3>
                  <p className="text-gray-700">The phlebotomist collects your blood sample in 15-30 minutes using sterile, single-use equipment.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">5</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Lab Processing</h3>
                  <p className="text-gray-700">Your specimen is transported to the lab. Results typically available in 24-72 hours via your doctor or patient portal.</p>
                </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detroit Areas Served</h2>
            <p className="text-gray-700 mb-4">Blood draw at home services available throughout:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/dearborn-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Dearborn →</Link>
              <Link href="/livonia-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Livonia →</Link>
              <Link href="/troy-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Troy →</Link>
              <Link href="/southfield-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Southfield →</Link>
              <Link href="/warren-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Warren →</Link>
              <span className="text-gray-600">All Wayne County</span>
            </div>
          </div>
        </div>
      </div>

      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Detroit" defaultState="MI" defaultZip="" />
    </div>
  )
}
