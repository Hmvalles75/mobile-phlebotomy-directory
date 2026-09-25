/**
 * unify-cities-full.ts — coverage-refresh for data/cities-full.ts
 *
 * Re-reads the provider coverage DB and rewrites data/cities-full.ts with an
 * up-to-date `noProviders` flag on each city (true = zero matching providers,
 * excluded from the sitemap). Entries themselves are preserved; only the flag
 * and formatting are regenerated. Run after significant provider onboarding.
 *
 *   npx tsx scripts/unify-cities-full.ts            # writes in place
 *   npx tsx scripts/unify-cities-full.ts --dry-run  # report only
 *
 * The original compound-key migration (bare-slug → "${stateSlug}/${citySlug}",
 * merging the legacy inline page map) is captured in git history.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { CITY_MAPPING, type CityInfo } from '../data/cities-full'
import { ABBR_TO_SLUG } from '../data/states-full'
import { getAllProviders } from '../lib/providers-db'
import { bucketProvidersForCity } from '../lib/cityGeography'

const prisma = new PrismaClient()
const root = process.cwd()
const dryRun = process.argv.includes('--dry-run')

async function main() {
  // The flag must agree with the count the city page renders and puts in its
  // title (lib/seo/locationMeta.ts): local + regional providers from the same
  // radius/coverage bucketing. The old rule ("any eligible provider based in
  // the state, or a coverage row naming the city") disagreed with the page in
  // both directions (2026-09-25: Anchorage flagged noProviders while listing
  // 3; 47 cities listing 0 while indexable).
  console.log('Reading providers and bucketing per city (same rule as the page)...')
  const all = await getAllProviders()
  const counts = new Map<string, number>()
  for (const [key, e] of Object.entries(CITY_MAPPING)) {
    const g = bucketProvidersForCity(all, e.name, e.state)
    counts.set(key, g.local.length + g.regional.length)
  }
  const hasProviders = (e: CityInfo) => (counts.get(`${e.stateSlug}/${e.citySlug}`) || 0) > 0
  const providers = all

  const entries = Object.entries(CITY_MAPPING).sort(([a], [b]) => a.localeCompare(b))
  const excluded = entries.filter(([, e]) => !hasProviders(e))
  console.log(`providers considered: ${providers.length}`)
  console.log(`cities: ${entries.length} | excluded (noProviders): ${excluded.length}`)
  const nowOn = entries.filter(([, e]) => !e.noProviders && !hasProviders(e))
  const nowOff = entries.filter(([key, e]) => e.noProviders && hasProviders(e)).map(([key]) => `${key} (${counts.get(key)})`)
  console.log(`
FLIPS -> noProviders ON (indexable page listing 0): ${nowOn.length}`)
  for (const [key] of nowOn) console.log(`   + ${key}`)
  console.log(`FLIPS -> noProviders OFF (noindexed page that lists providers): ${nowOff.length}`)
  for (const k of nowOff) console.log(`   - ${k}`)

  const lines = entries.map(([key, e]) => {
    const parts = [
      `name: ${JSON.stringify(e.name)}`, `state: ${JSON.stringify(e.state)}`,
      `citySlug: ${JSON.stringify(e.citySlug)}`, `stateSlug: ${JSON.stringify(e.stateSlug)}`,
    ]
    if (!hasProviders(e)) parts.push('noProviders: true')
    return `  ${JSON.stringify(key)}: { ${parts.join(', ')} },`
  })

  const header = `/**
 * Complete city mapping — every city with a dedicated /us/[state]/[city] page.
 * Keyed by COMPOUND slug "\${stateSlug}/\${citySlug}" so cities that share a bare
 * slug across states (e.g. Glendale AZ vs Glendale CA) are distinct entries.
 *
 * Single source of truth. Consumers:
 *  - app/us/[state]/[city]/page.tsx    (render + provider fetch) via cityByStateCity()
 *  - app/us/[state]/[city]/layout.tsx  (metadata) via cityByStateCity()
 *  - app/sitemap.ts                    (URL generation; skips noProviders)
 *  - lib/seo/internalLinks.ts, anchorHelpers.ts, components/seo/ServiceAreaLinks.tsx
 *
 * 2026-09-24: 13 cities with >=2 active providers added by hand (URL
 * consolidation batch 2, see docs/findings/unmapped-provider-cities-2026-09-24.csv).
 *
 * \`noProviders: true\` marks cities whose page lists zero providers (same
 * radius/coverage bucketing the page uses). They still render, carry robots
 * noindex,follow and are excluded from the sitemap. Regenerate with
 * scripts/unify-cities-full.ts whenever providers are onboarded or removed.
 */

export interface CityInfo {
  name: string
  state: string      // two-letter abbreviation
  citySlug: string
  stateSlug: string
  noProviders?: boolean
}

export const CITY_MAPPING: Record<string, CityInfo> = {
${lines.join('\n')}
}

// Bare-slug index for legacy membership checks / lookups that lack a state.
// For the ambiguous slugs this returns the first match by compound-key order.
const BY_BARE_SLUG: Record<string, CityInfo> = (() => {
  const m: Record<string, CityInfo> = {}
  for (const info of Object.values(CITY_MAPPING)) if (!m[info.citySlug]) m[info.citySlug] = info
  return m
})()

const CITY_SLUG_SET: Set<string> = new Set(Object.values(CITY_MAPPING).map(i => i.citySlug))

// Minimal abbr→slug (mirror of data/states-full ABBR_TO_SLUG) to keep this
// module free of the server-only import chain.
const ABBR_SLUG: Record<string, string> = {
${Object.entries(ABBR_TO_SLUG).map(([abbr, slug]) => `  ${JSON.stringify(abbr)}: ${JSON.stringify(slug)},`).join('\n')}
}

/** Normalize a state param (full slug OR 2-letter abbr) to the URL slug form. */
function normalizeStateSlug(stateSlugOrAbbr: string): string {
  const s = stateSlugOrAbbr.toLowerCase()
  return ABBR_SLUG[s.toUpperCase()] || s
}

/** Preferred lookup: resolves by state + city, disambiguating shared slugs. */
export function cityByStateCity(stateSlugOrAbbr: string, citySlug: string): CityInfo | undefined {
  return CITY_MAPPING[\`\${normalizeStateSlug(stateSlugOrAbbr)}/\${citySlug.toLowerCase()}\`]
}

/** Legacy bare-slug lookup (first match). Prefer cityByStateCity when state is known. */
export function cityBySlug(citySlug: string): CityInfo | undefined {
  return BY_BARE_SLUG[citySlug.toLowerCase()]
}

export function citySlugExists(citySlug: string): boolean {
  return CITY_SLUG_SET.has(citySlug.toLowerCase())
}
`

  if (dryRun) {
    console.log('\n--- excluded cities ---')
    console.log(excluded.map(([k]) => k).join('\n'))
    console.log('\n(dry-run; no file written)')
  } else {
    fs.writeFileSync(path.join(root, 'data/cities-full.ts'), header, 'utf8')
    console.log('\n✓ wrote data/cities-full.ts')
  }
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
