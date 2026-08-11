import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Providers carrying stale-release strikes, and whether they were actually
 * disengaged. A strike earned on a lead the provider then re-claimed and
 * worked is measuring the wrong thing.
 */
async function main() {
  const provs = await prisma.provider.findMany({
    where: { staleReleaseCount: { gt: 0 }, removedAt: null },
    select: { id: true, name: true, staleReleaseCount: true, lastStaleReleaseAt: true },
    orderBy: { staleReleaseCount: 'desc' },
  })
  console.log(`Providers with strikes: ${provs.length}\n`)
  for (const p of provs) {
    const claims = await prisma.lead.findMany({
      where: { routedToId: p.id },
      select: { outcome: true, completedAt: true },
    })
    const reclaimed = await prisma.lead.count({
      where: { releasedFromProviderId: p.id, routedToId: p.id, releaseReason: 'stale_claim' },
    })
    const logged = claims.filter(c => c.outcome).length
    console.log(`  ${p.name.slice(0, 40).padEnd(42)} strikes=${p.staleReleaseCount}  claims=${claims.length}  with outcome=${logged}  re-claimed after release=${reclaimed}`)
  }
  console.log('\n  "re-claimed after release" = strikes the new rule would have reversed.')
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
