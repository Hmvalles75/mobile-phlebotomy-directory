import 'server-only'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CITY_MAPPING } from '@/data/cities-full'
import { ABBR_TO_SLUG } from '@/data/states-full'

// Re-export pure helpers + types from the client-safe module so existing
// server-component imports keep working through this path.
export {
  pickAnchorVariant,
  cityAnchorVariants,
  cityLinkExists,
  stateLinkFromAbbr,
} from './anchorHelpers'
export type { CityLink } from './anchorHelpers'

import type { CityLink } from './anchorHelpers'

export interface ProviderLink {
  id: string
  slug: string
  name: string
  primaryCity: string | null
  primaryState: string | null
  description: string | null
}

const ACTIVE_FILTER = {
  status: 'VERIFIED' as const,
  eligibleForLeads: true,
}

// Local stable hash — duplicated rather than re-imported so this file
// stays a self-contained server module. Same algorithm as anchorHelpers.
function stableHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Deterministic shuffle — same seed produces same order. Used so each
// provider page links to a different rotation of competitors but doesn't
// flicker between renders.
function deterministicShuffle<T>(arr: T[], seed: string): T[] {
  const out = [...arr]
  const h = stableHash(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = (h + i * 31) % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ────────────────────────────────────────────────────────────────────
// Providers serving a given city (status=VERIFIED + eligibleForLeads)
// ────────────────────────────────────────────────────────────────────
export const getProvidersForCity = unstable_cache(
  async (citySlug: string, stateAbbr: string): Promise<ProviderLink[]> => {
    const cityInfo = CITY_MAPPING[citySlug]
    const cityName = cityInfo?.name

    const providers = await prisma.provider.findMany({
      where: {
        ...ACTIVE_FILTER,
        OR: [
          { primaryCitySlug: citySlug, primaryState: stateAbbr },
          ...(cityName
            ? [{ primaryCity: { equals: cityName, mode: 'insensitive' as const }, primaryState: stateAbbr }]
            : []),
          {
            coverage: {
              some: {
                state: { abbr: stateAbbr },
                ...(cityName
                  ? { city: { name: { equals: cityName, mode: 'insensitive' as const } } }
                  : { city: { slug: citySlug } }),
              },
            },
          },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryCity: true,
        primaryState: true,
        description: true,
      },
      orderBy: { name: 'asc' },
      take: 25,
    })

    return providers
  },
  ['providers-for-city'],
  { revalidate: 3600, tags: ['internal-links'] }
)

// ────────────────────────────────────────────────────────────────────
// Nearby cities for a given city (same state, capped 8, floor 0)
// ────────────────────────────────────────────────────────────────────
export const getNearbyCities = unstable_cache(
  async (citySlug: string, stateAbbr: string, limit = 8): Promise<CityLink[]> => {
    const stateSlug = ABBR_TO_SLUG[stateAbbr]
    if (!stateSlug) return []

    const sameState: CityLink[] = []
    for (const [slug, info] of Object.entries(CITY_MAPPING)) {
      if (info.state !== stateAbbr) continue
      if (slug === citySlug) continue
      sameState.push({ slug, name: info.name, stateAbbr: info.state, stateSlug })
    }

    // Deterministic ordering by source slug so the rotation is stable per
    // source page but varies between source pages.
    const shuffled = deterministicShuffle(sameState, citySlug)
    return shuffled.slice(0, limit)
  },
  ['nearby-cities'],
  { revalidate: 3600, tags: ['internal-links'] }
)

function nameToCitySlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ────────────────────────────────────────────────────────────────────
// Cities with active providers in a state — for state page directory.
// Pulls from primaryCitySlug, primaryCity-derived slug, and coverage
// relation cities. Intersects against CITY_MAPPING so we only link
// cities that actually have dedicated pages.
// ────────────────────────────────────────────────────────────────────
export const getCitiesInState = unstable_cache(
  async (stateAbbr: string): Promise<CityLink[]> => {
    const stateSlug = ABBR_TO_SLUG[stateAbbr]
    if (!stateSlug) return []

    const providers = await prisma.provider.findMany({
      where: { ...ACTIVE_FILTER, primaryState: stateAbbr },
      select: {
        primaryCity: true,
        primaryCitySlug: true,
        coverage: {
          where: { state: { abbr: stateAbbr } },
          select: { city: { select: { name: true, slug: true } } },
        },
      },
    })

    const seen = new Set<string>()
    const out: CityLink[] = []

    const tryAdd = (slug: string | null | undefined) => {
      if (!slug || seen.has(slug)) return
      const info = CITY_MAPPING[slug]
      if (!info || info.state !== stateAbbr) return
      seen.add(slug)
      out.push({ slug, name: info.name, stateAbbr, stateSlug })
    }

    for (const p of providers) {
      tryAdd(p.primaryCitySlug)
      if (p.primaryCity) tryAdd(nameToCitySlug(p.primaryCity))
      for (const c of p.coverage) {
        tryAdd(c.city?.slug)
        if (c.city?.name) tryAdd(nameToCitySlug(c.city.name))
      }
    }

    out.sort((a, b) => a.name.localeCompare(b.name))
    return out
  },
  ['cities-in-state'],
  { revalidate: 3600, tags: ['internal-links'] }
)

// ────────────────────────────────────────────────────────────────────
// Other providers near a given provider (same city + state, exclude self)
// ────────────────────────────────────────────────────────────────────
export const getNearbyProviders = unstable_cache(
  async (
    providerId: string,
    citySlug: string | null,
    stateAbbr: string | null,
    limit = 5
  ): Promise<ProviderLink[]> => {
    if (!stateAbbr) return []

    const candidates = await prisma.provider.findMany({
      where: {
        ...ACTIVE_FILTER,
        id: { not: providerId },
        primaryState: stateAbbr,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryCity: true,
        primaryState: true,
        primaryCitySlug: true,
        description: true,
      },
      take: 50,
    })

    // Prefer same-city first, then anywhere-in-state. Within each bucket,
    // deterministic shuffle seeded by the source provider id so different
    // provider pages link to different competitors.
    const sameCity = candidates.filter(c => citySlug && c.primaryCitySlug === citySlug)
    const elsewhere = candidates.filter(c => !citySlug || c.primaryCitySlug !== citySlug)
    const ordered = [
      ...deterministicShuffle(sameCity, providerId),
      ...deterministicShuffle(elsewhere, providerId),
    ]
    return ordered.slice(0, limit).map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      primaryCity: c.primaryCity,
      primaryState: c.primaryState,
      description: c.description,
    }))
  },
  ['nearby-providers'],
  { revalidate: 3600, tags: ['internal-links'] }
)

