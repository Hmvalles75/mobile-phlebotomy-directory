'use client'

import { ga4 } from '@/lib/ga4'

interface ProviderWebsiteLinkProps {
  website: string
  providerName: string
  providerCity?: string
  providerState?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Client component wrapper for provider website links with GA4 tracking
 *
 * Tracks 'provider_click' event with:
 * - provider_name
 * - provider_city
 * - provider_state
 * - link_type: 'website'
 * - page_path: current page path
 *
 * To verify in GA4:
 * 1. Go to GA4 Admin -> DebugView
 * 2. Click "Visit Website" link
 * 3. Confirm 'provider_click' event appears with all parameters
 */
export function ProviderWebsiteLink({
  website,
  providerName,
  providerCity,
  providerState,
  className,
  children
}: ProviderWebsiteLinkProps) {
  const handleClick = () => {
    ga4.providerClick({
      provider_name: providerName,
      provider_city: providerCity,
      provider_state: providerState,
      link_type: 'website'
    })
  }

  return (
    <a
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children || 'Visit Website'}
    </a>
  )
}
