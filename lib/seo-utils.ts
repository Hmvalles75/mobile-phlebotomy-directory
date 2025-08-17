// SEO utilities for provider interactions and pages
import { type Provider } from './schemas'

export interface SEOMetaTags {
  title: string
  description: string
  keywords: string[]
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterCard?: 'summary' | 'summary_large_image'
  structuredData?: any
}

// Generate SEO meta tags for provider listing pages
export function generateProviderListingSEO(
  location: string,
  providerCount: number,
  pageType: 'city' | 'state' | 'region' | 'search' = 'search',
  baseUrl: string = ''
): SEOMetaTags {
  const locationName = location.replace(/[,-]/g, ' ').trim()
  
  const titles = {
    city: `Mobile Phlebotomy in ${locationName} | ${providerCount} Providers Available`,
    state: `Mobile Phlebotomy Services in ${locationName} | Find Licensed Providers`,
    region: `${locationName} Mobile Phlebotomy | Professional At-Home Blood Draws`,
    search: `Mobile Phlebotomy Providers${locationName ? ` in ${locationName}` : ''} | MobilePhlebotomy.org`
  }

  const descriptions = {
    city: `Find ${providerCount} licensed mobile phlebotomy providers in ${locationName}. Professional at-home blood draws, lab collections, and mobile health services. Book same-day appointments.`,
    state: `Professional mobile phlebotomy services throughout ${locationName}. Licensed, certified providers offering convenient at-home blood draws and lab collections. HIPAA compliant.`,
    region: `Mobile phlebotomy services in the ${locationName} area. Professional, licensed phlebotomists providing at-home blood draws and specimen collection. Same-day appointments available.`,
    search: `Search mobile phlebotomy providers${locationName ? ` in ${locationName}` : ' nationwide'}. Licensed professionals offering at-home blood draws, lab collections, and mobile health services.`
  }

  const keywords = [
    'mobile phlebotomy',
    'at-home blood draw',
    'mobile blood collection',
    'phlebotomist near me',
    'home blood test',
    'mobile lab services',
    locationName.toLowerCase(),
    'licensed phlebotomist',
    'HIPAA compliant',
    'same day blood draw',
    'mobile health services',
    'specimen collection'
  ].filter(Boolean)

  return {
    title: titles[pageType],
    description: descriptions[pageType],
    keywords,
    ogTitle: titles[pageType],
    ogDescription: descriptions[pageType],
    twitterCard: 'summary'
  }
}

// Generate SEO meta tags for individual provider pages
export function generateProviderSEO(
  provider: Provider,
  baseUrl: string = ''
): SEOMetaTags {
  const location = provider.address?.city && provider.address?.state 
    ? `${provider.address.city}, ${provider.address.state}`
    : provider.coverage.cities?.[0] || provider.coverage.states?.[0] || ''

  const title = `${provider.name} | Mobile Phlebotomy${location ? ` in ${location}` : ''}`
  
  const description = provider.description || 
    `${provider.name} provides professional mobile phlebotomy services${location ? ` in ${location}` : ''}. Licensed and certified for at-home blood draws, lab collections, and mobile health services.`

  const keywords = [
    provider.name.toLowerCase(),
    'mobile phlebotomy',
    'at-home blood draw',
    'phlebotomist',
    location.toLowerCase(),
    ...provider.services.map(s => s.toLowerCase()),
    'licensed',
    'certified',
    'HIPAA compliant'
  ].filter(Boolean)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: provider.name,
    description,
    url: provider.website,
    telephone: provider.phone,
    email: provider.email,
    serviceType: 'Mobile Phlebotomy',
    medicalSpecialty: 'Phlebotomy',
    paymentAccepted: provider.payment || ['Cash', 'Credit Card', 'Insurance'],
    availableService: provider.services.map(service => ({
      '@type': 'MedicalProcedure',
      name: service,
      description: `Professional ${service.toLowerCase()} services`
    }))
  }

  if (provider.address?.city && provider.address?.state) {
    structuredData.address = {
      '@type': 'PostalAddress',
      addressLocality: provider.address.city,
      addressRegion: provider.address.state,
      addressCountry: 'US'
    }
  }

  if (provider.rating && provider.reviewsCount) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: provider.rating,
      reviewCount: provider.reviewsCount,
      bestRating: 5,
      worstRating: 1
    }
  }

  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    twitterCard: 'summary',
    structuredData
  }
}

