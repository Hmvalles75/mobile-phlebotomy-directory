'use client'

import type { ReactNode } from 'react'
import { trackPhoneClick } from '@/lib/trackPhoneClick'

/** tel: link that records the click. The only client-side need on a phone CTA. */
export function TrackedPhoneLink({
  phone, providerId, source, className, children, ariaLabel,
}: { phone: string; providerId: string; source: string; className?: string; children: ReactNode; ariaLabel?: string }) {
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
