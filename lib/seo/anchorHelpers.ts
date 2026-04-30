import { CITY_MAPPING } from '@/data/cities-full'
import { ABBR_TO_SLUG, STATE_DATA } from '@/data/states-full'

export interface CityLink {
  slug: string
  name: string
  stateAbbr: string
  stateSlug: string
}

// Pure helpers — safe to import from client and server components.
// Server-only Prisma queries live in ./internalLinks.ts.

function stableHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function pickAnchorVariant(sourceSlug: string, variants: string[]): string {
  if (variants.length === 0) return ''
  return variants[stableHash(sourceSlug) % variants.length]
}

export function cityAnchorVariants(cityName: string, stateAbbr: string): string[] {
  return [
    `Mobile phlebotomy in ${cityName}, ${stateAbbr}`,
    `At-home blood draws in ${cityName}`,
    `${cityName} mobile phlebotomists`,
  ]
}

const CITY_SLUG_SET = new Set(Object.keys(CITY_MAPPING))

export function cityLinkExists(citySlug: string): boolean {
  return CITY_SLUG_SET.has(citySlug)
}

export function stateLinkFromAbbr(stateAbbr: string): { slug: string; name: string } | null {
  const slug = ABBR_TO_SLUG[stateAbbr]
  if (!slug) return null
  const info = STATE_DATA[slug]
  if (!info) return null
  return { slug, name: info.name }
}