// Generate SEO for saved providers page
export function generateSavedProvidersSEO(
  providerCount: number,
  baseUrl: string = ''
): SEOMetaTags {
  const title = `Saved Providers (${providerCount}) | MobilePhlebotomy.org`
  const description = `Manage your ${providerCount} saved mobile phlebotomy providers. Quick access to contact information, services, and booking details for your preferred providers.`

  return {
    title,
    description,
    keywords: [
      'saved providers',
      'mobile phlebotomy',
      'bookmarked providers',
      'provider comparison',
      'healthcare providers'
    ],
    ogTitle: title,
    ogDescription: description,
    twitterCard: 'summary'
  }
}

// Generate canonical URLs for different page types
export function generateCanonicalUrl(
  pageType: 'home' | 'search' | 'state' | 'city' | 'region' | 'provider' | 'saved',
  params: {
    state?: string
    city?: string
    region?: string
    providerId?: string
    query?: string
  } = {},
  baseUrl: string = 'https://mobilephlebotomy.org'
): string {
  switch (pageType) {
    case 'home':
      return baseUrl
    case 'search':
      return params.query ? `${baseUrl}/search?q=${encodeURIComponent(params.query)}` : `${baseUrl}/search`
    case 'state':
      return `${baseUrl}/us/${params.state}`
    case 'city':
      return `${baseUrl}/us/${params.state}/${params.city}`
    case 'region':
      return `${baseUrl}/us/${params.state}/${params.region}`
    case 'provider':
      return `${baseUrl}/providers/${params.providerId}`
    case 'saved':
      return `${baseUrl}/saved`
    default:
      return baseUrl
  }
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>,
  baseUrl: string = 'https://mobilephlebotomy.org'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url.startsWith('http') ? breadcrumb.url : `${baseUrl}${breadcrumb.url}`
    }))
  }
}

// Create meta tags HTML string
export function createMetaTagsHTML(meta: SEOMetaTags): string {
  const tags = [
    `<title>${meta.title}</title>`,
    `<meta name="description" content="${meta.description}" />`,
    `<meta name="keywords" content="${meta.keywords.join(', ')}" />`,
    `<meta property="og:title" content="${meta.ogTitle || meta.title}" />`,
    `<meta property="og:description" content="${meta.ogDescription || meta.description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="${meta.twitterCard || 'summary'}" />`,
    `<meta name="twitter:title" content="${meta.ogTitle || meta.title}" />`,
    `<meta name="twitter:description" content="${meta.ogDescription || meta.description}" />`
  ]

  if (meta.canonicalUrl) {
    tags.push(`<link rel="canonical" href="${meta.canonicalUrl}" />`)
  }

  if (meta.ogImage) {
    tags.push(`<meta property="og:image" content="${meta.ogImage}" />`)
    tags.push(`<meta name="twitter:image" content="${meta.ogImage}" />`)
  }

  if (meta.structuredData) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>`)
  }

  return tags.join('\n')
}

// Helper to sanitize text for meta tags
export function sanitizeMetaText(text: string): string {
  return text
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .trim()
}

// Generate page-specific meta tags for Next.js metadata API
export function generateNextMetadata(meta: SEOMetaTags, baseUrl: string = 'https://mobilephlebotomy.org') {
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    canonical: meta.canonicalUrl,
    openGraph: {
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      type: 'website',
      siteName: 'MobilePhlebotomy.org',
      images: meta.ogImage ? [{ url: meta.ogImage }] : undefined
    },
    twitter: {
      card: meta.twitterCard || 'summary',
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      images: meta.ogImage ? [meta.ogImage] : undefined
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'application-name': 'MobilePhlebotomy.org',
      'apple-mobile-web-app-title': 'MobilePhlebotomy.org'
    }
  }
}