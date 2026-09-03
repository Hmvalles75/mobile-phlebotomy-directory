import { PrismaClient } from '@prisma/client'
import { assertEndpoint, requireArg } from './_endpoint-guard'

/**
 * Move Precision Mobile Phlebotomy Care LLC from Sheridan, WY to Davenport, IA.
 *
 *   npx tsx scripts/anchor-arieo-quad-cities.ts --endpoint <id>
 *   npx tsx scripts/anchor-arieo-quad-cities.ts --endpoint <id> --apply
 *
 * Arieo Burrage signed up 2026-08-29 anchored in Sheridan, Wyoming, then wrote
 * three times asking how to "add" Illinois and Iowa. There is no adding: a
 * listing is one anchor plus a radius, matching is by distance, and the cap is
 * 100 miles. Sheridan is roughly a thousand miles from every city he actually
 * works, so his listing was live, eligible, notifiable -- and structurally
 * incapable of matching a single one of his requests. He would have waited
 * indefinitely and concluded the directory was empty.
 *
 * He named ten cities. Anchoring at Davenport (52801) with the existing
 * 100-mile radius covers eight of them:
 *
 *     Rock Island IL     2mi      Iowa City IA      49mi
 *     Moline IL          4mi      Cedar Rapids IA   64mi
 *     Bettendorf IA      5mi      Peoria IL         77mi
 *     Davenport IA       0mi      Rockford IL       92mi
 *
 *     Bloomington IL   110mi  out of range
 *     Des Moines IA    158mi  out of range
 *
 * Davenport over Moline, which scores within a few miles on every target: the
 * anchor's state decides which state and city pages carry him, and Iowa has one
 * notifiable provider against Illinois's nine. Routing stopped filtering by
 * state when the cross-border bug was fixed, so an Illinois request four miles
 * away still reaches an Iowa-anchored provider. He gets the uncontested Iowa
 * listing and the Illinois leads both.
 *
 * Email stays arieo@pmpcpros.com -- he writes from gmail but confirmed the
 * business address is the one he wants notifications on.
 */

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const ID = 'cmtew8v2t0007jf04yyefjxkk'

const TARGET = {
  primaryCity: 'Davenport',
  primaryCitySlug: 'davenport',
  primaryState: 'IA',
  primaryStateName: 'Iowa',
  primaryStateSlug: 'iowa',
  zipCodes: '52801',
}

async function main() {
  const expected = requireArg('--endpoint')
  console.log('')
  await assertEndpoint(prisma, {
    expected,
    label: expected.includes('cool-surf') ? 'PRODUCTION' : 'non-production',
  })

  const before: any = await prisma.provider.findUnique({
    where: { id: ID },
    select: {
      name: true, primaryCity: true, primaryState: true, primaryStateName: true,
      primaryCitySlug: true, primaryStateSlug: true, zipCodes: true,
      serviceRadiusMiles: true, email: true, eligibleForLeads: true, notifyEnabled: true,
    },
  })
  if (!before) throw new Error(`provider ${ID} not found`)

  console.log(`provider  ${before.name}`)
  for (const [k, v] of Object.entries(TARGET)) {
    const cur = (before as any)[k]
    console.log(`  ${k.padEnd(18)} ${String(cur)} -> ${v}${String(cur) === v ? '  (unchanged)' : ''}`)
  }
  console.log(`  ${'serviceRadiusMiles'.padEnd(18)} ${before.serviceRadiusMiles} (unchanged)`)
  console.log(`  ${'email'.padEnd(18)} ${before.email} (unchanged, confirmed by him)`)
  console.log(`  ${'eligible/notify'.padEnd(18)} ${before.eligibleForLeads}/${before.notifyEnabled} (unchanged)`)

  if (!APPLY) {
    console.log('\n(dry run -- nothing written)')
    return
  }

  const after = await prisma.provider.update({
    where: { id: ID },
    data: TARGET,
    select: {
      name: true, primaryCity: true, primaryState: true, zipCodes: true,
      serviceRadiusMiles: true, eligibleForLeads: true, notifyEnabled: true,
    },
  })
  console.log('\nresult:', JSON.stringify(after))
}

main().catch(e => { console.error(`\n${e.message}`); process.exit(1) }).finally(() => prisma.$disconnect())
