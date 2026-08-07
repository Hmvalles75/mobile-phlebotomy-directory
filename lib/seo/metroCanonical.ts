/**
 * Canonical URL for a metro area.
 *
 * /us/metro/{slug} and /us/{state}/{city} were competing for the same queries:
 * 49 of the 51 metros map 1:1 onto an existing city page, so both tiers ranked
 * for "mobile phlebotomy {city}" and split the signal. The city tier wins the
 * consolidation because it is the only one with a generator
 * (scripts/upgrade-city-page.ts) producing real provider counts, LocalBusiness,
 * FAQPage and BreadcrumbList schema — metro pages have no equivalent tooling.
 *
 * Two metros are kept as metro pages because they have NO city-page twin:
 *   - new-york-city   (no /us/new-york/new-york-city; the city page is /new-york)
 *   - washington-dc   (no DC state row exists in the directory at all)
 * Redirecting either would 404, so both stay until their targets exist.
 *
 * Use metroHref() for every internal link to a metro. It resolves to the city
 * page where one exists, so links stop pointing at URLs that are about to
 * redirect, and no caller needs to know which metros are exceptions.
 */
import { CITY_MAPPING } from '@/data/cities-full'
import type { MetroArea } from '@/data/top-metros'

/** Metros with no city-page equivalent — these keep their /us/metro/ URL. */
export const METRO_ONLY_SLUGS = new Set<string>([
  'new-york-city',
  'washington-dc',
])

function slugify(v: string): string {
  return v.toLowerCase().trim().replace(/\s+/g, '-')
}

/**
 * Compound key into CITY_MAPPING for a metro, or null when the metro has no
 * matching city page.
 */
export function metroCityKey(metro: Pick<MetroArea, 'slug' | 'city' | 'state'>): string | null {
  if (METRO_ONLY_SLUGS.has(metro.slug)) return null
  const key = `${slugify(metro.state)}/${slugify(metro.city)}`
  return (CITY_MAPPING as Record<string, unknown>)[key] ? key : null
}

/**
 * Internal href for a metro. Returns the canonical city page when one exists,
 * otherwise the metro page.
 */
export function metroHref(metro: Pick<MetroArea, 'slug' | 'city' | 'state'>): string {
  const key = metroCityKey(metro)
  return key ? `/us/${key}` : `/us/metro/${metro.slug}`
}

/** True when this metro should 308 to its city page. */
export function metroRedirectsToCity(metro: Pick<MetroArea, 'slug' | 'city' | 'state'>): boolean {
  return metroCityKey(metro) !== null
}
