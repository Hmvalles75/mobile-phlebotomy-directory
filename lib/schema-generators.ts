import { type Provider } from './schemas'

export interface LocalBusinessSchema {
  '@context': string
  '@type': string
  '@id'?: string
  name: string
  description?: string
  url?: string
  telephone?: string
  email?: string
  image?: string | string[]
  logo?: string
  priceRange?: string
  address?: {
    '@type': string
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  geo?: {
    '@type': string
    latitude?: number
    longitude?: number
  }
  areaServed?: Array<{
    '@type': string
    name: string
    geoMidpoint?: {
      '@type': string
      latitude?: number
      longitude?: number
    }
  }>
  aggregateRating?: {
    '@type': string
    ratingValue: number
    reviewCount: number
    bestRating?: number
    worstRating?: number
  }
  review?: Array<{
    '@type': string
    reviewRating: {
      '@type': string
      ratingValue: number
      bestRating?: number
      worstRating?: number
    }
    author: {
      '@type': string
      name: string
    }
    datePublished?: string
    reviewBody?: string
  }>
  openingHoursSpecification?: Array<{
    '@type': string
    dayOfWeek: string | string[]
    opens?: string
    closes?: string
  }>
  hasOfferCatalog?: {
    '@type': string
    name: string
    itemListElement: Array<{
      '@type': string
      itemOffered: {
        '@type': string
        name: string
        description?: string
      }
    }>
  }
  sameAs?: string[]
  paymentAccepted?: string[]
  currenciesAccepted?: string
  availableLanguage?: string | string[]
  hasCredential?: Array<{
    '@type': string
    credentialCategory: string
    name?: string
    issuedBy?: {
      '@type': string
      name: string
    }
  }>
}

export interface MedicalBusinessSchema extends LocalBusinessSchema {
  '@type': 'MedicalBusiness' | 'MedicalClinic' | 'HealthAndBeautyBusiness'
  medicalSpecialty?: string | string[]
  isAcceptingNewPatients?: boolean
  availableService?: Array<{
    '@type': string
    name: string
    description?: string
    offers?: {
      '@type': string
      price?: string
      priceCurrency?: string
    }
  }>
}

export interface ServiceSchema {
  '@context': string
  '@type': string
  name: string
  description?: string
  provider: {
    '@type': string
    name: string
    telephone?: string
    url?: string
  }
  areaServed?: {
    '@type': string
    name: string
  }
  offers?: {
    '@type': string
    price?: string
    priceCurrency?: string
    availability?: string
    validFrom?: string
    priceSpecification?: {
      '@type': string
      price?: string
      priceCurrency?: string
      unitText?: string
    }
  }
  aggregateRating?: {
    '@type': string
    ratingValue: number
    reviewCount: number
  }
}

/**
 * Generate LocalBusiness schema for a provider
 */
export function generateLocalBusinessSchema(
  provider: Provider,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'
): MedicalBusinessSchema {
  const schema: MedicalBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': `${baseUrl}/provider/${provider.id}`,
    name: provider.name,
    description: provider.description || `Mobile phlebotomy services by ${provider.name}`,
    medicalSpecialty: ['Phlebotomy', 'Laboratory Medicine', 'Diagnostic Services'],
    isAcceptingNewPatients: true
  }

  // Add contact information
  if (provider.phone) {
    schema.telephone = provider.phone
  }
  if (provider.website) {
    schema.url = provider.website
  }
  if (provider.email) {
    schema.email = provider.email
  }

  // Add address
  if (provider.address) {
    schema.address = {
      '@type': 'PostalAddress',
      addressLocality: provider.address.city,
      addressRegion: provider.address.state,
      postalCode: provider.address.zip,
      addressCountry: 'US'
    }
    if (provider.address.street) {
      schema.address.streetAddress = provider.address.street
    }
  }

  // Add geo coordinates if available
  if (provider.coords) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: provider.coords.lat,
      longitude: provider.coords.lng
    }
  }

  // Add service areas
  if (provider.coverage) {
    schema.areaServed = []

    if (provider.coverage.cities && provider.coverage.cities.length > 0) {
      provider.coverage.cities.forEach(city => {
        schema.areaServed!.push({
          '@type': 'City',
          name: city
        })
      })
    }

    if (provider.coverage.regions && provider.coverage.regions.length > 0) {
      provider.coverage.regions.forEach(region => {
        schema.areaServed!.push({
          '@type': 'AdministrativeArea',
          name: region
        })
      })
    }

    if (provider.coverage.states && provider.coverage.states.length > 0) {
      provider.coverage.states.forEach(state => {
        schema.areaServed!.push({
          '@type': 'State',
          name: state
        })
      })
    }
  }

  // Add ratings
  if (provider.rating && provider.reviewsCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: provider.rating,
      reviewCount: provider.reviewsCount,
      bestRating: 5,
      worstRating: 1
    }
  }

  // Add services
  if (provider.services && provider.services.length > 0) {
    schema.availableService = provider.services.map(service => ({
      '@type': 'MedicalProcedure',
      name: service,
      description: getServiceDescription(service),
      offers: {
        '@type': 'Offer',
        price: '60-120',
        priceCurrency: 'USD'
      }
    }))
  }

  // Add operating hours
  if (provider.availability && provider.availability.length > 0) {
    schema.openingHoursSpecification = []
    const dayMapping: Record<string, string[]> = {
      'Weekdays': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      'Weekends': ['Saturday', 'Sunday'],
      '24/7': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      'Monday-Friday': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      'Saturday': ['Saturday'],
      'Sunday': ['Sunday']
    }

    provider.availability.forEach(avail => {
      const days = dayMapping[avail] || [avail]
      schema.openingHoursSpecification!.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: days,
        opens: avail === '24/7' ? '00:00' : '08:00',
        closes: avail === '24/7' ? '23:59' : '18:00'
      })
    })
  }

  // Add payment methods
  if (provider.payment && provider.payment.length > 0) {
    schema.paymentAccepted = provider.payment
    schema.currenciesAccepted = 'USD'
  }

  // Add certifications/credentials
  if (provider.badges && provider.badges.length > 0) {
    schema.hasCredential = provider.badges.map(badge => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: badge,
      name: badge
    }))
  }

  // Add same as (website link)
  if (provider.website) {
    schema.sameAs = [provider.website]
  }

  // Add price range
  schema.priceRange = '$$'

  return schema
}

