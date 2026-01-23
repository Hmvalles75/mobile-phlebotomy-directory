'use client'
import { useState } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { ga4 } from '@/lib/ga4'

export default function NYCBloodDrawAtHome() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Blood Draw at Home in New York City</h1>
          <p className="text-xl text-primary-100">Professional mobile phlebotomy services across New York City — request same-day or next-day availability when scheduling allows.</p>
        </div>
      </div>
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 text-center">
          <button onClick={() => { ga4.leadCtaClick({ placement: 'hero' }); setLeadFormOpen(true) }} className="px-8 py-4 bg-primary-600 text-white font-bold rounded-lg">Request a Blood Draw</button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg border-2 border-primary-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Blood Draw at Home Services in New York City
          </h2>
          <p className="text-gray-700 mb-6">
            Looking for blood draw at home services in NYC? Browse our comprehensive directory of mobile phlebotomy providers serving all five boroughs.
          </p>

          <Link
            href="/new-york-ny/mobile-phlebotomy"
            className="block bg-gradient-to-br from-primary-50 to-white rounded-lg p-5 hover:from-primary-100 hover:to-primary-50 hover:shadow-md border-2 border-primary-200 hover:border-primary-400 transition-all group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏙️</span>
              <span className="font-bold text-gray-900 text-lg">View All NYC Mobile Phlebotomy Providers</span>
            </div>
            <span className="text-sm text-primary-600 group-hover:text-primary-700 font-medium">Browse providers in all five boroughs →</span>
          </Link>

          <div className="pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={() => {
                ga4.leadCtaClick({ placement: 'metro_links' })
                setLeadFormOpen(true)
              }}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
            >
              📋 Request Service in NYC
            </button>
          </div>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="New York" defaultState="NY" defaultZip="" />
    </div>
  )
}
