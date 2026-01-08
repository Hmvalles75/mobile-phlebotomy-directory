'use client'

import Link from 'next/link'
import { type Provider } from '@/lib/schemas'
import { RatingBadge } from './RatingBadge'
import { ProviderActions } from './ProviderActions'
import Image from 'next/image'
import { ga4 } from '@/lib/ga4'

interface FeaturedProviderCardProps {
  provider: Provider
}

export function FeaturedProviderCard({ provider }: FeaturedProviderCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl border-2 border-primary-200 hover:border-primary-300 p-8 transition-all duration-200 hover:shadow-2xl relative overflow-hidden group">
      {/* Featured Badge */}
      <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-400 to-amber-500 text-white px-4 py-1 rounded-bl-lg font-semibold text-sm shadow-lg flex items-center gap-1">
        <span className="text-base">⭐</span>
        <span>Featured Provider</span>
      </div>

      {/* Decorative element */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-100 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500"></div>

      <div className="relative z-10">
        {/* Provider Logo/Photo placeholder */}
        <div className="flex items-start gap-6 mb-6">
          <div className="flex-shrink-0 w-20 h-20 bg-white border-2 border-primary-300 rounded-lg flex items-center justify-center text-3xl font-bold text-primary-600 shadow-md">
            {provider.name.charAt(0)}
          </div>

          <div className="flex-1">
            <Link
              href={`/provider/${provider.slug}`}
              className="group-hover:text-primary-700 transition-colors"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">
                {provider.name}
              </h3>
            </Link>

            {provider.rating && (
              <RatingBadge
                rating={provider.rating}
                reviewsCount={provider.reviewsCount}
                variant="featured"
                className="mb-2"
              />
            )}
          </div>
        </div>

        {/* Service Area */}
        <div className="mb-4 flex items-center text-gray-700 bg-white rounded-lg p-3 border border-primary-100">
          <span className="text-xl mr-2">📍</span>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Service Area</div>
            <div className="font-medium">
              {provider.address?.city}, {provider.address?.state}
              {provider.coverage?.states && provider.coverage.states.length > 1 && (
                <span className="text-sm text-gray-600 ml-2">
                  +{provider.coverage.states.length - 1} more state{provider.coverage.states.length > 2 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Brief Description */}
        {provider.description && (
          <p className="text-gray-700 mb-4 line-clamp-2 bg-white rounded-lg p-3 border border-primary-100 text-sm">
            {provider.description.substring(0, 100)}
            {provider.description.length > 100 ? '...' : ''}
          </p>
        )}

        {/* Services */}
        <div className="mb-5">
          <div className="flex flex-wrap gap-2">
            {provider.services.slice(0, 3).map((service) => (
              <span
                key={service}
                className="bg-primary-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm"
              >
                {service}
              </span>
            ))}
            {provider.services.length > 3 && (
              <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium">
                +{provider.services.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Contact Actions */}
        <div className="flex flex-col gap-3">
          {/* Phone Button */}
          {provider.phone && (
            <button
              onClick={() => {
                const message = `Call ${provider.name} at:\n\n${provider.phone}\n\nClick OK to copy the phone number to your clipboard.`
                if (confirm(message) && provider.phone) {
                  navigator.clipboard.writeText(provider.phone)
                    .then(() => alert(`Phone number ${provider.phone} copied to clipboard!`))
                    .catch(() => alert(`Phone: ${provider.phone}`))
                }
              }}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span className="text-lg">📞</span>
              <span>Call Now: {provider.phone}</span>
            </button>
          )}

          {/* Website Button */}
          {provider.website && (
            <a
              href={provider.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="w-full bg-white hover:bg-primary-50 text-primary-600 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-primary-600 hover:border-primary-700 shadow-sm"
              onClick={() => {
                ga4.providerClick({
                  provider_name: provider.name,
                  provider_city: provider.address?.city,
                  provider_state: provider.address?.state,
                  link_type: 'website'
                })
              }}
            >
              <span className="text-lg">🌐</span>
              <span>Visit Website</span>
            </a>
          )}

          {/* View Details Link */}
          <Link
            href={`/provider/${provider.slug}`}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>View Full Details</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
