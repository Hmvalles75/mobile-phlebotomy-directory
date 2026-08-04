import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.lead.groupBy({
    by: ['status'],
    _count: { _all: true },
    where: { routedToId: { not: null } },
  })
  console.log('Leads that still carry a routedToId, by status:\n')
  for (const r of rows.sort((a, b) => b._count._all - a._count._all)) {
    console.log(`  ${String(r.status).padEnd(22)} ${String(r._count._all).padStart(4)}`)
  }

  // Of the OPEN ones, how many were claimed at some point then released?
  const openWithClaim = await prisma.lead.count({
    where: { status: 'OPEN', routedToId: { not: null }, claimedAt: { not: null } },
  })
  const openNoClaim = await prisma.lead.count({
    where: { status: 'OPEN', routedToId: { not: null }, claimedAt: null },
  })
  console.log(`\nOPEN + routedToId, previously claimed then released: ${openWithClaim}`)
  console.log(`OPEN + routedToId, never claimed:                    ${openNoClaim}`)
  console.log('\nNeither is live work the provider currently holds.')

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
