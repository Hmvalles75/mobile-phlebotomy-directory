'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ga4, trackEvent } from '@/lib/ga4'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import {
  isMarketLocked,
  getMarketRequestPath,
  MARKET_CONFIG
} from '@/lib/config/market'

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
  const router = useRouter()
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const marketLocked = isMarketLocked()

  const handleRequestClick = () => {
    if (marketLocked) {
      // Fire LA-specific event
      trackEvent('sticky_cta_clicked', { market: MARKET_CONFIG.MARKET_SLUG })
      // Route directly to LA request page
      router.push(getMarketRequestPath())
    } else {
      ga4.leadCtaClick({ placement: 'sticky' })
      ga4.leadFormOpen({ city: defaultCity, state: defaultState, zip: defaultZip })
      setLeadFormOpen(true)
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="p-3">
          <button
            onClick={handleRequestClick}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 transition text-sm"
          >
            {marketLocked ? `Get Matched in ${MARKET_CONFIG.MARKET_NAME}` : 'Request a Mobile Blood Draw'}
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
