'use client'

import { useRouter } from 'next/navigation'
import { Phone } from 'lucide-react'
import { ga4 } from '@/lib/ga4'

interface ProviderCTASectionProps {
  providerId: string
  providerName: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  twilioNumber?: string
  isVerified: boolean
}

export function ProviderCTASection({
  providerId,
  providerName,
  city,
  state,
  zip,
  phone,
  twilioNumber,
  isVerified
}: ProviderCTASectionProps) {
  const router = useRouter()

  const handleRequestClick = () => {
    ga4.leadFormOpen({ city, state, zip })
    router.push('/coming-soon')
  }

  const handleCallClick = () => {
    ga4.callClick({ city, state, zip, provider_status: isVerified ? 'verified' : 'unverified' })
    const phoneNumber = twilioNumber || phone || process.env.NEXT_PUBLIC_DEFAULT_PHONE || '1-800-555-0100'

    // On mobile, open tel: link. On desktop, show phone number with copy option
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = `tel:${phoneNumber}`
    } else {
      // On desktop, show alert with phone number and option to copy
      const message = `Call ${providerName} at:\n\n${phoneNumber}\n\nClick OK to copy the phone number to your clipboard.`
      if (confirm(message)) {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(phoneNumber).then(() => {
            alert(`Phone number ${phoneNumber} copied to clipboard!`)
          }).catch(() => {
            alert(`Please call: ${phoneNumber}`)
          })
        } else {
          alert(`Please call: ${phoneNumber}`)
        }
      }
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">
        Request Service from {providerName}
      </h3>
      <p className="text-gray-700 mb-4 text-sm">
        Book a licensed mobile phlebotomist to come to you. Same-day and next-day slots available.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleRequestClick}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 transition text-center"
        >
          Request Blood Draw
        </button>

        <button
          onClick={handleCallClick}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-green-700 transition"
        >
          <Phone size={20} />
          Call Now
        </button>
      </div>

      {!isVerified && (
        <p className="text-xs text-gray-600 mt-3">
          ⚠️ This is an unverified listing. Please confirm details with the provider.
        </p>
      )}
    </div>
  )
}
