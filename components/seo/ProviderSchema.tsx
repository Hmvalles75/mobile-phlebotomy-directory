'use client'

import { type Provider } from '@/lib/schemas'
import {
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateReviewSchema
} from '@/lib/schema-generators'

interface ProviderSchemaProps {
  provider: Provider
  location?: string
  reviews?: Array<{
    author: string
    rating: number
    date?: string
    text?: string
  }>
}

export function ProviderSchema({ provider, location, reviews }: ProviderSchemaProps) {
  // Generate Local Business schema
  const localBusinessSchema = generateLocalBusinessSchema(provider)

  // Generate Service schemas for each service
  const serviceSchemas = provider.services.map(service =>
    generateServiceSchema(provider, service, location)
  )

  // Generate Review schema if reviews are provided
  const reviewSchema = reviews && reviews.length > 0
    ? generateReviewSchema(provider, reviews)
    : null

  // Combine all schemas into a graph
  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      localBusinessSchema,
      ...serviceSchemas,
      ...(reviewSchema ? [reviewSchema] : [])
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaGraph, null, 2)
      }}
    />
  )
}

interface ProviderListSchemaProps {
  providers: Provider[]
  title: string
  description: string
  location?: {
    city?: string
    state?: string
    metro?: string
  }
}

export function ProviderListSchema({
  providers,
  title,
  description,
  location
}: ProviderListSchemaProps) {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  const itemListSchema = {
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
        description: provider.description || `Mobile phlebotomy services by ${provider.name}`,
        telephone: provider.phone,
        url: provider.website,
        address: provider.address ? {
          '@type': 'PostalAddress',
          addressLocality: provider.address.city,
          addressRegion: provider.address.state,
          postalCode: provider.address.zip,
          addressCountry: 'US'
        } : undefined,
        priceRange: '$$'
        // REMOVED: aggregateRating to prevent "multiple aggregate ratings" error
        // Ratings should only appear on individual provider detail pages
      }
    }))
  }

  // Add location context if provided
  const locationSchema = location ? {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: location.city || location.metro || location.state,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.city,
      addressRegion: location.state,
      addressCountry: 'US'
    }
  } : null

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      itemListSchema,
      ...(locationSchema ? [locationSchema] : [])
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaGraph, null, 2)
      }}
    />
  )
}

interface RatingSchemaProps {
  rating: number
  reviewCount: number
  itemName: string
  showStars?: boolean
}

export function RatingSchema({ rating, reviewCount, itemName, showStars = true }: RatingSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: rating,
    reviewCount: reviewCount,
    bestRating: 5,
    worstRating: 1,
    itemReviewed: {
      '@type': 'MedicalBusiness',
      name: itemName
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema, null, 2)
        }}
      />
      {showStars && (
        <div className="inline-flex items-center">
          <span className="text-yellow-400">
            {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
          </span>
          <span className="ml-2 text-sm text-gray-600">
            {rating} ({reviewCount} reviews)
          </span>
        </div>
      )}
    </>
  )
}