'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'
import { MARKET_CONFIG, isMarketLocked } from '@/lib/config/market'
import { trackPhoneClick } from '@/lib/trackPhoneClick'

interface PhoneRevealProps {
  phone: string
  providerId: string
  providerName?: string
  market?: string
  className?: string
  variant?: 'default' | 'compact' | 'featured'
  source?: string  // passed to phone-click tracking, e.g. 'provider_page_call'
}

/**
 * Click-to-reveal phone number component with tracking.
 *
 * - Initial render: "Show Phone" button (no phone in HTML)
 * - On click: reveals tel: link + fires tracking event
 * - Tracks: provider_phone_revealed event to /api/events
 */
export function PhoneReveal({
  phone,
  providerId,
  providerName,
  market,
  className = '',
  variant = 'default',
  source = 'provider_page_call',
}: PhoneRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleReveal = async () => {
    setIsLoading(true)

    // Determine market slug
    const marketSlug = market || (isMarketLocked() ? MARKET_CONFIG.MARKET_SLUG : undefined)

    // Fire tracking event
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'provider_phone_revealed',
          providerId,
          providerName,
          market: marketSlug,
          path: typeof window !== 'undefined' ? window.location.pathname : undefined
        })
      })
    } catch (err) {
      // Don't block reveal if tracking fails
      console.error('Event tracking failed:', err)
    }

    setRevealed(true)
    setIsLoading(false)
  }

  // Format phone for display
  const formatPhone = (p: string): string => {
    const cleaned = p.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return p
  }

  // Variant styles
  const buttonStyles = {
    default: 'inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium',
    compact: 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium',
    featured: 'w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-md hover:shadow-lg'
  }

  const linkStyles = {
    default: 'inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium',
    compact: 'inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium',
    featured: 'w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md'
  }

  if (revealed) {
    return (
      <a
        href={`tel:${phone}`}
        onClick={() => trackPhoneClick({ providerId, source })}
        className={`${linkStyles[variant]} ${className}`}
        aria-label={`Call ${providerName || 'provider'} at ${formatPhone(phone)}`}
      >
        <Phone className={variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
        <span>{formatPhone(phone)}</span>
      </a>
    )
  }

  return (
    <button
      onClick={handleReveal}
      disabled={isLoading}
      className={`${buttonStyles[variant]} ${className} disabled:opacity-50 disabled:cursor-wait`}
      aria-label={`Reveal phone number for ${providerName || 'provider'}`}
    >
      {isLoading ? (
        <>
          <div className={`${variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} border-2 border-current border-t-transparent rounded-full animate-spin`} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          <Phone className={variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
          <span>Show Phone</span>
        </>
      )}
    </button>
  )
}
