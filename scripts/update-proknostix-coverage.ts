import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Coverage update for Proknostix Mobile Services (Latarsha Mack), per her
 * 2026-08-17 reply: radius 100 -> 75, and she wants DC / MD / VA.
 *
 * Two corrections and one addition:
 *  - 200010 and 200011 are six digits and can never match. They are 20010 and
 *    20011 (Columbia Heights, Petworth), otherwise missing from her list.
 *  - Her list was almost entirely DC, which produced exactly 1 lead in the last
 *    12 months against Maryland's 18. Adding the two Maryland clusters that
 *    actually generate requests — the Baltimore corridor (10 leads) and
 *    Montgomery County (5) — plus the southern-MD ZIPs she asked for.
 *  - Chesapeake VA (23320/23328) is deliberately NOT added: 156mi out, which no
 *    radius reaches, and she has not yet confirmed she works Hampton Roads.
 *
 * primaryCity/primaryCitySlug are deliberately untouched. They currently read
 * "Washington DC" / washington-dc under state MD, which is wrong, but the
 * correct value depends on which town she is based in — still unanswered.
 * primaryState is already MD, which is where her featured placement belongs.
 */
const PROVIDER_ID = 'cmsrufz0w000qky04ekl9nasb'

const ZIP_FIXES: Record<string, string> = { '200010': '20010', '200011': '20011' }

const ADD = [
  // Southern MD — she asked for these (no lead history, but inside her radius)
  '20601', '20602', '20604', '20693', '20613',
  // Montgomery County — 5 leads/12mo
  '20832', '20850', '20876', '20879', '20815',
  // Baltimore corridor — 10 leads/12mo
  '21215', '21223', '21229', '21209', '21221', '21228',
  '21060', '21076', '21136', '21158', '21042', '21045', '21737',
  // Prince George's + Northern VA — leads on record
  '20772', '22302', '22308',
]

async function main() {
  const before = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: { name: true, zipCodes: true, serviceRadiusMiles: true, primaryCity: true, primaryState: true, primaryCitySlug: true, primaryStateSlug: true },
  })
  if (!before) { console.log('not found — nothing changed'); return }

  const current = (before.zipCodes ?? '').split(',').map(s => s.trim()).filter(Boolean)
  console.log(`${before.name}`)
  console.log(`  BEFORE radius=${before.serviceRadiusMiles}mi  zips=${current.length}`)
  console.log(`         ${current.join(', ')}`)

  const fixed = current.map(z => ZIP_FIXES[z] ?? z)
  const corrections = current.filter(z => ZIP_FIXES[z])
  const merged = Array.from(new Set([...fixed, ...ADD])).sort()
  const added = merged.filter(z => !fixed.includes(z))

  const after = await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: { zipCodes: merged.join(','), serviceRadiusMiles: 75 },
    select: { zipCodes: true, serviceRadiusMiles: true, primaryCity: true, primaryState: true, primaryCitySlug: true, primaryStateSlug: true, featuredTier: true, priorityRouting: true },
  })

  console.log(`\n  corrected: ${corrections.length ? corrections.map(z => `${z} -> ${ZIP_FIXES[z]}`).join(', ') : 'none'}`)
  console.log(`  added (${added.length}): ${added.join(', ')}`)
  console.log(`\n  AFTER  radius=${after.serviceRadiusMiles}mi  zips=${after.zipCodes!.split(',').length}`)
  console.log(`  UNCHANGED (awaiting her base town): primaryCity="${after.primaryCity}" slug=${after.primaryCitySlug}`)
  console.log(`  state stays ${after.primaryState}/${after.primaryStateSlug} — correct, MD is where the demand is`)
  console.log(`  paid flags intact: featuredTier=${after.featuredTier} priorityRouting=${after.priorityRouting}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
