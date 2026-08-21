import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Clear Sherin Price's (All Veins) stale-release strikes.
 *
 * She carried 9. Across her claim history she logs an outcome on 5 of 6 leads —
 * voicemail, no answer, text sent, email sent, and an appointment booked in
 * Philadelphia. The strikes accrued on leads she was working by email, which
 * the system could not see because "I'm working it" existed only on the
 * dashboard and she arrives from lead emails. She raised it twice.
 *
 * Resetting the count, not the release records: the leads keep their history,
 * only the penalty tally attached to her account is cleared.
 */
async function main() {
  const p = await prisma.provider.findFirst({
    where: { name: { contains: 'All Veins', mode: 'insensitive' } },
    select: { id: true, name: true, staleReleaseCount: true },
  })
  if (!p) { console.log('not found'); return }
  console.log(`  ${p.name}  before: ${p.staleReleaseCount} strikes`)
  const after = await prisma.provider.update({
    where: { id: p.id },
    data: { staleReleaseCount: 0 },
    select: { name: true, staleReleaseCount: true },
  })
  console.log(`  ${after.name}  after:  ${after.staleReleaseCount} strikes`)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
