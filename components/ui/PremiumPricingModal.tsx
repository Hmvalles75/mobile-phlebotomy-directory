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
    name: 'Founding Partner Premium',
    price: 49,
    description: 'Launch offer for providers in new, unserved markets',
    badge: 'Limited Time',
    popular: true,
    icon: Award,
    features: [
      'Premium placement in search results',
      'Featured badge on your listing',
      'Priority lead routing in your area',
      'Exclusive market coverage opportunity',
      'Founding Partner designation',
      'Lock in this rate permanently'
    ]
  },
  {
    id: 'STANDARD_PREMIUM',
    name: 'Standard Premium',
    price: 79,
    description: 'Standard premium listing for established markets',
    icon: Star,
    features: [
      'Premium placement in search results',
      'Featured badge on your listing',
      'Priority lead routing',
      'Enhanced profile visibility',
      'Analytics dashboard',
      'Monthly performance reports'
    ]
  },
  {
    id: 'HIGH_DENSITY',
    name: 'High-Density Metro',
    price: 149,
    description: 'Maximum visibility in major metro markets',
    icon: TrendingUp,
    features: [
      'Top placement in major metros',
      'Featured badge on your listing',
      'Highest priority lead routing',
      'City-exclusive featured sponsor option',
      'Advanced analytics & insights',
      'Dedicated account support',
      'Premium lead quality guarantee'
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
              <h2 className="text-2xl font-bold text-gray-900">Upgrade to Premium</h2>
              <p className="text-gray-600 mt-1">Choose the plan that fits your market</p>
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
                How Premium Listings Work
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your listing will appear above basic listings in search results</li>
                <li>• Premium badge increases trust and click-through rates</li>
                <li>• Priority routing sends you leads first in your coverage area</li>
                <li>• Cancel anytime - no long-term commitment required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
