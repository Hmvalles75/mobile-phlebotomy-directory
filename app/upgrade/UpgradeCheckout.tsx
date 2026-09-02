'use client'

import { useState } from 'react'
import { ga4 } from '@/lib/ga4'

/**
 * Checkout button for the linkable upgrade page. Posts to the same
 * /api/providers/subscribe-featured endpoint the dashboard modal uses, so
 * there is one Stripe flow rather than two.
 */
export function UpgradeCheckout({ providerId }: { providerId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/providers/subscribe-featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          tier: 'FOUNDING_PARTNER',
          // Same attribution shape the dashboard modal sends, so an upgrade
          // driven by a lost-lead email is distinguishable from an organic one.
          attribution: {
            utmSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
            utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
            utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
            referrer: document.referrer || undefined,
            landingPage: window.location.pathname + window.location.search,
          },
        }),
      })
      const data = await res.json()
      if (data.ok && data.url) {
        // Fired immediately before the redirect — see the note in
        // PremiumPricingModal: this is intent to pay, not revenue.
        ga4.checkoutStart({ tier: 'FOUNDING_PARTNER', entry_point: 'upgrade_page' })

        window.location.href = data.url
      } else {
        setError(data.error || 'Could not start checkout. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={start}
        disabled={loading}
        className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? 'Starting checkout…' : 'Upgrade — $79/month'}
      </button>
      {error && <p className="mt-3 text-sm text-red-700 text-center">{error}</p>}
    </div>
  )
}
