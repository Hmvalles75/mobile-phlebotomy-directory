import 'server-only'
import { unstable_cache } from 'next/cache'
import zipcodes from 'zipcodes'
import { getAllProviders } from './providers-db'
import { getZipCoordinates, calculateDistance } from './zip-geocode'
import { DEFAULT_SERVICE_RADIUS_MILES } from './serviceRadius'
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

/** Nothing beyond this distance is shown on a city page under any bucket. */
export const REGIONAL_CAP_MILES = 100

/**
 * Phlebotomy is licensed at state level in these four. A provider 40 miles
 * across the line may not be permitted to draw there, so city pages in these
 * states list in-state providers only. Cross-border listing is allowed
 * everywhere else, where it is worth ~114 pages of real coverage.
 */
const LICENSURE_STATES = new Set(['CA', 'LA', 'NV', 'WA'])

export interface GroupedCityProviders {
  /** Service radius covers this city. The headline count. */
  local: any[]
  /** Within REGIONAL_CAP_MILES but outside their radius. Not coverage. */
  regional: any[]
}

/** City centroid from the bundled zipcodes dataset. No external geocoding. */
function cityCoordinates(cityName: string, stateAbbr: string) {
  const rows: any = (zipcodes as any).lookupByName(cityName, stateAbbr)
  if (Array.isArray(rows) && rows.length) {
    return { lat: rows[0].latitude, lng: rows[0].longitude }
  }
  return null
}

/**
 * Where a provider draws from. ProviderCoords is authoritative when present;
 * otherwise the first ZIP on the record. Providers with neither cannot be
 * placed on a map and are omitted rather than guessed at — see the address
 * backfill, which recovers most of them from primaryCity + primaryState.
 */
function providerCoordinates(provider: any) {
  if (provider.coords?.lat != null && provider.coords?.lng != null) {
    return { lat: provider.coords.lat, lng: provider.coords.lng }
  }
  const fromZips = coordinatesFromZipField(provider.zipCodes || provider.address?.zip)
  if (fromZips) return fromZips
  // Fall back to the centroid of their stated city. 389 providers carried no
  // ZIP, no address and no coords, so a radius rule dropped them entirely —
  // which is exactly why the old code fell back to "same state". 235 of them do
  // have primaryCity + primaryState, and the bundled dataset resolves those
  // locally, so no geocoding service is involved.
  //
  // Derived at query time rather than written into ProviderCoords on purpose:
  // that table is emitted as schema.org GeoCoordinates, and persisting a city
  // centroid would publish an invented precise location for a business that has
  // no storefront. Deriving it keeps the approximation internal, and a real ZIP
  // added later automatically wins over it.
  // Trimmed: one VERIFIED provider stored "Bergenfield " with a trailing space,
  // which is enough to miss the dataset lookup entirely.
  const city = String(provider.city || '').trim()
  if (city && provider.state) {
    return cityCoordinates(city, String(provider.state).toUpperCase())
  }
  return null
}

/**
 * First usable coordinate from a zipCodes field.
 *
 * The field is free text and providers fill it in inconsistently: a plain list
 * ("19101, 19102"), a state abbreviation ("NJ"), or — commonly — three-digit
 * prefix notation covering a whole region ("191*, 190*, 080*", "200xx, 201xx").
 * Reading only the first whitespace-delimited token and demanding five digits
 * dropped every provider using the prefix style, including two VERIFIED ones.
 *
 * Exact five-digit ZIPs win. Failing that, a prefix is expanded to the first
 * real ZIP inside it, which is accurate to within a few miles — far better than
 * discarding the provider's only location signal.
 */
function coordinatesFromZipField(raw: unknown) {
  const tokens = String(raw || '').split(/[,;\s]+/).filter(Boolean)

  for (const token of tokens) {
    const exact = token.match(/^(\d{5})$/)
    if (exact) {
      const hit = getZipCoordinates(exact[1])
      if (hit) return hit
    }
  }

  for (const token of tokens) {
    const prefix = token.match(/^(\d{3})\s*(?:\*|x{2})$/i)
    if (!prefix) continue
    for (let i = 0; i < 100; i++) {
      const hit = getZipCoordinates(prefix[1] + String(i).padStart(2, '0'))
      if (hit) return hit
    }
  }

  return null
}

