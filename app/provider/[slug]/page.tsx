import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProviderBySlug, getAllProviders, type EnrichedProvider } from '@/lib/providers'
import { formatCoverageDisplay } from '@/lib/coverage-utils'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { RatingBadge } from '@/components/ui/RatingBadge'
import { ProviderSchema } from '@/components/seo/ProviderSchema'
import { ProviderImage } from '@/components/ui/ProviderImage'
import Link from 'next/link'

interface PageProps {
  params: {
    slug: string
  }
}

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

  // Parse certifications (handle cleaned default values)
  const certifications = (provider.certifications && provider.certifications !== 'nan' && provider.certifications !== '') ?
    provider.certifications.split(',').map(c => c.trim()).filter(Boolean) : []

  // Parse languages (cleaned data defaults to 'English')
  const languages = (provider.languages && provider.languages !== 'nan' && provider.languages !== '') ?
    provider.languages.split(',').map(l => l.trim()).filter(Boolean) : ['English']

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

  return (
    <>
      <ProviderSchema provider={providerForSchema as any} />

      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b">
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
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {provider.name}
                </h1>

                {provider.is_mobile_phlebotomy === 'Yes' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-3">
                    ✓ Verified Mobile Phlebotomy Service
                  </span>
                )}

                <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                  <span className="flex items-center">📍 {location}</span>
                  {provider.phone && (
                    <a href={`tel:${provider.phone}`} className="flex items-center hover:text-primary-600">
                      📞 {provider.phone}
                    </a>
                  )}
                  {provider.email && provider.email !== '' && provider.email !== 'nan' && (
                    <a href={`mailto:${provider.email}`} className="flex items-center hover:text-primary-600">
                      ✉️ {provider.email}
                    </a>
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
                <div className="flex flex-wrap gap-6 text-sm">
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
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              {(provider.bio || provider.validation_notes) && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About {provider.name}</h2>
                  <div className="prose max-w-none text-gray-600">
                    <p>{provider.bio || provider.validation_notes}</p>
                  </div>
                </div>
              )}

              {/* Services Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Services Offered</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['At-Home Blood Draw', 'Specimen Pickup', 'Lab Partner', 'Corporate Wellness',
                    'Mobile Laboratory', 'Laboratory Services', 'Diagnostic Services'].map(service => (
                    <div key={service} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{service}</span>
                    </div>
                  ))}
                </div>
                {provider.specialties && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Specialties</h3>
                    <p className="text-gray-600">{provider.specialties}</p>
                  </div>
                )}
              </div>

              {/* Coverage Area */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Area</h2>
                <div className="space-y-3">
                  <p className="text-gray-600">
                    <strong>Coverage:</strong> {provider['regions serviced'] || provider.verified_service_areas || formatCoverageDisplay(provider.coverage)}
                  </p>
                  {provider.zipCodes && (
                    <div>
                      <strong className="text-gray-900">ZIP Codes Served:</strong>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(() => {
                          // Handle malformed zip codes
                          const zipString = String(provider.zipCodes)
                          // Check if it's a valid format (5 digits or comma-separated 5-digit codes)
                          const validZipPattern = /^\d{5}(,\s*\d{5})*$/

                          if (validZipPattern.test(zipString.replace(/\s/g, ''))) {
                            return zipString.split(',').map(zip => (
                              <span key={zip} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                {zip.trim()}
                              </span>
                            ))
                          } else {
                            // Don't display invalid zip codes
                            return null
                          }
                        })()}
                      </div>
                    </div>
                  )}
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
              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>

                <div className="space-y-4 mb-6">
                  {provider.phone && (
                    <div className="flex items-start">
                      <span className="text-gray-500 mr-2">📞</span>
                      <div>
                        <p className="font-semibold text-gray-900">{provider.phone}</p>
                        <p className="text-sm text-gray-500">Primary Phone</p>
                      </div>
                    </div>
                  )}

                  {provider.email && provider.email !== '' && provider.email !== 'nan' && (
                    <div className="flex items-start">
                      <span className="text-gray-500 mr-2">✉️</span>
                      <div>
                        <p className="font-semibold text-gray-900">{provider.email}</p>
                        <p className="text-sm text-gray-500">Email</p>
                      </div>
                    </div>
                  )}

                  {provider.website && (
                    <div className="flex items-start">
                      <span className="text-gray-500 mr-2">🌐</span>
                      <div>
                        <a href={provider.website} target="_blank" rel="noopener noreferrer"
                           className="font-semibold text-primary-600 hover:underline">
                          Visit Website
                        </a>
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

                  {/* Languages */}
                  {languages.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {languages.map((lang, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {lang}
                          </span>
                        ))}
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