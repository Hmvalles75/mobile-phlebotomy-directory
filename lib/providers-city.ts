import 'server-only'
import { unstable_cache } from 'next/cache'
import { getAllProviders } from './providers-db'
import { SEO_CACHE_TTL_SECONDS } from './seo/internalLinks'

/**
 * City provider lookup, shared between the JSON API and the server-rendered
 * city page.
 *
 * ── Why this was rewritten (2026-08-21) ───────────────────────────────────────
 * The previous implementation classified providers by NAME, and its guards read
 * four fields — is_mobile_phlebotomy, is_nationwide, verified_service_areas,
 * validation_notes — that exist only on the legacy JSON-era EnrichedProvider
 * type. toEnrichedProvider never populates them and Prisma has no such columns,
 * so all four were permanently `undefined`. Every guard silently never fired.
 *
 * What survived was a single rule: exact city-name match, else same state.
 * "Regional" therefore meant "anywhere in this state." Every Pennsylvania city
 * page shipped the identical 23 providers; Erie and Pittsburgh are 300 miles
 * apart and their directories were byte-identical. 302 of 530 city pages
 * contained nobody who actually claimed that city.
 *
 * Geography replaces naming:
 *   local     — the provider's own service radius covers this city. The only
 *               bucket counted in the page headline.
 *   regional  — within REGIONAL_CAP_MILES but outside their radius. Rendered
 *               below the local list under "Also travel to {city}", never
 *               counted as coverage.
 *
 * The `statewide` bucket is gone. It was fed exclusively by is_nationwide, so
 * it has always been empty.
 */

export {
  REGIONAL_CAP_MILES,
  bucketProvidersForCity,
} from './cityGeography'
export type { GroupedCityProviders } from './cityGeography'

import { bucketProvidersForCity } from './cityGeography'
import type { GroupedCityProviders } from './cityGeography'

async function computeProvidersByCity(
  cityName: string,
  stateAbbr: string,
): Promise<GroupedCityProviders> {
  return bucketProvidersForCity(await getAllProviders(), cityName, stateAbbr)
}

/**
 * Cached because this now geocodes every provider on every call, which must not
 * happen per-request. Same TTL as the other SEO caches.
 */
export const getProvidersByCity = unstable_cache(
  computeProvidersByCity,
  ['providers-by-city'],
  { revalidate: SEO_CACHE_TTL_SECONDS, tags: ['internal-links'] },
)

/** Flattened: local first, then regional. */
export async function getAllProvidersForCity(cityName: string, stateAbbr: string): Promise<any[]> {
  const r = await getProvidersByCity(cityName, stateAbbr)
  return [...r.local, ...r.regional]
}
