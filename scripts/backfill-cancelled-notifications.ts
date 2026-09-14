// One-off 2026-09-14. Notification rows whose SendGrid send was cancelled
// before delivery (batch cancel when a paying provider claimed inside the head
// start) were left as SENT, so release/rematch/renotify treated those
// providers as already told. Flip every such row to CANCELLED using SendGrid's
// own 'dropped / user cancel' events. Safe to re-run.
//   npx tsx scripts/backfill-cancelled-notifications.ts [--dry]
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const dry = process.argv.includes('--dry')
async function main() {
  const drops = await prisma.emailEvent.findMany({
    where: { event: 'dropped', reason: { startsWith: 'user cancel' }, leadNotificationId: { not: null } },
    select: { leadNotificationId: true, reason: true, leadId: true },
  })
  const ids = [...new Set(drops.map(d => d.leadNotificationId!))]
  const rows = await prisma.leadNotification.findMany({ where: { id: { in: ids }, status: { in: ['SENT', 'QUEUED'] } }, select: { id: true, leadId: true, lead: { select: { status: true, city: true, state: true } } } })
  console.log(`cancel events: ${drops.length}; rows still SENT/QUEUED: ${rows.length}`)
  const byLead = new Map<string, { n: number; status: string; where: string }>()
  for (const r of rows) { const b = byLead.get(r.leadId) || { n: 0, status: r.lead.status, where: `${r.lead.city}, ${r.lead.state}` }; b.n++; byLead.set(r.leadId, b) }
  for (const [id, b] of byLead) console.log(`  ${id} ${b.where.padEnd(24)} ${b.status.padEnd(20)} ${b.n} row(s)`)
  if (dry) { console.log('dry run, no writes'); await prisma.$disconnect(); return }
  const res = await prisma.leadNotification.updateMany({ where: { id: { in: rows.map(r => r.id) } }, data: { status: 'CANCELLED', errorMessage: 'Cancelled at SendGrid before delivery (backfill 2026-09-14)' } })
  console.log('updated:', res.count)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
