import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const ID = 'cmsdjlfzz0007jv04pzrdg4mv'  // Michelle's Unlimited Phlebotomy

async function main() {
  const notifs = await prisma.leadNotification.findMany({
    where: { providerId: ID },
    select: { createdAt: true, leadId: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  console.log(`Lead notifications sent to Michelle: ${notifs.length}`)
  for (const n of notifs) console.log(`  ${n.createdAt.toISOString().slice(0, 16)}  lead=${n.leadId}`)

  const claims = await prisma.lead.findMany({
    where: { routedToId: ID },
    select: { fullName: true, city: true, state: true, status: true, outcome: true, claimedAt: true, completedAt: true },
    orderBy: { claimedAt: 'desc' },
  })
  console.log(`\nLeads claimed: ${claims.length}`)
  for (const c of claims) {
    console.log(`  ${c.claimedAt?.toISOString().slice(0, 10)}  ${c.fullName}  ${c.city}, ${c.state}  ${c.status}  outcome=${c.outcome || 'none'}`)
  }

  // How much demand is actually near her? 22191 Woodbridge VA, 25mi radius.
  const va = await prisma.lead.count({
    where: { state: 'VA', createdAt: { gte: new Date(Date.now() - 180 * 86400000) } },
  })
  console.log(`\nVA leads in last 180 days: ${va}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
