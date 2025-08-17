'use client'

import { useState, useEffect } from 'react'
import { type Provider } from '@/lib/schemas'
import {
  contactProvider,
  visitProviderWebsite,
  formatProviderContact,
  generateProviderStructuredData
} from '@/lib/provider-actions'
import { formatCoverageDisplay } from '@/lib/coverage-utils'

interface ProviderActionsProps {
  provider: Provider
  currentLocation?: string
  variant?: 'default' | 'compact' | 'detailed'
  showStructuredData?: boolean
  className?: string
}

export function ProviderActions({
  provider,
  currentLocation,
  variant = 'default',
  showStructuredData = false,
  className = ''
}: ProviderActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [contactInfo, setContactInfo] = useState(() => formatProviderContact(provider))

  const handleContact = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 100)) // Brief loading state
      contactProvider(provider, currentLocation)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebsiteVisit = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      visitProviderWebsite(provider, currentLocation)
    } finally {
      setIsLoading(false)
    }
  }



  // Compact variant for mobile or space-constrained areas
  if (variant === 'compact') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={handleContact}
          disabled={isLoading}
          className="flex-1 bg-primary-600 text-white px-3 py-2 rounded text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
          aria-label={`Contact ${provider.name} - ${contactInfo.primary}`}
        >
          {isLoading ? '...' : 'Contact'}
        </button>
        
        {provider.website && (
          <button
            onClick={handleWebsiteVisit}
            disabled={isLoading}
            className="flex-1 border border-primary-600 text-primary-600 px-3 py-2 rounded text-sm hover:bg-primary-50 disabled:opacity-50 transition-colors"
            aria-label={`Visit ${provider.name} website`}
          >
            Website
          </button>
        )}
        
      </div>
    )
  }

  // Detailed variant with more information
  if (variant === 'detailed') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Contact Information */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Primary:</span>
              <span className="font-medium">{contactInfo.primary}</span>
            </div>
            {contactInfo.secondary.map((contact, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-gray-600">Also:</span>
                <span>{contact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleContact}
            disabled={isLoading}
            className="bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
            aria-label={`Contact ${provider.name} via ${contactInfo.methods[0]}`}
          >
            {isLoading ? 'Connecting...' : `Contact Provider`}
          </button>

          {provider.website && (
            <button
              onClick={handleWebsiteVisit}
              disabled={isLoading}
              className="border border-primary-600 text-primary-600 px-4 py-3 rounded-lg hover:bg-primary-50 disabled:opacity-50 transition-colors font-medium"
              aria-label={`Visit ${provider.name} official website`}
            >
              Visit Website
            </button>
          )}


        </div>
      </div>
    )
  }

  // Default variant
  return (
    <>
      {/* Structured Data for SEO */}
      {showStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateProviderStructuredData(provider, currentLocation))
          }}
        />
      )}

      <div className={`flex flex-wrap gap-3 ${className}`}>
        <button
          onClick={handleContact}
          disabled={isLoading}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
          aria-label={`Contact ${provider.name} - ${contactInfo.primary}`}
          data-provider-action="contact"
          data-provider-id={provider.id}
        >
          {isLoading ? 'Connecting...' : 'Contact Provider'}
        </button>

        {provider.website && (
          <button
            onClick={handleWebsiteVisit}
            disabled={isLoading}
            className="border border-primary-600 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 disabled:opacity-50 transition-colors"
            aria-label={`Visit ${provider.name} official website - opens in new tab`}
            data-provider-action="website"
            data-provider-id={provider.id}
          >
            Visit Website
          </button>
        )}

        {/* Smart booking button - only show for actual booking sites */}
        {provider.bookingUrl && 
         provider.bookingUrl !== provider.website && 
         !provider.bookingUrl.includes('google.com/maps') &&
         !provider.bookingUrl.includes('maps.google.com') &&
         (provider.bookingUrl.includes('book') || 
          provider.bookingUrl.includes('appointment') || 
          provider.bookingUrl.includes('schedule') ||
          provider.bookingUrl.includes('calendar') ||
          provider.bookingUrl.includes('portal')) && (
          <a
            href={provider.bookingUrl}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
            aria-label={`Book appointment with ${provider.name} online - opens in new tab`}
            data-provider-action="booking"
            data-provider-id={provider.id}
          >
            Book Online
          </a>
        )}

        {/* Show "Call to Book" when no online booking is available but phone exists */}
        {provider.phone && 
         (!provider.bookingUrl || 
          provider.bookingUrl.includes('google.com/maps') ||
          provider.bookingUrl.includes('maps.google.com') ||
          !provider.bookingUrl.includes('book')) && (
          <button
            onClick={() => contactProvider(provider)}
            className="border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
            aria-label={`Call ${provider.name} to book appointment`}
            data-provider-action="call-to-book"
            data-provider-id={provider.id}
          >
            📞 Call to Book
          </button>
        )}


      </div>
    </>
  )
}

// Provider details modal component
interface ProviderDetailsModalProps {
  provider: Provider | null
  isOpen: boolean
  onClose: () => void
  currentLocation?: string
}

export function ProviderDetailsModal({
  provider,
  isOpen,
  onClose,
  currentLocation
}: ProviderDetailsModalProps) {
  if (!isOpen || !provider) return null

  const contactInfo = formatProviderContact(provider)

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-labelledby="provider-modal-title"
      aria-describedby="provider-modal-description"
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Structured Data for the specific provider */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateProviderStructuredData(provider, currentLocation))
          }}
        />

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 id="provider-modal-title" className="text-2xl font-bold text-gray-900">
              {provider.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center"
              aria-label="Close provider details"
            >
              ×
            </button>
          </div>

          <div id="provider-modal-description" className="space-y-6">
            {/* Basic Information */}
            {provider.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">{provider.description}</p>
              </div>
            )}

            {/* Contact Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Primary:</span>
                  <span className="text-gray-900">{contactInfo.primary}</span>
                </div>
                {contactInfo.secondary.map((contact, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-gray-600">Also:</span>
                    <span className="text-gray-700">{contact}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Services Offered</h3>
              <div className="flex flex-wrap gap-2">
                {provider.services.map((service) => (
                  <span
                    key={service}
                    className="bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Coverage Area */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Coverage Area</h3>
              <div className="text-gray-600">
                <p>{formatCoverageDisplay(provider.coverage)}</p>
              </div>
            </div>

            {/* Additional Details */}
            {(provider.availability || provider.payment || provider.badges) && (
              <div className="grid md:grid-cols-2 gap-4">
                {provider.availability && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
                    <div className="space-y-1">
                      {provider.availability.map((time) => (
                        <span key={time} className="block text-sm text-gray-600">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {provider.payment && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Payment Options</h4>
                    <div className="space-y-1">
                      {provider.payment.map((method) => (
                        <span key={method} className="block text-sm text-gray-600">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {provider.badges && provider.badges.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Certifications & Badges</h4>
                <div className="flex flex-wrap gap-2">
                  {provider.badges.map((badge) => (
                    <span
                      key={badge}
                      className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded"
                    >
                      ✓ {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {provider.rating && provider.reviewsCount && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Reviews</h4>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <span className="text-2xl">⭐</span>
                    <span className="text-xl font-semibold text-gray-900 ml-1">
                      {provider.rating}
                    </span>
                  </div>
                  <span className="text-gray-600">
                    ({provider.reviewsCount} review{provider.reviewsCount !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t">
            <ProviderActions
              provider={provider}
              currentLocation={currentLocation}
              variant="detailed"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderActions