import { SITE_URL } from '@/lib/seo'
import type { EnrichedProvider } from '@/lib/providers'

/**
 * LocalBusiness (MedicalBusiness) JSON-LD for premium provider pages.
 *
 * Until 2026-09-17 the premium template emitted no structured data at all,
 * while the free listing template emitted MedicalBusiness + BreadcrumbList.
 * A paid page had less machine-readable data than a free one.
 *
 * Everything here comes from the provider record. Nothing is fabricated:
 *  - aggregateRating is deliberately absent. `testimonials` are provider-
 *    supplied quotes, not third-party reviews, and rating/reviewsCount are
 *    null on every premium page today.
 *  - Offers carry no price. There is no structured price data yet (prices
 *    live as a sentence in one provider's description). When a pricing field
 *    exists, add `price`/`priceCurrency` to each Offer and `priceRange` here.
 *  - geo comes from the primary ZIP centroid (server-side lookup), which is
 *    what the embedded map already uses.
 */

interface Props {
  provider: EnrichedProvider
  zips: string[]
  geo?: { lat: number; lng: number }
  services: string[]
  tagline?: string
}

function absolute(path: string | undefined | null): string | undefined {
  if (!path) return undefined
  return path.startsWith('http') ? path : `${SITE_URL}${path}`
}

function parseSocials(raw: unknown): string[] {
  if (!raw || typeof raw !== 'string') return []
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return []
    return Object.values(parsed).filter((v): v is string => typeof v === 'string' && v.startsWith('https://'))
  } catch {
    return []
  }
}

export function PremiumProviderSchema({ provider, zips, geo, services, tagline }: Props) {
  const url = `${SITE_URL}/provider/${provider.slug}`
  const primaryZip = zips[0]
  const images = [provider.heroPoster, provider.profileImage, provider.logo].map(absolute).filter(Boolean) as string[]
  const languages = (provider.languages && provider.languages !== 'nan')
    ? provider.languages.split(',').map(l => l.trim()).filter(Boolean)
    : []
  // sameAs must point at other identities of this business. A handful of
  // records carry a legacy path on our own domain in `website`; that is not
  // another identity, so anything on mobilephlebotomy.org is dropped.
  const ownHost = /(^|\.)mobilephlebotomy\.org$/i
  const external = (u: string) => { try { return !ownHost.test(new URL(u).hostname) } catch { return false } }
  const sameAs = [
    ...(provider.website && provider.website.startsWith('http') ? [provider.website] : []),
    ...parseSocials(provider.socialLinks),
  ].filter(external)
  // One provider lists 394 ZIPs; emitting all of them made a 33 KB script.
  // The first 60 (primary ZIP first) is plenty for areaServed.
  const areaZips = zips.slice(0, 60)

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': `${url}#business`,
    name: provider.name,
    url,
    ...(tagline ? { description: tagline } : {}),
    ...(images.length ? { image: images, logo: absolute(provider.logo) } : {}),
    ...(provider.phone ? { telephone: provider.phone } : {}),
    ...(provider.email ? { email: provider.email } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(provider.address?.street ? { streetAddress: provider.address.street } : {}),
      ...(provider.city ? { addressLocality: provider.city } : {}),
      ...(provider.state ? { addressRegion: provider.state } : {}),
      ...(primaryZip ? { postalCode: primaryZip } : {}),
      addressCountry: 'US',
    },
    ...(geo ? { geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng } } : {}),
    ...(areaZips.length ? { areaServed: areaZips.map(z => ({ '@type': 'PostalAddress', postalCode: z, addressCountry: 'US' })) } : {}),
    ...(languages.length ? { knowsLanguage: languages } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(services.length ? {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${provider.name} services`,
        itemListElement: services.map(name => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name, provider: { '@id': `${url}#business` } },
        })),
      },
    } : {}),
    medicalSpecialty: 'Phlebotomy',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
