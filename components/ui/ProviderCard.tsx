import Link from 'next/link'
import Image from 'next/image'
import { Provider } from '@/lib/schemas'
import { getProviderCoverageDisplay, getProviderCoverageType } from '@/lib/enhanced-city-search'
import { getProviderBadge, isProviderRegistered } from '@/lib/provider-tiers'
import { PhoneReveal } from '@/components/PhoneReveal'
import { FeaturedProviderCTA } from '@/components/FeaturedProviderCTA'

interface ProviderCardProps {
  provider: Provider
  showCoverageType?: boolean
}

export function ProviderCard({ provider, showCoverageType = false }: ProviderCardProps) {
  const coverageType = getProviderCoverageType(provider)
  const coverageDisplay = getProviderCoverageDisplay(provider)
  const registeredBadge = getProviderBadge(provider.id)
  const isVerified = isProviderRegistered(provider.id)

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{provider.name}</h3>

          {/* Founding Partner Badge */}
          {provider.featuredTier === 'FOUNDING_PARTNER' && (
            <div className="mb-2">
              <span
                className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
                title="Founding Partners are early premium providers with prioritized visibility and direct lead access."
                aria-label="Founding Partner Premium Provider"
              >
                <svg className="h-3.5 w-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                FOUNDING PARTNER
              </span>
            </div>
          )}

          {/* Verification Status Badge */}
          <div className="mb-2">
            {isVerified ? (
              <Image src="/images/PV_Badge.png" alt="Platform Verified" width={140} height={28} className="h-7 w-auto" />
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500 bg-opacity-10 text-yellow-800 border border-yellow-600">
                ⚠️ Unverified — Details may vary
              </span>
            )}
          </div>

          {/* Additional Badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Featured Provider Badge (Pilot - Visibility Only) */}
            {provider.isFeatured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-300">
                ⭐ Featured Provider
              </span>
            )}
            {/* Nationwide/Multi-State Badge */}
            {(provider as any).is_nationwide === 'Yes' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                🌎 Nationwide Service
              </span>
            )}
            {/* Registered/Featured Badge */}
            {registeredBadge && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${registeredBadge.color}`}>
                {registeredBadge.icon} {registeredBadge.text}
              </span>
            )}
            {showCoverageType && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {getCoverageIcon(coverageType)}
                {getCoverageLabel(coverageType)}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
            <span>📍 {provider.address?.city ? `${provider.address.city}, ${provider.address.state} ${provider.address.zip}` : coverageDisplay}</span>
            {/* Phone: hidden for featured, click-to-reveal for others */}
            {provider.phone && !provider.isFeatured && (
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
          </div>
          
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            {provider.availability && (
              <span>📅 {provider.availability.join(', ')}</span>
            )}
            {provider.payment && (
              <span>💳 {provider.payment.join(', ')}</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {provider.badges?.map((badge) => (
            <span
              key={badge}
              className={`text-xs px-2 py-1 rounded-full text-center ${
                badge === 'Certified' ? 'bg-green-100 text-green-800' :
                badge === 'Insured' ? 'bg-blue-100 text-blue-800' :
                badge === 'Background-Checked' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {provider.description && (
        <p className="text-gray-600 mb-4">{provider.description}</p>
      )}

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Services Offered:</h4>
        <div className="flex flex-wrap gap-2">
          {provider.services.map((service) => (
            <span
              key={service}
              className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded"
            >
              {service}
            </span>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <span className="font-medium">Coverage:</span> {coverageDisplay}
      </div>

      <div className="flex flex-wrap gap-3">
        {provider.isFeatured ? (
          <FeaturedProviderCTA
            providerId={provider.id}
            providerName={provider.name}
          />
        ) : (
          <Link
            href={`/provider/${provider.slug}`}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            View Provider Details
          </Link>
        )}
        <Link
          href={`/provider/${provider.slug}`}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}