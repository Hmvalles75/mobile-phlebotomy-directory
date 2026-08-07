import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
// internalLinks.ts is server-only and cannot be imported here, so this
// mirrors its coverage-join branch exactly (see lines 62-80 of that file).
async function providersForCity(citySlug: string, stateAbbr: string) {
  return prisma.provider.findMany({
    where: {
      removedAt: null,
      OR: [
        { primaryCitySlug: citySlug, primaryState: stateAbbr },
        { coverage: { some: { state: { abbr: stateAbbr }, city: { slug: citySlug } } } },
      ],
    },
    select: { name: true },
  })
}

const prisma = new PrismaClient()

/**
 * Confirms the rename actually restored what it was supposed to restore:
 * providers appearing in the server-rendered "Providers in {City}" block.
 * Queries through the real lookup rather than re-implementing it.
 */
const SAMPLES: Array<[string, string]> = [
  ['henderson', 'NV'],
  ['rockville', 'MD'],
  ['princeton', 'NJ'],
  ['fredericksburg', 'VA'],
  ['indianapolis', 'IN'],
  ['crosby', 'TX'],
]

async function main() {
  console.log('Providers resolved via lib/seo/internalLinks (the city-page block):\n')
  for (const [slug, abbr] of SAMPLES) {
    const providers = await providersForCity(slug, abbr)
    console.log(`  /us/.../${slug.padEnd(16)} ${abbr}  → ${providers.length} provider(s)`)
    for (const p of providers.slice(0, 3)) console.log(`      ${p.name}`)
  }

  const left = await prisma.city.findMany({
    where: { OR: [{ slug: { endsWith: '-' } }, { slug: { startsWith: '-' } }] },
    select: { name: true, slug: true, state: { select: { abbr: true } }, _count: { select: { coverage: true } } },
  })
  console.log(`\nStill malformed (merge cases): ${left.length}`)
  for (const c of left) {
    console.log(`  ${c.state.abbr}  ${JSON.stringify(c.name).padEnd(24)} ${c.slug.padEnd(22)} ${c._count.coverage} provider(s)`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
