'use client'

import { Check, Star, TrendingUp, Award } from 'lucide-react'
import Link from 'next/link'

const tiers = [
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

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Premium Provider Placement
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Get more leads with premium placement at the top of search results
            </p>
            <div className="inline-block bg-green-500 text-white px-6 py-2 rounded-full font-semibold">
              Now Available - Starting at $49/month
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon
            return (
              <div
                key={tier.id}
                className={`relative border-2 rounded-xl p-8 ${
                  tier.popular
                    ? 'border-primary-500 shadow-xl scale-105'
                    : 'border-gray-200 shadow-lg'
                } bg-white`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                    <Icon className="text-primary-600" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h2>
                  <div className="mb-3">
                    <span className="text-5xl font-bold text-gray-900">
                      ${tier.price}
                    </span>
                    <span className="text-gray-600 text-lg">/month</span>
                  </div>
                  <p className="text-gray-600">{tier.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/providers/claim"
                  className={`block w-full py-4 px-6 rounded-lg font-semibold text-center transition-colors ${
                    tier.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-blue-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">
              How Premium Listings Work
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">✓ Premium Placement</h4>
                <p className="text-sm">Your listing appears above basic listings in all search results</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">✓ Featured Badge</h4>
                <p className="text-sm">Build trust with a verified premium provider badge</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">✓ Priority Lead Routing</h4>
                <p className="text-sm">Get first access to patient requests in your area</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">✓ Cancel Anytime</h4>
                <p className="text-sm">No long-term contracts - flexible monthly billing</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Ready to grow your mobile phlebotomy business?
            </p>
            <Link
              href="/providers/claim"
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg"
            >
              Claim Your Listing & Upgrade
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
