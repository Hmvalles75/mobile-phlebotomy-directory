'use client'

import { ga4 } from '@/lib/ga4'

interface ProviderWebsiteLinkProps {
  website: string
  providerId?: string
  providerName: string
  providerCity?: string
  providerState?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Client component wrapper for provider website links with GA4 tracking
 *
 * Tracks 'provider_website_click' event with:
 * - provider_id
 * - provider_name
 * - url
 * - source_page (auto-detected from page_path)
 *
 * To verify in GA4:
 * 1. Go to GA4 Admin -> DebugView
 * 2. Click "Visit Website" link
 * 3. Confirm 'provider_website_click' event appears with all parameters
 */
export function ProviderWebsiteLink({
  website,
  providerId,
  providerName,
  providerCity,
  providerState,
  className,
  children
}: ProviderWebsiteLinkProps) {
  const handleClick = () => {
    // Determine source_page from current URL
    let sourcePage = 'unknown'
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      if (path.includes('/provider/')) sourcePage = 'provider_detail'
      else if (path.includes('/metro/')) sourcePage = 'metro'
      else if (path.match(/\/us\/[a-z]{2}\/[a-z-]+/)) sourcePage = 'city'
      else if (path.match(/\/us\/[a-z]{2}$/)) sourcePage = 'state'
    }

    ga4.providerWebsiteClick({
      provider_id: providerId,
      provider_name: providerName,
      url: website,
      source_page: sourcePage
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
