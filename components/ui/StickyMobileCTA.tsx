'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'
import { ga4 } from '@/lib/ga4'
import { LeadFormModal } from '@/components/ui/LeadFormModal'

interface StickyMobileCTAProps {
  cityNumber?: string
  defaultCity?: string
  defaultState?: string
  defaultZip?: string
}

export function StickyMobileCTA({
  cityNumber,
  defaultCity,
  defaultState,
  defaultZip
}: StickyMobileCTAProps) {
  const [leadFormOpen, setLeadFormOpen] = useState(false)

  const handleRequestClick = () => {
    ga4.leadCtaClick({ placement: 'sticky' })
    ga4.leadFormOpen({ city: defaultCity, state: defaultState, zip: defaultZip })
    setLeadFormOpen(true)
  }

  const handleCallClick = () => {
    ga4.providerCallClick({
      phone: cityNumber || process.env.NEXT_PUBLIC_DEFAULT_PHONE,
      source_page: 'sticky_cta'
    })

    // Use city tracking number if available, otherwise use default
    const phoneNumber = cityNumber || process.env.NEXT_PUBLIC_DEFAULT_PHONE || '1-800-PHLEBOTOMY'
    window.location.href = `tel:${phoneNumber}`
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="p-3">
          <button
            onClick={handleRequestClick}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 transition text-sm"
          >
            Request a Mobile Blood Draw
          </button>
        </div>
      </div>

      <LeadFormModal
        isOpen={leadFormOpen}
        onClose={() => setLeadFormOpen(false)}
        defaultCity={defaultCity || ''}
        defaultState={defaultState || ''}
        defaultZip={defaultZip || ''}
      />
    </>
  )
}
