'use client'

import { ReactNode } from 'react'
import { trackPhoneClick } from '@/lib/trackPhoneClick'

interface Props {
  phone: string           // raw phone for the tel: href
  providerId: string      // for tracking attribution
  source: string          // e.g. 'hardcoded_landing_call' or 'provider_page_call'
  className?: string
  children: ReactNode
  ariaLabel?: string
}

/**
 * Client-component wrapper around a tel: anchor that fires a phone-click
 * tracking beacon before the browser navigates. Useful in server components
 * where you can't add onClick handlers inline.
 */
export function TrackedPhoneLink({
  phone,
  providerId,
  source,
  className,
  children,
  ariaLabel,
}: Props) {
  return (
    <a
      href={`tel:${phone}`}
      onClick={() => trackPhoneClick({ providerId, source })}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  )
}
