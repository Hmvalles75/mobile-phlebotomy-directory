/**
 * 2026-10-07: reverse one stale-release strike each for the four providers
 * auto-released after 9/10 without the 1-hour warning, because the warning
 * was stamped once per lead and they held a re-claimed lead (see
 * PER_CLAIM_RESET in lib/claimReminder.ts). Hector's instruction.
 * Provider counter only; Lead.staleReleaseCount is the loop guard and stays.
 */
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
const CASES = [
  { name: 'Allstar Phlebotomy LLC', lead: 'Oxford, NC 10/06' },
  { name: 'Superior Mobile/ Superior Express Labs', lead: 'Newark, DE 9/18' },
  { name: 'Boujee Sticks And CO', lead: 'Matthews, NC 9/19' },
  { name: 'ClearPath Employment and DOT Compliance', lead: 'Orlando, FL 9/28' },
]
async function main() {
  for (const c of CASES) {
    const ps = await prisma.provider.findMany({ where: { name: c.name, removedAt: null }, select: { id: true, name: true, staleReleaseCount: true } })
    if (ps.length !== 1) { console.log(`SKIP ${c.name}: ${ps.length} matches`); continue }
    const p = ps[0]
    if (p.staleReleaseCount <= 0) { console.log(`SKIP ${c.name}: count already ${p.staleReleaseCount}`); continue }
    await runAsActor('admin', `scripts/reverse-unwarned-strikes-2026-10-07.ts (${c.lead})`, () =>
      prisma.provider.update({ where: { id: p.id }, data: { staleReleaseCount: { decrement: 1 } } }))
    const a = await prisma.provider.findUnique({ where: { id: p.id }, select: { staleReleaseCount: true } })
    console.log(`${p.name.trim()}: strikes ${p.staleReleaseCount} -> ${a?.staleReleaseCount}  (${c.lead})`)
  }
}
main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
