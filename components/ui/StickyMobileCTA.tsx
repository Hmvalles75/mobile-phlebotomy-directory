'use client'

import { useRouter } from 'next/navigation'
import { Phone } from 'lucide-react'
import { ga4 } from '@/lib/ga4'

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

  const handleRequestClick = () => {
    ga4.mobileStickyCTAClick({ cta_type: 'request' })
    ga4.leadFormOpen({ city: defaultCity, state: defaultState, zip: defaultZip })
    router.push('/coming-soon')
  }

  const handleCallClick = () => {
    ga4.mobileStickyCTAClick({ cta_type: 'call' })
    ga4.callClick({ city: defaultCity, state: defaultState, zip: defaultZip })

    // Use city tracking number if available, otherwise use default
    const phoneNumber = cityNumber || process.env.NEXT_PUBLIC_DEFAULT_PHONE || '1-800-PHLEBOTOMY'
    window.location.href = `tel:${phoneNumber}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-lg">
      <div className="p-3">
        <button
          onClick={handleRequestClick}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 transition text-sm"
        >
          Request Blood Draw
        </button>
      </div>
    </div>
  )
}
