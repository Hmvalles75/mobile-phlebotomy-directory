import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getProviderBySlug, getAllProviders, type EnrichedProvider } from '@/lib/providers-db'
import { formatCoverageDisplay } from '@/lib/coverage-utils'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { ProviderSchema } from '@/components/seo/ProviderSchema'
import { ProviderImage } from '@/components/ui/ProviderImage'
import { getProviderBadge, isProviderRegistered } from '@/lib/provider-tiers'
import { ClaimBusinessButton } from '@/components/ui/ClaimBusinessButton'
import { ProviderCTASection } from '@/components/ui/ProviderCTASection'
import { ReportIssueButton } from '@/components/ui/ReportIssueButton'
import { formatPhoneNumber } from '@/lib/format-phone'
import Link from 'next/link'
import { ProviderWebsiteLink } from '@/components/ui/ProviderWebsiteLink'

interface PageProps {
  params: {
    slug: string
  }
}

// Enable ISR (Incremental Static Regeneration) - revalidate every 60 seconds
export const revalidate = 60

export async function generateStaticParams() {
  const providers = await getAllProviders()
  return providers.map((provider) => ({
    slug: provider.slug
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const provider = await getProviderBySlug(params.slug)

  if (!provider) {
    return {
      title: 'Provider Not Found'
    }
  }

  const location = provider.city ? `${provider.city}, ${provider.state}` : provider.state || 'USA'

  return {
    title: `${provider.name} - Mobile Phlebotomy Services in ${location}`,
    description: provider.bio || provider.validation_notes || `${provider.name} provides professional mobile phlebotomy and blood draw services in ${location}. ${provider.specialties ? `Specializing in: ${provider.specialties}` : ''}`,
    keywords: [
      provider.name,
      'mobile phlebotomy',
      'blood draw',
      provider.city,
      provider.state,
      ...(provider.zipCodes ? provider.zipCodes.split(',').map(z => z.trim()) : []),
      ...(provider.specialties ? provider.specialties.split(',').map(s => s.trim()) : [])
    ].filter(Boolean).join(', '),
    openGraph: {
      title: `${provider.name} - Mobile Phlebotomy Services`,
      description: provider.bio || provider.validation_notes || `Professional mobile phlebotomy services in ${location}`,
      type: 'website',
      images: provider.logo ? [{
        url: provider.logo,
        alt: `${provider.name} logo`
      }] : undefined
    },
    alternates: {
      canonical: `/provider/${params.slug}`
    }
  }
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const provider = await getProviderBySlug(params.slug)

  if (!provider) {
    notFound()
  }

  const location = provider.city ? `${provider.city}, ${provider.state}` : provider.state || ''
  const yearInBusiness = provider.foundedYear ? new Date().getFullYear() - parseInt(provider.foundedYear) : null

  // Parse testimonials if they exist (cleaned data may have empty testimonials)
  const testimonials = (provider.testimonials && provider.testimonials !== 'nan' && provider.testimonials !== '') ?
    provider.testimonials.split('|').map(t => t.trim()).filter(Boolean) : []

  // Certifications removed - was unverified data
  // Only show certifications for verified providers who have uploaded proof
  const certifications: string[] = []

  // Parse languages from description field if available
  const extractLanguagesFromDescription = (description: string | null | undefined): string[] => {
    if (!description) return ['English']
    const match = description.match(/\*\*Languages Spoken:\*\*\s*\n([^\n]+)/)
    if (match) {
      return match[1].split(',').map(l => l.trim()).filter(Boolean)
    }
    return ['English']
  }

  // Parse languages (try description first, then fallback to provider.languages field)
  const languages = provider.description ?
    extractLanguagesFromDescription(provider.description) :
    ((provider.languages && provider.languages !== 'nan' && provider.languages !== '') ?
      provider.languages.split(',').map(l => l.trim()).filter(Boolean) : ['English'])

  // Parse business images
  const businessImages = (provider.businessImages && provider.businessImages !== 'nan' && provider.businessImages !== '') ?
    provider.businessImages.split(',').map(img => img.trim()).filter(Boolean) : []

  // Convert EnrichedProvider to Provider-compatible format
  const providerForSchema = {
    ...provider,
    services: provider.services as any,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt
  }

  // Get provider tier badge
  const registeredBadge = getProviderBadge(provider.id)

  // Check if provider is verified (based on database status)
  const isVerified = provider.status === 'VERIFIED'

  return (
    <>
      <ProviderSchema provider={providerForSchema as any} />

      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className={`bg-white shadow-sm ${isVerified ? 'border-l-4 border-l-green-500 border-b' : 'border-b'}`}>
          <div className="container mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-600 mb-4">
              <Link href="/" className="hover:text-primary-600">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/search" className="hover:text-primary-600">Search</Link>
              <span className="mx-2">/</span>
              {provider.state && (
                <>
                  <Link href={`/us/${provider.state.toLowerCase()}`} className="hover:text-primary-600">
                    {provider.state}
                  </Link>
                  <span className="mx-2">/</span>
                </>
              )}
              {provider.city && (
                <>
                  <Link
                    href={`/us/${provider.state?.toLowerCase()}/${provider.city.toLowerCase().replace(/\s+/g, '-')}`}
                    className="hover:text-primary-600"
                  >
                    {provider.city}
                  </Link>
                  <span className="mx-2">/</span>
                </>
              )}
              <span className="text-gray-900">{provider.name}</span>
            </nav>

            {/* Backlink to State Page */}
            {provider.state && (
              <div className="mb-4">
                <Link
                  href={`/us/${provider.state.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  ← Back to mobile phlebotomists in {provider.state}
                </Link>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo/Profile Image */}
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white rounded-lg shadow-md overflow-hidden">
                  <ProviderImage
                    src={provider.logo || provider.profileImage || ''}
                    alt={`${provider.name} logo`}
                    className="object-contain p-2"
                  />
                </div>
              </div>

              {/* Provider Info */}
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  {provider.name}
                </h1>

                {/* Verified/Unverified Status Badge */}
                <div className="mb-3">
                  {isVerified ? (
                    <Image src="/images/PV_Badge.png" alt="Platform Verified" width={180} height={36} className="h-9 w-auto" />
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-500 bg-opacity-10 border border-yellow-600">
                      <span className="text-yellow-800 font-semibold text-sm">⚠️ Unverified Listing</span>
                    </div>
                  )}
                </div>

                {/* Additional Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {/* Nationwide Badge */}
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
                </div>

                {/* Unverified Warning Message */}
                {!isVerified && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-900 leading-relaxed">
                      <strong>Information on this page may be outdated or incomplete.</strong><br />
                      If this is your business, <Link href={`/providers/claim?id=${provider.id}`} className="text-primary-600 hover:text-primary-700 underline font-medium">claim this listing</Link> to verify details and receive referrals.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-gray-600 mb-2">
                  <span className="flex items-center">📍 {location}</span>
                  {provider.phone && (
                    <div className="flex flex-col">
                      <a href={`tel:${provider.phone}`} className="flex items-center hover:text-primary-600">
                        📞 {formatPhoneNumber(provider.phone)}
                      </a>
                      {!isVerified && (
                        <span className="text-xs text-gray-500 mt-1 leading-tight">
                          Phone number unverified. Please request a draw for fastest service.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {provider.totalScore && provider.reviewsCount && (
                  <div className="mb-4">
                    <RatingBadge
                      rating={Number(provider.totalScore)}
                      reviewsCount={Number(provider.reviewsCount)}
                    />
                  </div>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 text-sm mb-4">
                  {yearInBusiness && yearInBusiness > 0 && (
                    <div>
                      <span className="text-gray-500">Experience:</span>
                      <span className="ml-1 font-semibold">{yearInBusiness}+ years</span>
                    </div>
                  )}
                  {provider.teamSize && (
                    <div>
                      <span className="text-gray-500">Team Size:</span>
                      <span className="ml-1 font-semibold">{provider.teamSize}</span>
                    </div>
                  )}
                  {provider.serviceRadius && (
                    <div>
                      <span className="text-gray-500">Service Radius:</span>
                      <span className="ml-1 font-semibold">{provider.serviceRadius}</span>
                    </div>
                  )}
                  {provider.travelFee && (
                    <div>
                      <span className="text-gray-500">Travel Fee:</span>
                      <span className="ml-1 font-semibold">{provider.travelFee}</span>
                    </div>
                  )}
                </div>

                {/* Report Issue Link */}
                <div className="pt-2 border-t border-gray-200">
                  <ReportIssueButton providerId={provider.id} providerName={provider.name} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Parse and display structured description */}
              {(() => {
                const description = provider.description || provider.bio || provider.validation_notes
                if (!description) return null

                // Extract service locations
                const locationsMatch = description.match(/\*\*Service Locations:\*\*\s*\n((?:📍[^\n]+\n(?:[^\n*]+\n?)+)+)/)
                const primaryContactMatch = description.match(/\*\*Primary Contact:\*\*\s*([^\n]+)/)
                const comprehensiveServicesMatch = description.match(/\*\*Comprehensive Services:\*\*\s*\n([^\n]+)/)

                return (
                  <>
                    {/* About/Intro Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">About {provider.name}</h2>
                      <div className="prose max-w-none text-gray-600">
                        <p>{description.split('\n\n')[0].replace(/\*\*/g, '')}</p>
                        {primaryContactMatch && (
                          <p className="mt-3 text-sm">
                            <strong>Primary Contact:</strong> {primaryContactMatch[1]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Service Locations Card */}
                    {locationsMatch && (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Office Locations</h2>
                        <div className="space-y-6">
                          {(() => {
                            const locationBlocks = locationsMatch[1].split(/(?=📍)/).filter(Boolean)
                            return locationBlocks.map((block, idx) => {
                              const lines = block.trim().split('\n').filter(Boolean)
                              const locationName = lines[0].replace('📍', '').trim().replace(':', '')
                              const address = lines.find(l => l.match(/^\d+/))
                              const hours = lines.find(l => l.toLowerCase().includes('hours:'))

                              return (
                                <div key={idx} className="border-l-4 border-primary-500 pl-4">
                                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{locationName}</h3>
                                  {address && (
                                    <p className="text-gray-600 mb-1">
                                      <span className="mr-2">📍</span>
                                      {address.trim()}
                                    </p>
                                  )}
                                  {hours && (
                                    <p className="text-gray-600">
                                      <span className="mr-2">🕒</span>
                                      {hours.replace('Hours:', '').trim()}
                                    </p>
                                  )}
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Comprehensive Services from Description */}
                    {comprehensiveServicesMatch && (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Services</h2>
                        <div className="text-gray-600">
                          <p className="leading-relaxed">{comprehensiveServicesMatch[1]}</p>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}

              {/* Services Section */}
              {provider.services && provider.services.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Services Offered</h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service) => (
                      <span
                        key={service}
                        className="bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 text-sm font-medium px-4 py-2 rounded-full border border-primary-300"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                  {provider.specialties && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Specialties</h3>
                      <p className="text-gray-600">{provider.specialties}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Languages Section */}
              {languages && languages.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Languages Spoken</h2>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((language) => (
                      <span
                        key={language}
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        🗣️ {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coverage Area */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Area</h2>
                <div className="space-y-3">
                  {/* Show coverage description from description field or fallback */}
                  {(() => {
                    // Extract coverage from description if available
                    if (provider.description) {
                      const coverageMatch = provider.description.match(/\*\*Coverage Area:\*\*\s*\n((?:•[^\n]+\n?)+)/)
                      if (coverageMatch) {
                        const coverageLines = coverageMatch[1].split('\n').filter(line => line.trim())
                        return (
                          <div className="text-gray-600">
                            <strong className="text-gray-900">Coverage:</strong>
                            <ul className="list-none mt-2 space-y-1">
                              {coverageLines.map((line, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">📍</span>
                                  <span>{line.replace('•', '').trim()}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      }
                    }
                    // Fallback to existing fields
                    return (
                      <p className="text-gray-600">
                        <strong>Coverage:</strong> {provider['regions serviced'] || provider.verified_service_areas || formatCoverageDisplay(provider.coverage)}
                      </p>
                    )
                  })()}
                </div>
              </div>

              {/* Testimonials */}
              {testimonials.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Testimonials</h2>
                  <div className="space-y-4">
                    {testimonials.map((testimonial, index) => (
                      <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                        <p className="text-gray-600 italic">&ldquo;{testimonial}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Images - Removed due to broken external links */}
            </div>

            {/* Right Column - Contact & Details */}
            <div className="space-y-6">
              {/* Claim Business Button - Only show if not already verified */}
              {!isVerified && (
                <ClaimBusinessButton providerId={provider.id} providerName={provider.name} />
              )}

              {/* CTA Section - Lead Gen */}
              <ProviderCTASection
                providerId={provider.id}
                providerName={provider.name}
                city={provider.city || undefined}
                state={provider.state || undefined}
                zip={provider.zipCodes?.split(',')[0] || undefined}
                phone={provider.phone || undefined}
                isVerified={isVerified}
              />

              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>

                <div className="space-y-4 mb-6">
                  {provider.phone && (
                    <div className="flex items-start">
                      <span className="text-gray-500 mr-2">📞</span>
                      <div>
                        <p className="font-semibold text-gray-900">{formatPhoneNumber(provider.phone)}</p>
                        <p className="text-sm text-gray-500">Primary Phone</p>
                        {!isVerified && (
                          <p className="text-xs text-amber-600 mt-1">⚠️ Unverified - confirm details</p>
                        )}
                      </div>
                    </div>
                  )}

                  {provider.website && (
                    <div className="flex items-start">
                      <span className="text-gray-500 mr-2">🌐</span>
                      <div>
                        <ProviderWebsiteLink
                          website={provider.website}
                          providerName={provider.name}
                          providerCity={provider.city || undefined}
                          providerState={provider.state || undefined}
                          className="font-semibold text-primary-600 hover:underline"
                        />
                        <p className="text-sm text-gray-500">Official Website</p>
                      </div>
                    </div>
                  )}

                  {provider.contactPerson && (
                    <div className="flex items-start">
                      <span className="text-gray-500 mr-2">👤</span>
                      <div>
                        <p className="font-semibold text-gray-900">{provider.contactPerson}</p>
                        <p className="text-sm text-gray-500">Contact Person</p>
                      </div>
                    </div>
                  )}
                </div>

                <ProviderActions
                  provider={providerForSchema as any}
                  currentLocation={`provider-detail-${params.slug}`}
                  variant="detailed"
                  showStructuredData={false}
                  hideViewDetails={true}
                />
              </div>

              {/* Additional Details Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h3>

                <div className="space-y-4">
                  {/* Availability */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Availability</h4>
                    <div className="space-y-1">
                      {(provider.emergencyAvailable === 'TRUE' || provider.emergencyAvailable === 'True' || provider.emergencyAvailable === 'Yes') && (
                        <p className="text-sm text-green-600">✓ Emergency services available</p>
                      )}
                      {(provider.weekendAvailable === 'TRUE' || provider.weekendAvailable === 'True' || provider.weekendAvailable === 'Yes') && (
                        <p className="text-sm text-green-600">✓ Weekend appointments available</p>
                      )}
                      {(provider.emergencyAvailable === 'No' || provider.emergencyAvailable === 'FALSE' || provider.emergencyAvailable === 'False') &&
                       (provider.weekendAvailable === 'No' || provider.weekendAvailable === 'FALSE' || provider.weekendAvailable === 'False') && (
                        <p className="text-sm text-gray-600">Standard business hours</p>
                      )}
                    </div>
                  </div>

                  {/* Certifications */}
                  {certifications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {certifications.map((cert, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* License & Insurance */}
                  {(provider.licenseNumber || provider.insuranceAmount) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Credentials</h4>
                      <div className="space-y-1">
                        {provider.licenseNumber && (
                          <p className="text-sm text-gray-600">
                            <strong>License:</strong> {provider.licenseNumber}
                          </p>
                        )}
                        {provider.insuranceAmount && (
                          <p className="text-sm text-gray-600">
                            <strong>Insurance:</strong> {provider.insuranceAmount}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Google Maps Link */}
                  {provider.url && (
                    <div className="pt-4 border-t">
                      <a
                        href={provider.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="mr-2">🗺️</span>
                        View on Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}