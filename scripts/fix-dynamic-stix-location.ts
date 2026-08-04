import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROVIDER_ID = 'cms3iz6050009k104t9z18jel'  // Dynamic Stix
const CITY_ID = 'cms3iz5za0008k104j5ancqbp'      // "Fort Washington " (MD), trailing space

const APPLY = process.argv.includes('--apply')

/**
 * Two related problems on a paying Founding Partner's record.
 *
 * 1. primaryCity was "Washington DC" filed under Maryland, which resolves to
 *    /us/maryland/washington-dc — not a real place, so their featured city
 *    placement pointed at a not-found template. Their base ZIP 20744
 *    geocodes to Fort Washington, MD, which is the accurate value.
 *
 * 2. The Fort Washington city row is named with a trailing space, which
 *    generated the slug "fort-washington-". Same bug affects 86 city rows;
 *    only this one is fixed here because it belongs to a paying customer.
 *    No clean "fort-washington" row exists in MD, so this is a rename rather
 *    than a merge.
 *
 * Note: the directory has no District of Columbia state row at all, so there
 * is no correct DC page to point them at. Their MD statewide coverage and
 * 100-mile radius still cover DC-area lead routing.
 */
async function main() {
  const before = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: { name: true, primaryCity: true, primaryCitySlug: true, primaryState: true, primaryStateSlug: true },
  })
  const cityBefore = await prisma.city.findUnique({
    where: { id: CITY_ID },
    select: { id: true, name: true, slug: true, state: { select: { abbr: true } } },
  })
  if (!before || !cityBefore) { console.error('✗ not found'); process.exit(1) }

  // Refuse to rename into an existing slug — that would need a merge, not this.
  const collision = await prisma.city.findFirst({
    where: { stateId: (await prisma.city.findUnique({ where: { id: CITY_ID }, select: { stateId: true } }))!.stateId,
             slug: 'fort-washington', NOT: { id: CITY_ID } },
    select: { id: true, name: true },
  })
  if (collision) {
    console.error(`✗ A clean "fort-washington" row already exists (${collision.id}). This needs a merge, not a rename.`)
    process.exit(1)
  }

  console.log('=== BEFORE ===')
  console.log(`  provider.primaryCity: "${before.primaryCity}" (${before.primaryCitySlug}), ${before.primaryState}`)
  console.log(`  city row:             "${cityBefore.name}" slug="${cityBefore.slug}" ${cityBefore.state.abbr}`)
  console.log('\n=== WILL APPLY ===')
  console.log(`  provider.primaryCity: "Fort Washington" (fort-washington), MD`)
  console.log(`  city row:             "Fort Washington" slug="fort-washington"`)

  if (!APPLY) { console.log('\n(dry run — re-run with --apply)'); await prisma.$disconnect(); return }

  const city = await prisma.city.update({
    where: { id: CITY_ID },
    data: { name: 'Fort Washington', slug: 'fort-washington' },
    select: { name: true, slug: true },
  })
  const provider = await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: { primaryCity: 'Fort Washington', primaryCitySlug: 'fort-washington' },
    select: { name: true, primaryCity: true, primaryCitySlug: true, primaryState: true, primaryStateSlug: true },
  })

  console.log('\n=== AFTER ===')
  console.log(`  provider.primaryCity: "${provider.primaryCity}" (${provider.primaryCitySlug}), ${provider.primaryState}`)
  console.log(`  city row:             "${city.name}" slug="${city.slug}"`)
  console.log(`\n  city page: /us/${provider.primaryStateSlug}/${provider.primaryCitySlug}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
