import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'
import { STATE_DATA } from '@/data/states-full'
import { cityByStateCity } from '@/data/cities-full'
import { getProvidersByCity } from '@/lib/providers-city'
import { getProvidersForState } from '@/lib/providers-state'

/**
 * Title / description for the location tiers (2026-09-25, site batch 4).
 *
 * One code path for the dynamic state page, the dynamic city layout and the
 * 18 static city overrides, so the count in the title is always the live
 * number of active providers the page actually lists. The overrides used to
 * bake a count and a price band in at generation time and drifted (Seattle
 * promised 5, showed 1).
 *
 * Titles are `absolute` with the site suffix applied here, once: nested
 * layouts do not inherit the root title template, which is why city pages had
 * no suffix while state pages did, and /clinical-trials had it twice.
 */
const SUFFIX = ' | MobilePhlebotomy.org'
const COUNT_THRESHOLD = 3

export function stateMetaText(stateName: string, n: number): { title: string; description: string } {
  if (n >= COUNT_THRESHOLD) {
    return {
      title: `Mobile Phlebotomy in ${stateName} | ${n} At-Home Blood Draw Providers (2026)`,
      description: `Compare ${n} licensed mobile phlebotomists across ${stateName}. At-home blood draws for patients, families, and facilities. Request a draw and get matched with a local provider.`,
    }
  }
  return {
    title: `Mobile Phlebotomy in ${stateName} | At-Home Blood Draws Near You (2026)`,
    description: `Find licensed mobile phlebotomists in ${stateName} for at-home blood draws. Request a draw and we'll match you with a local provider.`,
  }
}

export function cityMetaText(city: string, st: string, n: number): { title: string; description: string } {
  if (n >= COUNT_THRESHOLD) {
    return {
      title: `Mobile Phlebotomy in ${city}, ${st} | ${n} Local At-Home Blood Draw Providers`,
      description: `Compare ${n} licensed mobile phlebotomists serving ${city}, ${st}. At-home blood draws for patients, families, and facilities. Request a draw and get matched with a local provider.`,
    }
  }
  return {
    title: `Mobile Phlebotomy in ${city}, ${st} | At-Home Blood Draws Near You`,
    description: `Find a licensed mobile phlebotomist serving ${city}, ${st} for at-home blood draws. Request a draw and we'll match you with a local provider.`,
  }
}

function toMetadata(text: { title: string; description: string }, canonical: string, extra: Metadata = {}): Metadata {
  return {
    title: { absolute: text.title + SUFFIX },
    description: text.description,
    alternates: { canonical },
    openGraph: { title: text.title, description: text.description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title: text.title, description: text.description },
    ...extra,
  }
}

export async function buildStateMetadata(stateSlug: string): Promise<Metadata> {
  const info = STATE_DATA[stateSlug]
  if (!info) return {}
  const providers = await getProvidersForState(info.abbr)
  return toMetadata(stateMetaText(info.name, providers.length), `${SITE_URL}/us/${stateSlug}`, {
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  })
}

/** Count = local + regional, exactly what the city page lists. */
export async function countProvidersForCity(cityName: string, stateAbbr: string): Promise<number> {
  const g = await getProvidersByCity(cityName, stateAbbr)
  return g.local.length + g.regional.length
}

export async function buildCityMetadata(stateSlug: string, citySlug: string): Promise<Metadata> {
  const info = cityByStateCity(stateSlug, citySlug)
  if (!info) return {}
  const n = await countProvidersForCity(info.name, info.state)
  const text = cityMetaText(info.name, info.state, n)
  return toMetadata(text, `${SITE_URL}/us/${stateSlug}/${citySlug}`, {
    keywords: `mobile phlebotomy ${info.name}, at-home blood draw ${info.name} ${info.state}, phlebotomist ${info.name}, mobile lab ${info.name}, home blood test ${info.name}`,
    ...(info.noProviders ? { robots: { index: false, follow: true } } : {}),
  })
}
