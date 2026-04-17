'use client'

import { useEffect } from 'react'
import { persistAttributionOnLanding } from '@/lib/attribution'

/**
 * Captures first-touch attribution on initial page load and stores in sessionStorage.
 * Values are later picked up by the add-provider form submission.
 */
export function AttributionTracker() {
  useEffect(() => {
    persistAttributionOnLanding()
  }, [])
  return null
}