/**
 * Generate Service schema for mobile phlebotomy service
 */
export function generateServiceSchema(
  provider: Provider,
  serviceName: string,
  location?: string
): ServiceSchema {
  const schema: ServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${serviceName} - ${provider.name}`,
    description: `Professional ${serviceName.toLowerCase()} services provided by ${provider.name}${location ? ` in ${location}` : ''}`,
    provider: {
      '@type': 'MedicalBusiness',
      name: provider.name,
      telephone: provider.phone,
      url: provider.website
    }
  }

  if (location) {
    schema.areaServed = {
      '@type': 'City',
      name: location
    }
  }

  schema.offers = {
    '@type': 'Offer',
    price: '60-120',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    validFrom: new Date().toISOString().split('T')[0]
  }

  if (provider.rating && provider.reviewsCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: provider.rating,
      reviewCount: provider.reviewsCount
    }
  }

  return schema
}

/**
 * Generate Review schema
 */
export function generateReviewSchema(
  provider: Provider,
  reviews?: Array<{
    author: string
    rating: number
    date?: string
    text?: string
  }>
) {
  if (!reviews || reviews.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${provider.name} Mobile Phlebotomy Services`,
    description: provider.description || 'Professional mobile phlebotomy services',
    brand: {
      '@type': 'Brand',
      name: provider.name
    },
    aggregateRating: provider.rating && provider.reviewsCount ? {
      '@type': 'AggregateRating',
      ratingValue: provider.rating,
      reviewCount: provider.reviewsCount,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    review: reviews.map(review => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1
      },
      author: {
        '@type': 'Person',
        name: review.author
      },
      datePublished: review.date || new Date().toISOString().split('T')[0],
      reviewBody: review.text
    }))
  }
}

/**
 * Generate ItemList schema for provider listings
 */
export function generateProviderListSchema(
  providers: Provider[],
  title: string,
  description: string,
  currentUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description: description,
    url: currentUrl,
    numberOfItems: providers.length,
    itemListElement: providers.map((provider, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'MedicalBusiness',
        '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/provider/${provider.id}`,
        name: provider.name,
        description: provider.description,
        telephone: provider.phone,
        url: provider.website,
        address: provider.address ? {
          '@type': 'PostalAddress',
          addressLocality: provider.address.city,
          addressRegion: provider.address.state,
          postalCode: provider.address.zip
        } : undefined,
        aggregateRating: provider.rating && provider.reviewsCount ? {
          '@type': 'AggregateRating',
          ratingValue: provider.rating,
          reviewCount: provider.reviewsCount
        } : undefined,
        priceRange: '$$'
      }
    }))
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${process.env.NEXT_PUBLIC_SITE_URL}${item.url}`
    }))
  }
}

/**
 * Helper function to get service descriptions
 */
function getServiceDescription(service: string): string {
  const descriptions: Record<string, string> = {
    'At-Home Blood Draw': 'Professional blood collection services performed at your home or preferred location',
    'Corporate Wellness': 'On-site employee health screening and blood draw services for businesses',
    'Pediatric': 'Specialized blood draw services for infants and children with gentle, experienced care',
    'Geriatric': 'Compassionate blood collection services for elderly patients in their homes or care facilities',
    'Fertility/IVF': 'Time-sensitive blood draw services for fertility testing and IVF monitoring',
    'Specimen Pickup': 'Collection and transport of laboratory specimens to testing facilities',
    'Lab Partner': 'Direct partnership with laboratories for seamless testing and result delivery',
    'Mobile Drug Testing': 'On-site drug screening and collection services for employers',
    'COVID-19 Testing': 'Mobile COVID-19 testing including PCR and rapid antigen tests',
    'Wellness Panels': 'Comprehensive health screening panels performed at your convenience'
  }
  return descriptions[service] || `Professional ${service} services`
}