/**
 * Stated radius, bounded by REGIONAL_CAP_MILES.
 *
 * The cap deliberately overrides three providers who claim 200 miles — the only
 * records above 100, all stating exactly 200, a round number that reads as
 * aspiration rather than measurement. Two hundred miles each way is a four-hour
 * drive, not a service area, and honouring it would let three self-reported
 * figures blanket New England and Southern California as asserted local
 * coverage. That is the "one provider covers everything" failure this file was
 * rewritten to remove, arriving by a different door.
 *
 * Nobody sits between 101 and 150, so raising the cap short of 200 changes
 * nothing. Revisit only if a provider with real delivered volume at that range
 * asks — the provenance rule already keeps our own defaults out of the count.
 */
function effectiveRadius(provider: any): number {
  const stated = provider.serviceRadiusMiles ?? DEFAULT_SERVICE_RADIUS_MILES
  return Math.min(stated, REGIONAL_CAP_MILES)
}

/** Did the provider actually tell us how far they travel? */
function hasStatedRadius(provider: any): boolean {
  return provider.serviceRadiusMiles != null
}

const normalizeCity = (value: unknown) => String(value || '').trim().toLowerCase()

/**
 * Did the provider name this city themselves — as their home base or in their
 * coverage list? Either is an assertion they serve it.
 */
function claimsCity(provider: any, cityName: string): boolean {
  const target = normalizeCity(cityName)
  if (normalizeCity(provider.city) === target) return true
  const covered: unknown[] = provider.coverage?.cities || []
  return covered.some(c => normalizeCity(c) === target)
}

async function computeProvidersByCity(
  cityName: string,
  stateAbbr: string,
): Promise<GroupedCityProviders> {
  const normalizedState = stateAbbr.toUpperCase()
  const center = cityCoordinates(cityName, normalizedState)
  if (!center) return { local: [], regional: [] }

  const providers = await getAllProviders()

  const local: { p: any; d: number }[] = []
  const regional: { p: any; d: number }[] = []

  for (const provider of providers) {
    // Hospital / health-system draw stations are not mobile providers.
    if (provider.isFixedSite) continue

    const providerState = (provider.state || '').toUpperCase()
    if (!providerState) continue

    // State-licensure states take in-state providers only.
    if (LICENSURE_STATES.has(normalizedState) && providerState !== normalizedState) continue

    const coords = providerCoordinates(provider)
    if (!coords) continue

    const distance = calculateDistance(center.lat, center.lng, coords.lat, coords.lng)
    if (distance > REGIONAL_CAP_MILES) continue

    // Local is demoted by RADIUS PROVENANCE, not by how we located the provider.
    //
    // A provider who stated their radius has made a claim about how far they
    // travel, and we honour it wherever it reaches — including when their
    // position came from a city centroid rather than a ZIP.
    //
    // A provider who stated no radius has claimed nothing. Giving them the
    // 50-mile default and counting them as coverage would put OUR assumption
    // into a headline that reads as THEIR claim — the exact overstatement this
    // rewrite exists to remove. They count as local only on a city they named
    // themselves, and appear as "also travel here" everywhere else in range.
    const isLocal = hasStatedRadius(provider)
      ? distance <= effectiveRadius(provider)
      : claimsCity(provider, cityName)

    if (isLocal) local.push({ p: provider, d: distance })
    else regional.push({ p: provider, d: distance })
  }

  // VERIFIED first, then nearest. The city page's tier sort is stable, so paid
  // placement still ranks above everything and this decides order within a tier.
  const rank = (a: { p: any; d: number }, b: { p: any; d: number }) => {
    const av = a.p.status === 'VERIFIED' ? 0 : 1
    const bv = b.p.status === 'VERIFIED' ? 0 : 1
    return av !== bv ? av - bv : a.d - b.d
  }

  return {
    local: local.sort(rank).map(x => x.p),
    regional: regional.sort(rank).map(x => x.p),
  }
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
