'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { ga4 } from '@/lib/ga4'

export default function LABloodDrawAtHome() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blood Draw at Home in Los Angeles, CA
            </h1>
            <p className="text-xl text-primary-100">
              Convenient home blood testing services in Los Angeles. Licensed phlebotomists bring the lab to you.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 text-center">
          <button
            onClick={() => {
              ga4.leadCtaClick({ placement: 'hero' })
              setLeadFormOpen(true)
            }}
            className="px-8 py-4 bg-primary-600 text-white font-bold text-lg rounded-lg hover:bg-primary-700"
          >
            Request Blood Draw at Home
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <div className="bg-white rounded-lg shadow-lg border-2 border-primary-100 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Professional Blood Draws in Your Los Angeles Home
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Get your blood work done without leaving home. Our network of certified mobile phlebotomists serves
            all of Los Angeles County, providing the same quality specimen collection as traditional labs—just
            more convenient. Skip the traffic, wait times, and stress of visiting a lab facility.
          </p>
          <div className="mb-6">
            <Link
              href="/los-angeles-ca/mobile-phlebotomy"
              className="text-primary-600 hover:text-primary-700 font-bold text-lg underline"
            >
              Learn more about Los Angeles mobile phlebotomy →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How At-Home Blood Draws Work
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Get Doctor's Orders</h3>
                <p className="text-gray-700">Your physician provides lab requisition paperwork</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Schedule Visit</h3>
                <p className="text-gray-700">Choose same-day, next-day, or scheduled appointment</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Phlebotomist Arrives</h3>
                <p className="text-gray-700">Certified professional comes to your home with sterile equipment</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Get Results</h3>
                <p className="text-gray-700">Specimens sent to lab; results delivered to your doctor as normal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Los Angeles Communities We Serve
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/long-beach-ca/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 border-2 border-transparent hover:border-primary-300 transition-all">
              <span className="font-bold text-gray-900">Long Beach →</span>
            </Link>
            <Link href="/torrance-ca/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 border-2 border-transparent hover:border-primary-300 transition-all">
              <span className="font-bold text-gray-900">Torrance →</span>
            </Link>
            <Link href="/west-hollywood-ca/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 border-2 border-transparent hover:border-primary-300 transition-all">
              <span className="font-bold text-gray-900">West Hollywood →</span>
            </Link>
            <Link href="/beverly-hills-ca/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 border-2 border-transparent hover:border-primary-300 transition-all">
              <span className="font-bold text-gray-900">Beverly Hills →</span>
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t">
            <Link
              href="/los-angeles-ca/mobile-phlebotomy"
              className="text-primary-600 hover:text-primary-700 font-bold underline"
            >
              View all Los Angeles metro areas →
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready for Your At-Home Blood Draw?
          </h2>
          <p className="text-primary-100 mb-6">
            Request same-day or next-day service in Los Angeles County
          </p>
          <button
            onClick={() => {
              ga4.leadCtaClick({ placement: 'bottom' })
              setLeadFormOpen(true)
            }}
            className="px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-lg hover:bg-gray-100"
          >
            Request Service Now
          </button>
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
