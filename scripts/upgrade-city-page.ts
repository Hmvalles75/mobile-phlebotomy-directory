/**
 * upgrade-city-page.ts
 *
 * Per-city SEO upgrade script. For a given city slug, generates a server-rendered
 * static route at app/us/{state}/{slug}/page.tsx that:
 *   - Provides per-city `metadata` (title, description, OG) — fixes the SEO gap
 *     where the dynamic `/us/[state]/[city]` route is a client component and
 *     therefore has NO server-side metadata at all
 *   - Embeds LocalBusiness + FAQPage + BreadcrumbList JSON-LD for rich-result
 *     eligibility
 *   - Delegates rendering to the existing dynamic CityPage client component for
 *     the provider list, search, filters, and lead form (no UI duplication)
 *
 * The dynamic /us/[state]/[city] route remains untouched and continues serving
 * the other 363 cities. Next.js prefers static routes over dynamic, so the
 * generated file takes precedence for cities the script has been run for.
 *
 * Real per-city data is queried from Prisma at script-run-time and inlined into
 * the generated file. Re-run the script as provider data evolves.
 *
 * Usage:
 *   npx tsx scripts/upgrade-city-page.ts --city=chicago
 *   npx tsx scripts/upgrade-city-page.ts --city=chicago --state=il --dry-run
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function arg(name: string): string | undefined {
  const a = process.argv.find(a => a.startsWith(`--${name}=`))
  if (a) return a.split('=').slice(1).join('=')
  return undefined
}

interface CityData {
  slug: string
  name: string
  state: string
  stateName: string
  providerCount: number
  citySpecificCount: number
  specialties: string[]
  priceRange: string
}

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
}

// URL slug per state. The site canonicalizes /us/<full-state-slug>/<city>
// (e.g. /us/florida/miami), with 2-letter abbr URLs 301-redirecting to the
// slug form. Static pages must emit at the slug path or they never serve.
function stateSlug(abbr: string): string {
  const name = STATE_NAMES[abbr.toUpperCase()]
  if (!name) return abbr.toLowerCase()
  return name.toLowerCase().replace(/\s+/g, '-')
}

const STATE_PRICE_RANGES: Record<string, string> = {
  CA: '$80–$160', NY: '$75–$150', TX: '$60–$120', FL: '$65–$130', IL: '$70–$130',
  PA: '$65–$125', OH: '$60–$110', GA: '$65–$125', NC: '$60–$120', MI: '$60–$115',
  NJ: '$75–$140', VA: '$65–$125', WA: '$75–$140', AZ: '$60–$120', MA: '$75–$145',
  CO: '$70–$130', TN: '$60–$115', MD: '$70–$135', LA: '$60–$120', OR: '$70–$135',
}

async function fetchCityData(slug: string, stateAbbr: string): Promise<CityData> {
  const cityName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const stateName = STATE_NAMES[stateAbbr.toUpperCase()] || stateAbbr.toUpperCase()
  const priceRange = STATE_PRICE_RANGES[stateAbbr.toUpperCase()] || '$70–$135'

  // City-specific: explicit city coverage in the relational `coverage` table
  const citySpecific = await prisma.provider.count({
    where: {
      eligibleForLeads: true,
      removedAt: null,
      coverage: {
        some: {
          state: { abbr: stateAbbr.toUpperCase() },
          city: { name: { equals: cityName, mode: 'insensitive' } },
        },
      },
    },
  })

  // Statewide / regional: providers covering the state without a specific city,
  // OR providers whose primaryState matches. Captures both routing eligibility
  // signals so the count reflects real available coverage.
  const statewide = await prisma.provider.count({
    where: {
      eligibleForLeads: true,
      removedAt: null,
      OR: [
        {
          coverage: {
            some: {
              state: { abbr: stateAbbr.toUpperCase() },
              cityId: null,
            },
          },
        },
        { primaryState: stateAbbr.toUpperCase() },
      ],
    },
  })

  // De-dupe: a provider could match both city-specific AND statewide. Take the
  // greater of the two as the displayed count rather than over-counting via
  // additive math. (For an exact unique count we'd need a single union query —
  // good enough for a marketing number.)
  const providerCount = Math.max(citySpecific, statewide)

  // Specialty distribution — `services` is a relation (ProviderService → Service),
  // not a string array. Pull the Service.name to get human-readable specialty labels.
  const providers = await prisma.provider.findMany({
    where: {
      eligibleForLeads: true,
      removedAt: null,
      OR: [
        {
          coverage: {
            some: {
              state: { abbr: stateAbbr.toUpperCase() },
              city: { name: { equals: cityName, mode: 'insensitive' } },
            },
          },
        },
        { primaryState: stateAbbr.toUpperCase() },
      ],
    },
    select: {
      services: { select: { service: { select: { name: true } } } },
    },
    take: 50,
  })

  const serviceCounts: Record<string, number> = {}
  for (const p of providers) {
    for (const ps of p.services || []) {
      const name = ps.service?.name
      if (!name) continue
      serviceCounts[name] = (serviceCounts[name] || 0) + 1
    }
  }

  // Filter out generic "mobile blood draw" synonyms — they're redundant in
  // copy that already mentions mobile phlebotomy. Keep meaningful specialty
  // labels (Pediatric, Corporate Wellness, Lab Partner, etc.) that actually
  // differentiate providers.
  const GENERIC = /^(at-home|in-home|mobile|home)\s+(blood\s+draw|phlebotomy)s?$/i
  const meaningful = Object.entries(serviceCounts)
    .filter(([s]) => !GENERIC.test(s))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s)

  // If no meaningful specialties surface, fall back to a generic phrase.
  const specialties = meaningful.length > 0
    ? meaningful
    : ['at-home blood draw', 'specimen collection', 'lab routing']

  return {
    slug,
    name: cityName,
    state: stateAbbr.toUpperCase(),
    stateName,
    providerCount,
    citySpecificCount: citySpecific,
    specialties,
    priceRange,
  }
}

function generatePageContent(data: CityData): string {
  const {
    slug, name, state, stateName, providerCount, citySpecificCount, specialties, priceRange,
  } = data

  const specialtyList = specialties.length > 0 ? specialties.join(', ') : 'at-home blood draw, lab routing, and specialty collections'
  const providerNoun = providerCount === 1 ? 'provider' : 'providers'

  // Title <= 60 chars to avoid SERP truncation. Lead with the target keyword.
  const title = `Mobile Phlebotomy ${name}: ${providerCount} Vetted ${providerNoun.charAt(0).toUpperCase() + providerNoun.slice(1)} (2026)`

  const description =
    `Find mobile phlebotomy in ${name}, ${state}. ${providerCount} vetted ${providerNoun} serving the ${name} area — ${specialtyList}. ` +
    `Typical service fee ${priceRange} per visit. Same-day appointments available.`

  // JSON-LD strings — embedded directly into the generated file rather than
  // imported, so each generated city page is self-contained.
  const localBusinessSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: `Mobile Phlebotomy in ${name}, ${state}`,
    description: `Directory of vetted mobile phlebotomists serving ${name}, ${stateName} and surrounding areas.`,
    url: `https://mobilephlebotomy.org/us/${stateSlug(state)}/${slug}`,
    areaServed: {
      '@type': 'City',
      name,
      containedInPlace: { '@type': 'State', name: stateName },
    },
    priceRange,
    medicalSpecialty: 'Phlebotomy',
  })

  const faqSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How much does mobile phlebotomy cost in ${name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Mobile phlebotomy in ${name}, ${state} typically costs ${priceRange} per visit for the phlebotomist's service fee. Independent providers usually charge less than national services like Quest Mobile ($79) or NPPN ($99). Lab processing fees are billed separately by your lab. Medicare and Medicaid patients in ${stateName} typically pay $0–$25 when the draw is medically necessary and ordered by a physician.`,
        },
      },
      {
        '@type': 'Question',
        name: `How fast can I get a mobile phlebotomist in ${name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Most ${name}-area providers offer same-day or next-day appointments, especially for morning routine draws. STAT (urgent) draws are typically available within 2–4 hours for an added fee. Weekend and evening appointments are available from many independent providers. Confirm availability when you contact the provider — our directory lists ${providerCount} ${providerNoun} serving the ${name} area.`,
        },
      },
      {
        '@type': 'Question',
        name: `Do mobile phlebotomists in ${name} accept insurance?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Many mobile phlebotomists in ${name}, ${state} accept insurance, including Medicare Part B for homebound patients (typical copay $0–$25), state Medicaid programs, and major private insurance plans (often with pre-authorization). Independent providers usually also accept HSA, FSA, and competitive self-pay rates. Confirm insurance acceptance directly with the provider before booking.`,
        },
      },
      {
        '@type': 'Question',
        name: `Which labs do ${name} mobile phlebotomists work with?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Most ${name}-area mobile phlebotomists routinely drop off specimens at LabCorp and Quest Diagnostics patient service centers. Many also deliver to hospital-affiliated labs and specialty labs when your physician's order specifies a particular lab. Confirm your provider can route to your preferred lab before booking.`,
        },
      },
    ],
  })

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mobilephlebotomy.org/' },
      { '@type': 'ListItem', position: 2, name: 'United States', item: 'https://mobilephlebotomy.org/us' },
      {
        '@type': 'ListItem',
        position: 3,
        name: stateName,
        item: `https://mobilephlebotomy.org/us/${stateSlug(state)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name,
        item: `https://mobilephlebotomy.org/us/${stateSlug(state)}/${slug}`,
      },
    ],
  })

  return `import type { Metadata } from 'next'
import CityPage from '@/app/us/[state]/[city]/page'

// Generated by scripts/upgrade-city-page.ts — DO NOT EDIT BY HAND.
// Re-run the script to refresh provider counts and specialty data:
//   npx tsx scripts/upgrade-city-page.ts --city=${slug} --state=${stateSlug(state)}
//
// This static route takes precedence over the dynamic /us/[state]/[city] route
// for ${name}, providing server-side metadata + JSON-LD that the dynamic
// (client) component cannot. The provider list, filters, search, and lead form
// are delegated to the existing dynamic CityPage component below.

const PROVIDER_COUNT = ${providerCount}
const CITY_NAME = ${JSON.stringify(name)}
const STATE_ABBR = ${JSON.stringify(state)}
const STATE_NAME = ${JSON.stringify(stateName)}
const PRICE_RANGE = ${JSON.stringify(priceRange)}
const CITY_SPECIFIC_COUNT = ${citySpecificCount}

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  keywords: ${JSON.stringify(
    `mobile phlebotomy ${name.toLowerCase()}, mobile phlebotomist ${name.toLowerCase()}, ${name.toLowerCase()} mobile blood draw, at home blood draw ${name.toLowerCase()}, mobile lab ${name.toLowerCase()}, ${name.toLowerCase()} ${stateSlug(state)} phlebotomy, ${stateName.toLowerCase()} mobile phlebotomy`
  )},
  alternates: {
    canonical: ${JSON.stringify(`https://mobilephlebotomy.org/us/${stateSlug(state)}/${slug}`)},
  },
  openGraph: {
    title: ${JSON.stringify(title)},
    description: ${JSON.stringify(description)},
    url: ${JSON.stringify(`https://mobilephlebotomy.org/us/${stateSlug(state)}/${slug}`)},
    type: 'website',
  },
}

const localBusinessSchema = ${localBusinessSchema}

const faqSchema = ${faqSchema}

const breadcrumbSchema = ${breadcrumbSchema}

export default function ${name.replace(/[^a-zA-Z]/g, '')}MobilePhlebotomyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <CityPage params={{ state: ${JSON.stringify(stateSlug(state))}, city: ${JSON.stringify(slug)} }} />
    </>
  )
}
`
}

async function main() {
  const cityArg = arg('city')
  const stateArg = arg('state')
  const dryRun = process.argv.includes('--dry-run')

  if (!cityArg) {
    console.error('Usage: npx tsx scripts/upgrade-city-page.ts --city=<slug> [--state=<2-letter>]')
    console.error('Example: npx tsx scripts/upgrade-city-page.ts --city=chicago --state=il')
    process.exit(1)
  }

  const slug = cityArg.toLowerCase()

  // Try to infer state from the existing cityMapping in app/us/[state]/[city]/page.tsx
  // if not provided. For known cities this avoids needing --state.
  let stateAbbr = (stateArg || '').toUpperCase()
  if (!stateAbbr) {
    // Hardcoded known fallbacks for the most common targets
    const KNOWN: Record<string, string> = {
      chicago: 'IL', 'new-york': 'NY', 'los-angeles': 'CA', houston: 'TX',
      phoenix: 'AZ', philadelphia: 'PA', 'san-antonio': 'TX', 'san-diego': 'CA',
      dallas: 'TX', austin: 'TX', miami: 'FL', atlanta: 'GA', boston: 'MA',
      seattle: 'WA', denver: 'CO', detroit: 'MI', minneapolis: 'MN',
    }
    stateAbbr = KNOWN[slug] || ''
    if (!stateAbbr) {
      console.error(`Could not infer state for "${slug}". Pass --state=<2-letter> explicitly.`)
      process.exit(1)
    }
  }

  console.log('═'.repeat(80))
  console.log(`UPGRADE CITY PAGE — ${slug} (${stateAbbr})`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`)
  console.log('═'.repeat(80))

  console.log('\nQuerying provider data...')
  const data = await fetchCityData(slug, stateAbbr)
  console.log(`  City:                ${data.name}, ${data.state} (${data.stateName})`)
  console.log(`  Total providers:     ${data.providerCount}`)
  console.log(`  City-specific:       ${data.citySpecificCount}`)
  console.log(`  Top specialties:     ${data.specialties.join(', ') || '(none in DB)'}`)
  console.log(`  Price range:         ${data.priceRange}`)

  const outDir = path.join(process.cwd(), 'app', 'us', stateSlug(stateAbbr), slug)
  const outPath = path.join(outDir, 'page.tsx')

  console.log(`\nGenerated file target: ${path.relative(process.cwd(), outPath)}`)

  const content = generatePageContent(data)

  if (dryRun) {
    console.log('\n--- BEGIN GENERATED FILE ---')
    console.log(content)
    console.log('--- END GENERATED FILE ---')
    console.log('\n(Dry-run. Re-run without --dry-run to write the file.)')
  } else {
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(outPath, content, 'utf8')
    console.log(`\n✓ Wrote ${path.relative(process.cwd(), outPath)} (${content.length} chars)`)
    console.log(`\nNext.js will serve this static route in place of the dynamic`)
    console.log(`/us/[state]/[city] route for ${data.name}. Run \`npm run build\` to`)
    console.log(`verify it compiles, then deploy as normal.`)
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
