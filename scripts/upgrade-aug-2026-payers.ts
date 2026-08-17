import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Two providers subscribed at $79 Founding Partner (8/14 and 8/16) and were
 * never upgraded in the database, because the Stripe webhook has never been
 * registered — see scripts/audit-stripe-subs-vs-db.ts. Until this runs they
 * are paying and receiving exactly what a free listing receives: no featured
 * placement, and no paid head start.
 *
 * Also backfills stripeCustomerId, which the audit script needs and which is
 * null across most paid records.
 *
 * Coverage data is deliberately NOT touched here — Proknostix has two
 * six-digit ZIPs and a DC/MD state mismatch that need Hector's call.
 */
const UPGRADES = [
  { id: 'cmsqpknui000elc043z330gih', name: 'FDP Phlebotomy LLC',         stripeCustomerId: 'cus_V4UfMySaDdC2qX' },
  { id: 'cmsrufz0w000qky04ekl9nasb', name: 'Proknostix Mobile Services', stripeCustomerId: 'cus_V5Hs5BMsDmJZzX' },
]

async function main() {
  for (const u of UPGRADES) {
    const before = await prisma.provider.findUnique({
      where: { id: u.id },
      select: { name: true, featuredTier: true, isFeatured: true, priorityRouting: true, stripeCustomerId: true },
    })
    if (!before) { console.log(`${u.name}: NOT FOUND — skipped`); continue }
    console.log(`\n${before.name}`)
    console.log(`  before: featuredTier=${before.featuredTier} isFeatured=${before.isFeatured} priorityRouting=${before.priorityRouting} stripeCustomerId=${before.stripeCustomerId ?? 'NULL'}`)

    if (before.priorityRouting && before.featuredTier === 'FOUNDING_PARTNER') {
      console.log('  already upgraded — no change')
      continue
    }

    const after = await prisma.provider.update({
      where: { id: u.id },
      data: {
        featuredTier: 'FOUNDING_PARTNER',
        isFeatured: true,
        priorityRouting: true,
        stripeCustomerId: u.stripeCustomerId,
      },
      select: { featuredTier: true, isFeatured: true, priorityRouting: true, stripeCustomerId: true, eligibleForLeads: true, notifyEnabled: true },
    })
    console.log(`  after : featuredTier=${after.featuredTier} isFeatured=${after.isFeatured} priorityRouting=${after.priorityRouting} stripeCustomerId=${after.stripeCustomerId}`)
    console.log(`  lead flags unchanged: eligibleForLeads=${after.eligibleForLeads} notifyEnabled=${after.notifyEnabled}`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
