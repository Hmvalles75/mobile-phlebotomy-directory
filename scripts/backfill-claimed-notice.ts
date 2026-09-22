// One-off 2026-09-21. The "was just claimed" courtesy email is now sent once
// per provider per lead, tracked by LeadNotification.claimedNoticeSentAt. Rows
// that predate the column are null, so every provider already told about a lead
// that has been claimed at least once would get ONE more notice on its next
// claim. Stamp those rows so the new rule applies from the first claim onwards.
//
// A lead "has been claimed at least once" when it is claimed now, was ever
// released, or has a stale-release count. Only SENT rows are stamped: CANCELLED
// rows never reached the provider, and those providers were never told.
//   npx tsx scripts/backfill-claimed-notice.ts [--dry]
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const dry = process.argv.includes('--dry')

async function main() {
  const leads = await prisma.lead.findMany({
    where: { OR: [{ claimedAt: { not: null } }, { releasedAt: { not: null } }, { staleReleaseCount: { gt: 0 } }] },
    select: { id: true },
  })
  const ids = leads.map(l => l.id)
  const where = { leadId: { in: ids }, status: 'SENT' as const, claimedNoticeSentAt: null }
  const n = await prisma.leadNotification.count({ where })
  console.log(`leads claimed at least once: ${ids.length}; SENT rows to stamp: ${n}`)
  if (dry) { console.log('dry run, nothing written'); await prisma.$disconnect(); return }
  const r = await prisma.leadNotification.updateMany({ where, data: { claimedNoticeSentAt: new Date('2026-09-21T00:00:00Z') } })
  console.log('stamped:', r.count)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
