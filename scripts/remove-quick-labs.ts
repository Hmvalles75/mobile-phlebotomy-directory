import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Mary Berry (Quick Labs LLC) asked to be taken off the list on 2026-08-19,
 * had to ask again on 2026-08-20 after a courtesy email reached her through a
 * path with no suppression check, and confirmed on 2026-08-20 that she wants
 * the directory listing gone too.
 *
 * Soft removal, matching app/api/admin/providers/[id]/remove/route.ts exactly.
 * Never a hard delete: the row stays so doNotRelist can stop a future scrape
 * putting her back, and so her 17 notification records keep their referent.
 *
 * notifyEnabled/eligibleForLeads were already false from the 19th; set again
 * here so this script is the complete action rather than a partial one that
 * depends on earlier state.
 */
async function main() {
  const before = await prisma.provider.findUnique({
    where: { slug: 'quick-labs-llc' },
    select: { id: true, name: true, removedAt: true, doNotRelist: true },
  })
  if (!before) { console.log('not found'); return }
  if (before.removedAt) { console.log('already removed — no change'); return }

  const held = await prisma.lead.count({ where: { routedToId: before.id, status: 'CLAIMED' } })
  if (held > 0) {
    console.log(`ABORT — she still holds ${held} CLAIMED lead(s); release those first so no patient is stranded.`)
    return
  }

  const after = await prisma.provider.update({
    where: { id: before.id },
    data: {
      removedAt: new Date(),
      removedReason: 'Provider request — asked to be removed from the list 2026-08-19, confirmed listing removal 2026-08-20',
      doNotRelist: true,
      eligibleForLeads: false,
      notifyEnabled: false,
      smsOptOutAt: new Date(),
      isFeatured: false,
    },
    select: { name: true, slug: true, removedAt: true, doNotRelist: true, eligibleForLeads: true, notifyEnabled: true, isFeatured: true },
  })
  console.log(`  ${after.name} [${after.slug}]`)
  console.log(`    removedAt=${after.removedAt?.toISOString()}`)
  console.log(`    doNotRelist=${after.doNotRelist}  eligible=${after.eligibleForLeads}  notify=${after.notifyEnabled}  featured=${after.isFeatured}`)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
