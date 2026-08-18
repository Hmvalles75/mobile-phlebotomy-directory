import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { passLead } from '../lib/passLead'

const prisma = new PrismaClient()

/**
 * Exercises every rejection path in passLead() against real rows. The pass link
 * carries no secret, so these guards ARE the authorisation model — each one is
 * checked against a case that should trip it.
 *
 * Read-only in effect: every case below is expected to be REFUSED. If any
 * returns ok:true the test has mutated data and says so loudly.
 */
async function main() {
  const results: string[] = []

  // 1. Unknown lead
  const r1 = await passLead('does-not-exist', 'nobody')
  results.push(`unknown lead                 -> ${r1.ok ? 'ok (WRONG)' : r1.reason}`)

  // 2. Real lead, provider never notified about it
  const anyLead = await prisma.lead.findFirst({ where: { status: 'OPEN' }, select: { id: true } })
  const strangerProvider = await prisma.provider.findFirst({ where: { priorityRouting: true }, select: { id: true, name: true } })
  if (anyLead && strangerProvider) {
    const notified = await prisma.leadNotification.count({ where: { leadId: anyLead.id, providerId: strangerProvider.id } })
    if (notified === 0) {
      const r2 = await passLead(anyLead.id, strangerProvider.id)
      results.push(`paying provider, not notified -> ${r2.ok ? 'ok (WRONG — tampering possible!)' : r2.reason}`)
    }
  }

  // 3. A free provider who WAS notified — no window to give up
  const freeNotif = await prisma.leadNotification.findFirst({
    where: { provider: { priorityRouting: false }, lead: { status: 'OPEN' } },
    select: { leadId: true, providerId: true, provider: { select: { name: true } } },
  })
  if (freeNotif) {
    const r3 = await passLead(freeNotif.leadId, freeNotif.providerId)
    results.push(`free provider, was notified   -> ${r3.ok ? 'ok (WRONG)' : r3.reason}`)
  }

  // 4. A paying provider on a lead that is already claimed
  const claimedNotif = await prisma.leadNotification.findFirst({
    where: { provider: { priorityRouting: true }, lead: { status: 'CLAIMED' } },
    select: { leadId: true, providerId: true },
  })
  if (claimedNotif) {
    const r4 = await passLead(claimedNotif.leadId, claimedNotif.providerId)
    results.push(`already-claimed lead          -> ${r4.ok ? 'ok (WRONG)' : r4.reason}`)
  }

  // 5. A paying provider on an OPEN lead whose window has long closed
  const oldNotif = await prisma.leadNotification.findFirst({
    where: { provider: { priorityRouting: true }, lead: { status: 'OPEN' }, createdAt: { lt: new Date(Date.now() - 3600_000) } },
    select: { leadId: true, providerId: true },
  })
  if (oldNotif) {
    const r5 = await passLead(oldNotif.leadId, oldNotif.providerId)
    results.push(`window long closed            -> ${r5.ok ? 'ok (WRONG)' : r5.reason}`)
  }

  results.forEach(r => console.log('  ' + r))
  const passedRows = await prisma.leadNotification.count({ where: { passedAt: { not: null } } })
  console.log(`\n  rows with passedAt set after tests: ${passedRows}  (must be 0 — every case above should refuse)`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
