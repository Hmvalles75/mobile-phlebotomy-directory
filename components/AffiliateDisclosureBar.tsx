'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export function AffiliateDisclosureBar() {
  const [isVisible, setIsVisible] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if user has previously dismissed the disclosure
    const dismissed = localStorage.getItem('affiliate_disclosure_dismissed')
    if (dismissed) {
      setIsVisible(false)
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('affiliate_disclosure_dismissed', 'true')
    setIsDismissed(true)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-yellow-900">
              <span className="font-semibold">DISCLOSURE:</span> We may earn a commission if you book through an external partner link on this page, at no extra cost to you.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-yellow-700 hover:text-yellow-900 transition-colors"
            aria-label="Dismiss disclosure"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
