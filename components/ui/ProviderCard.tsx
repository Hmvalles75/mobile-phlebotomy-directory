import Link from 'next/link'
import { Provider } from '@/lib/schemas'
import { getProviderCoverageDisplay, getProviderCoverageType } from '@/lib/enhanced-city-search'
import { PhoneReveal } from '@/components/PhoneReveal'
import { FeaturedProviderCTA } from '@/components/FeaturedProviderCTA'
import { ProviderDescription } from '@/components/ui/ProviderDescription'

interface ProviderCardProps {
  provider: Provider
  showCoverageType?: boolean
}

const FREE_TAG_LIMIT = 3

export function ProviderCard({ provider, showCoverageType = false }: ProviderCardProps) {
  const coverageType = getProviderCoverageType(provider)
  const coverageDisplay = getProviderCoverageDisplay(provider)
  const isFeatured = !!provider.isFeatured
  // Verified ✓ indicator only shown on Featured cards — free cards stay clean.
  // Schema-side, "Verified" maps to status === 'VERIFIED' on the underlying
  // Provider row. The Provider type here is the public schema, which mirrors
  // it as `verified: true` where applicable.
  const isVerified = !!(provider as any).verified || (provider as any).status === 'VERIFIED'
  const descriptionFlagged = !!(provider as any).descriptionFlagged

  const services = provider.services || []
  const visibleServices = isFeatured ? services : services.slice(0, FREE_TAG_LIMIT)
  const hiddenServiceCount = isFeatured ? 0 : Math.max(0, services.length - FREE_TAG_LIMIT)

  const getCoverageIcon = (type: string) => {
    switch (type) {
      case 'city': return '🏢'
      case 'regional': return '🗺️'
      case 'statewide': return '🏛️'
      default: return '📍'
    }
  }

  const getCoverageLabel = (type: string) => {
    switch (type) {
      case 'city': return 'Local Provider'
      case 'regional': return 'Regional Provider'
      case 'statewide': return 'Statewide Provider'
      default: return 'Provider'
    }
  }

  // Featured-specific styling — subtle amber border + faint warm tint + lifted shadow.
  // Free cards stay plain white with a minimal shadow so the visual hierarchy is clear.
  const cardClasses = isFeatured
    ? 'relative bg-amber-50/40 rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-2 border-amber-300/70'
    : 'relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200'

  return (
    <div className={cardClasses}>
      {/* Featured Partner badge — top-right, larger on featured */}
      {isFeatured && (
        <div className="absolute top-0 right-0 bg-gradient-to-br from-amber-400 to-amber-500 text-white px-4 py-1.5 rounded-bl-lg rounded-tr-lg font-semibold text-sm shadow flex items-center gap-1">
          <span aria-hidden>⭐</span>
          <span>Featured Partner</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-gray-900 mb-2 ${isFeatured ? 'text-xl' : 'text-lg'}`}>{provider.name}</h3>

          {/* Verified indicator — Featured only */}
          {isFeatured && isVerified && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
          )}

          {/* Location + phone + rating row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
            <span>📍 {provider.address?.city ? `${provider.address.city}, ${provider.address.state} ${provider.address.zip || ''}`.trim() : coverageDisplay}</span>
            {provider.phone && !isFeatured && (
              <PhoneReveal
                phone={provider.phone}
                providerId={provider.id}
                providerName={provider.name}
                variant="compact"
              />
            )}
            {provider.rating && provider.reviewsCount && (
              <span>⭐ {provider.rating} ({provider.reviewsCount} reviews)</span>
            )}
            {showCoverageType && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {getCoverageIcon(coverageType)} {getCoverageLabel(coverageType)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
            {provider.availability && (
              <span>📅 {provider.availability.join(', ')}</span>
            )}
            {provider.payment && (
              <span>💳 {provider.payment.join(', ')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Description — truncate with Read more, hide if flagged as junk */}
      <div className="mb-4">
        <ProviderDescription description={provider.description ?? null} flagged={descriptionFlagged} />
      </div>

      {/* Services — all visible on Featured, +N more on Free */}
      {services.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Services Offered:</h4>
          <div className="flex flex-wrap gap-2">
            {visibleServices.map((service) => (
              <span
                key={service}
                className={`text-xs px-2.5 py-1 rounded-full ${
                  isFeatured
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {service}
              </span>
            ))}
            {hiddenServiceCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                +{hiddenServiceCount} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 mb-4">
        <span className="font-medium">Coverage:</span> {coverageDisplay}
        {(provider as any).serviceRadiusMiles && (
          <span> — within {(provider as any).serviceRadiusMiles} mile radius</span>
        )}
      </div>

      {/* CTAs — Featured gets Request Appointment as primary, free gets View Details only */}
      <div className="flex flex-wrap gap-3">
        {isFeatured ? (
          <>
            <FeaturedProviderCTA
              providerId={provider.id}
              providerName={provider.name}
            />
            <Link
              href={`/provider/${provider.slug}`}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              View Details
            </Link>
          </>
        ) : (
          <Link
            href={`/provider/${provider.slug}`}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  )
}
