'use client'

import { useState } from 'react'
import { X, Check, Star, TrendingUp, Award } from 'lucide-react'

interface PricingTier {
  id: 'FOUNDING_PARTNER' | 'STANDARD_PREMIUM' | 'HIGH_DENSITY'
  name: string
  price: number
  description: string
  features: string[]
  badge?: string
  popular?: boolean
  icon: React.ElementType
}

const tiers: PricingTier[] = [
  {
    id: 'FOUNDING_PARTNER',
    name: 'Founding Partner',
    price: 49,
    description: 'Early-bird rate — locked in forever at this price',
    badge: 'Best Value',
    popular: true,
    icon: Award,
    features: [
      'Everything listed above',
      '"Founding Partner" label on your profile',
      'Be the first premium provider in your market',
      'This $49/mo rate never increases, even when prices go up'
    ]
  },
  {
    id: 'STANDARD_PREMIUM',
    name: 'Premium',
    price: 79,
    description: 'The standard plan for most providers',
    icon: Star,
    features: [
      'Everything listed above',
      'Larger, more visible profile card highlighting your services',
      'Monthly listing views and click stats',
      'Monthly performance report emailed to you'
    ]
  },
  {
    id: 'HIGH_DENSITY',
    name: 'Metro Premium',
    price: 149,
    description: 'For providers in competitive major metros',
    icon: TrendingUp,
    features: [
      'Everything in Premium, plus:',
      'Top spot on your city page — the #1 listing patients see',
      'Option to be the exclusive featured sponsor for your city',
      'Detailed analytics: views, clicks, and conversion rates',
      'Direct support line for account questions'
    ]
  }
]

interface PremiumPricingModalProps {
  isOpen: boolean
  onClose: () => void
  providerId: string
  providerName: string
}

export function PremiumPricingModal({ isOpen, onClose, providerId, providerName }: PremiumPricingModalProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubscribe = async (tierId: string) => {
    setIsLoading(true)
    setError(null)
    setSelectedTier(tierId)

    try {
      const response = await fetch('/api/providers/subscribe-featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          tier: tierId
        })
      })

      const data = await response.json()

      if (data.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to create checkout session')
        setIsLoading(false)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Listing</h2>
              <p className="text-gray-600 mt-1">Get more visibility and more patients — flat monthly rate, no per-lead fees</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="p-6">
            {/* What every plan includes */}
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-5">
              <h3 className="font-bold text-green-900 mb-3">Every premium plan includes:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-800">
                <div className="flex items-center gap-2"><Check className="text-green-600 flex-shrink-0" size={16} /> Higher placement on city &amp; state pages</div>
                <div className="flex items-center gap-2"><Check className="text-green-600 flex-shrink-0" size={16} /> Gold &quot;Featured Provider&quot; badge</div>
                <div className="flex items-center gap-2"><Check className="text-green-600 flex-shrink-0" size={16} /> Priority lead routing in your area</div>
                <div className="flex items-center gap-2"><Check className="text-green-600 flex-shrink-0" size={16} /> No per-lead fees — leads are free to claim</div>
                <div className="flex items-center gap-2"><Check className="text-green-600 flex-shrink-0" size={16} /> Cancel anytime, no contracts</div>
                <div className="flex items-center gap-2"><Check className="text-green-600 flex-shrink-0" size={16} /> Listing upgraded instantly</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier) => {
                const Icon = tier.icon
                return (
                  <div
                    key={tier.id}
                    className={`relative border-2 rounded-lg p-6 ${
                      tier.popular
                        ? 'border-primary-500 shadow-lg'
                        : 'border-gray-200'
                    }`}
                  >
                    {tier.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {tier.badge}
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                        <Icon className="text-primary-600" size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {tier.name}
                      </h3>
                      <div className="mb-2">
                        <span className="text-4xl font-bold text-gray-900">
                          ${tier.price}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>
                      <p className="text-sm text-gray-600">{tier.description}</p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isLoading && selectedTier !== tier.id}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                        tier.popular
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      } ${
                        isLoading && selectedTier === tier.id
                          ? 'opacity-75 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {isLoading && selectedTier === tier.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </span>
                      ) : (
                        'Get Started'
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Info Footer */}
            <div className="mt-8 bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                How It Works
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Instant upgrade</strong> — your listing is upgraded the moment you subscribe</li>
                <li>• <strong>Higher placement</strong> — premium listings appear above free listings when patients search your city</li>
                <li>• <strong>Featured badge</strong> — a gold badge on your listing builds trust and increases clicks</li>
                <li>• <strong>First dibs on leads</strong> — when a patient requests a phlebotomist in your area, you get notified first</li>
                <li>• <strong>Cancel anytime</strong> — no contracts, no setup fees, cancel with one click</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
