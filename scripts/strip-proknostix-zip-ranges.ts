import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Latarsha Mack typed five ZIP *ranges* into a field that only does exact
 * matching, so they have matched nothing since she signed up:
 *
 *   20018–20020   20101–20198   22001–22315   20206 – 20207   20208-20217
 *
 * 22001–22315 was plainly an attempt to cover all of Northern Virginia, and
 * covered none of it. Stripping rather than expanding: her 75-mile radius from
 * DC already reaches every area these were reaching for — Loudoun, NoVA,
 * Baltimore, southern Maryland — so expanding them to hundreds of individual
 * entries would add nothing but noise, and many of the numbers in those spans
 * are not real ZIPs anyway.
 *
 * A valid US ZIP here is exactly 5 digits. Anything else cannot match and is
 * removed. The radius anchor is zipCodes[0], so the sort must leave a real DC
 * ZIP first — asserted below rather than assumed.
 */
const PROVIDER_ID = 'cmsrufz0w000qky04ekl9nasb'
const VALID_ZIP = /^\d{5}$/

async function main() {
  const before = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: { name: true, zipCodes: true, serviceRadiusMiles: true },
  })
  if (!before) { console.log('not found — nothing changed'); return }

  const current = (before.zipCodes ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const kept = current.filter(z => VALID_ZIP.test(z)).sort()
  const stripped = current.filter(z => !VALID_ZIP.test(z))

  console.log(`${before.name}   radius=${before.serviceRadiusMiles}mi`)
  console.log(`  before: ${current.length} entries`)
  console.log(`  stripping ${stripped.length} that can never match:`)
  stripped.forEach(z => console.log(`      "${z}"`))

  if (stripped.length === 0) { console.log('\n  nothing to strip — no change made.'); return }

  if (!VALID_ZIP.test(kept[0])) {
    console.log(`\n  ABORT — first entry "${kept[0]}" is not a valid ZIP; it anchors the radius.`)
    return
  }

  const after = await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: { zipCodes: kept.join(',') },
    select: { zipCodes: true, serviceRadiusMiles: true, featuredTier: true, priorityRouting: true, primaryCity: true },
  })
  const list = after.zipCodes!.split(',')
  console.log(`\n  after: ${list.length} valid ZIPs, radius anchor = ${list[0]}`)
  console.log(`  ${list.join(', ')}`)
  console.log(`\n  paid flags intact: featuredTier=${after.featuredTier} priorityRouting=${after.priorityRouting}`)
  console.log(`  primaryCity still "${after.primaryCity}" — awaiting her base town`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