// ────────────────────────────────────────────────────────────────────
// Service areas covered (premium pages) — cities + state, dedupe to
// only those that have dedicated directory pages so links never 404.
// ────────────────────────────────────────────────────────────────────
export const getServiceAreasCovered = unstable_cache(
  async (providerId: string): Promise<{ cities: CityLink[]; stateAbbr: string | null }> => {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        primaryState: true,
        primaryCity: true,
        primaryCitySlug: true,
        coverage: {
          select: {
            state: { select: { abbr: true } },
            city: { select: { name: true, slug: true } },
          },
        },
      },
    })
    if (!provider) return { cities: [], stateAbbr: null }

    const stateAbbr = provider.primaryState
    const cityMap = new Map<string, CityLink>()

    const tryAdd = (slug: string | null | undefined, name: string | null | undefined, abbr: string | null | undefined) => {
      if (!slug || !name || !abbr) return
      const stateSlug = ABBR_TO_SLUG[abbr]
      if (!stateSlug) return
      const info = CITY_MAPPING[slug]
      // Only link to slugs that have a dedicated page in CITY_MAPPING.
      if (!info || info.state !== abbr) return
      if (cityMap.has(slug)) return
      cityMap.set(slug, { slug, name: info.name, stateAbbr: abbr, stateSlug })
    }

    // Primary city
    tryAdd(provider.primaryCitySlug, provider.primaryCity, provider.primaryState)
    // Coverage cities
    for (const c of provider.coverage) {
      tryAdd(c.city?.slug, c.city?.name, c.state?.abbr)
    }

    const cities = Array.from(cityMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    return { cities, stateAbbr }
  },
  ['service-areas-covered'],
  { revalidate: 3600, tags: ['internal-links'] }
)
