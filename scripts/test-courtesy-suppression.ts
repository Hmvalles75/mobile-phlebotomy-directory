import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { canNotify } from '../lib/canNotify'
const prisma = new PrismaClient()

/**
 * Replays the courtesy-email recipient logic over every claimed lead and
 * reports who the OLD code would have emailed despite an opt-out.
 *
 * Read-only. Quick Labs LLC should appear — that is the bug being fixed.
 */
async function main() {
  const claimed = await prisma.lead.findMany({
    where: { status: { in: ['CLAIMED', 'DELIVERED'] }, claimedAt: { not: null } },
    select: { id: true, city: true, state: true, claimedAt: true, routedToId: true },
    orderBy: { claimedAt: 'desc' }, take: 400,
  })
  const offenders = new Map<string, { name: string; count: number; email: string }>()
  for (const l of claimed) {
    const ns = await prisma.leadNotification.findMany({
      where: { leadId: l.id, status: { in: ['SENT', 'QUEUED'] } },
      select: { providerId: true, provider: { select: { name: true, removedAt: true, notifyEnabled: true, notificationEmail: true, email: true } } },
    })
    for (const n of ns) {
      if (n.providerId === l.routedToId) continue
      if (canNotify(n.provider)) continue
      const key = n.providerId
      const prev = offenders.get(key)
      offenders.set(key, {
        name: n.provider.name ?? '?',
        email: n.provider.notificationEmail || n.provider.email || '—',
        count: (prev?.count ?? 0) + 1,
      })
    }
  }
  const rows = [...offenders.values()].sort((a, b) => b.count - a.count)
  console.log(`Opted-out / removed providers the courtesy email could reach: ${rows.length}\n`)
  for (const r of rows.slice(0, 12)) {
    console.log(`  ${String(r.count).padStart(3)} lead(s)  ${r.name.slice(0, 36).padEnd(36)} ${r.email}`)
  }
  console.log(`\n  total exposures: ${rows.reduce((s, r) => s + r.count, 0)}`)
  console.log(`  (each is a claimed lead whose courtesy email had no suppression check)`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
