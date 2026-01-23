'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { ga4 } from '@/lib/ga4'

export default function LAInHomeBloodDraw() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              In-Home Blood Draw Services in Los Angeles, CA
            </h1>
            <p className="text-xl text-primary-100">
              Professional blood draws performed in the comfort of your Los Angeles home. Same-day & next-day availability.
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
            Request In-Home Blood Draw
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <div className="bg-white rounded-lg shadow-lg border-2 border-primary-100 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Convenient At-Home Blood Collection in Los Angeles
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            In-home blood draw services bring licensed phlebotomists directly to your Los Angeles residence
            for professional specimen collection. Whether you live in downtown LA, the Westside, San Fernando Valley,
            or anywhere in Los Angeles County, our network provides convenient, stress-free blood draws without
            the need to visit a traditional lab.
          </p>
          <div className="mb-6">
            <Link
              href="/los-angeles-ca/mobile-phlebotomy"
              className="text-primary-600 hover:text-primary-700 font-bold text-lg underline"
            >
              View all Los Angeles mobile phlebotomy services →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Choose In-Home Blood Draws?
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-primary-600">✓</span>
              <span className="text-gray-700">No travel required—phlebotomist comes to your home</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600">✓</span>
              <span className="text-gray-700">Same-day and next-day appointments available</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600">✓</span>
              <span className="text-gray-700">Comfortable, private environment</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600">✓</span>
              <span className="text-gray-700">Ideal for seniors, homebound patients, and busy professionals</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600">✓</span>
              <span className="text-gray-700">Licensed, certified phlebotomists with sterile equipment</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Serving Los Angeles & Nearby Communities
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/pasadena-ca/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 border-2 border-transparent hover:border-primary-300 transition-all">
              <span className="font-bold text-gray-900">Pasadena →</span>
            </Link>
            <Link href="/santa-monica-ca/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 border-2 border-transparent hover:border-primary-300 transition-all">
              <span className="font-bold text-gray-900">Santa Monica →</span>
            </Link>
            <Link href="/burbank-ca/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 border-2 border-transparent hover:border-primary-300 transition-all">
              <span className="font-bold text-gray-900">Burbank →</span>
            </Link>
            <Link href="/glendale-ca/mobile-phlebotomy" className="block p-4 bg-gray-50 rounded-lg hover:bg-primary-50 border-2 border-transparent hover:border-primary-300 transition-all">
              <span className="font-bold text-gray-900">Glendale →</span>
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t">
            <Link
              href="/los-angeles-ca/mobile-phlebotomy"
              className="text-primary-600 hover:text-primary-700 font-bold underline"
            >
              View all Los Angeles metro areas we serve →
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">
            Schedule Your In-Home Blood Draw Today
          </h2>
          <p className="text-primary-100 mb-6">
            Same-day & next-day appointments available throughout Los Angeles County
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
