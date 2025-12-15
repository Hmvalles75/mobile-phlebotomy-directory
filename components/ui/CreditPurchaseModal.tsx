'use client'

import { useState } from 'react'
import { X, Check, Zap } from 'lucide-react'

const creditPacks = [
  {
    id: 'intro',
    name: 'Intro Pack',
    credits: 1,
    price: 25,
    savings: null,
    description: 'Perfect for testing the system',
    features: ['1 lead credit', '$25 value', 'Try before you buy']
  },
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 2,
    price: 50,
    savings: null,
    popular: false,
    description: 'Great for getting started',
    features: ['2 lead credits', '$50 value', 'Build your client base']
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    credits: 8,
    price: 180,
    savings: 20,
    popular: true,
    description: 'Best value for growing practices',
    features: ['8 lead credits', '$200 value', 'Save $20 (10% discount)', 'Most popular choice']
  }
]

interface CreditPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  providerId: string
}

export function CreditPurchaseModal({ isOpen, onClose, providerId }: CreditPurchaseModalProps) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePurchase = async (packId: string) => {
    setIsLoading(true)
    setError(null)
    setSelectedPack(packId)

    try {
      const response = await fetch('/api/stripe/createCreditSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, packId })
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Purchase Lead Credits</h2>
              <p className="text-gray-600 mt-1">Choose a credit pack to start receiving leads</p>
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

          {/* Credit Packs */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {creditPacks.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative border-2 rounded-xl p-6 ${
                    pack.popular
                      ? 'border-primary-500 shadow-lg'
                      : 'border-gray-200'
                  } bg-white`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Zap size={12} />
                        Best Value
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {pack.name}
                    </h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        ${pack.price}
                      </span>
                    </div>
                    {pack.savings && (
                      <div className="mb-2">
                        <span className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Save ${pack.savings}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">{pack.description}</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {pack.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(pack.id)}
                    disabled={isLoading && selectedPack !== pack.id}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      pack.popular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } ${
                      isLoading && selectedPack === pack.id
                        ? 'opacity-75 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {isLoading && selectedPack === pack.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </span>
                    ) : (
                      'Purchase Now'
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Info Footer */}
            <div className="mt-8 bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                How Lead Credits Work
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Each credit = 1 qualified patient lead delivered to you</li>
                <li>• Standard leads cost 1 credit ($25), STAT leads cost 2 credits ($50)</li>
                <li>• Credits are automatically deducted when a lead is routed to you</li>
                <li>• Receive real-time notifications via email and SMS</li>
                <li>• Credits never expire - use them at your own pace</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
