'use client'

import Link from 'next/link'
import { useCallback } from 'react'

interface FeaturedProviderCTAProps {
  providerId: string
  providerName: string
  variant?: 'default' | 'compact' | 'large'
  className?: string
}

export function FeaturedProviderCTA({
  providerId,
  providerName,
  variant = 'default',
  className = ''
}: FeaturedProviderCTAProps) {
  const handleClick = useCallback(async () => {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'featured_provider_cta_clicked',
          providerId,
          providerName,
          path: window.location.pathname
        })
      })
    } catch (error) {
      // Non-blocking - don't prevent navigation if tracking fails
      console.error('Failed to track CTA click:', error)
    }
  }, [providerId, providerName])

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors'

  const variantStyles = {
    default: 'bg-primary-600 text-white px-4 py-2 hover:bg-primary-700',
    compact: 'bg-primary-600 text-white px-3 py-1.5 text-sm hover:bg-primary-700',
    large: 'bg-primary-600 text-white px-6 py-3 text-lg hover:bg-primary-700 w-full'
  }

  return (
    <Link
      href={`/los-angeles/request?providerId=${providerId}`}
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-label={`Request appointment with ${providerName}`}
    >
      Request Appointment
    </Link>
  )
}
