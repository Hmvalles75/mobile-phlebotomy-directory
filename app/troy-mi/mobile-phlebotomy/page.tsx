'use client'
import { useState } from 'react'
import Link from 'next/link'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { ga4 } from '@/lib/ga4'

export default function TroyMobilePhlebotomy() {
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Mobile Phlebotomy in Troy, MI</h1>
          <p className="text-xl text-primary-100">Professional at-home blood draw services in Troy and Oakland County.</p>
        </div>
      </div>
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 text-center">
          <button onClick={() => { ga4.leadCtaClick({ placement: 'hero' }); setLeadFormOpen(true) }} className="px-8 py-4 bg-primary-600 text-white font-bold rounded-lg">Request a Blood Draw</button>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Now Serving Troy and Nearby Areas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/detroit-mi/mobile-phlebotomy" className="text-primary-600 hover:underline">Detroit</Link>
            <span className="text-gray-600">Royal Oak</span>
            <span className="text-gray-600">Sterling Heights</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">What to Expect</h2>
          <p className="text-gray-700">Licensed phlebotomists come to your Troy location for convenient blood draws. Appointments typically within 24-48 hours.</p>
        </div>
      </div>
      <LeadFormModal isOpen={leadFormOpen} onClose={() => setLeadFormOpen(false)} defaultCity="Troy" defaultState="MI" defaultZip="" />
    </div>
  )
}
