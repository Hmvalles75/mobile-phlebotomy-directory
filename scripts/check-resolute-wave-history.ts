import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const RESOLUTE = 'cmnhligzj000al804q4s34yba'

/**
 * How often does a Wave 2 provider get a lead notification that is cancelled
 * before delivery because the lead was claimed inside the 10-minute head-start
 * window? Resolute has now asked twice why leads "don't show up".
 */
async function main() {
  const notifs = await prisma.leadNotification.findMany({
    where: { providerId: RESOLUTE },
    select: { leadId: true, createdAt: true, status: true, sentAt: true },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })

  const leadIds = notifs.map(n => n.leadId)
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, city: true, state: true, zip: true, createdAt: true, claimedAt: true, routedToId: true, status: true },
  })
  const byId = new Map(leads.map(l => [l.id, l]))

  const winners = await prisma.provider.findMany({
    where: { id: { in: [...new Set(leads.map(l => l.routedToId).filter(Boolean) as string[])] } },
    select: { id: true, name: true, priorityRouting: true, listingTier: true },
  })
  const winnerById = new Map(winners.map(w => [w.id, w]))

  console.log('Resolute Mobile lab — every lead notification, newest first')
  console.log('(Wave 2 = 10-minute SendGrid delay; cancelled if claimed inside it)\n')
  console.log('  LEAD                     NOTIFIED           CLAIMED AFTER   OUTCOME')
  console.log('  ' + '─'.repeat(92))

  let cancelledBeforeDelivery = 0
  let deliveredAndLost = 0
  let stillOpen = 0

  for (const n of notifs) {
    const l = byId.get(n.leadId)
    if (!l) continue
    const loc = `${l.city}, ${l.state}`.slice(0, 22).padEnd(24)
    const when = n.createdAt.toISOString().slice(5, 16).replace('T', ' ')

    if (!l.claimedAt) {
      stillOpen++
      console.log(`  ${loc} ${when}   —               unclaimed (${l.status})`)
      continue
    }
    const secs = (l.claimedAt.getTime() - n.createdAt.getTime()) / 1000
    const w = l.routedToId ? winnerById.get(l.routedToId) : null
    const mine = l.routedToId === RESOLUTE
    const within10 = secs < 600

    if (mine) {
      console.log(`  ${loc} ${when}   ${secs.toFixed(0).padStart(6)}s        SHE CLAIMED IT`)
    } else if (within10) {
      cancelledBeforeDelivery++
      console.log(`  ${loc} ${when}   ${secs.toFixed(0).padStart(6)}s        ✗ cancelled before delivery — won by ${w?.name?.slice(0, 24)}${w?.priorityRouting ? ' [PAYING]' : ''}`)
    } else {
      deliveredAndLost++
      console.log(`  ${loc} ${when}   ${secs.toFixed(0).padStart(6)}s        delivered, lost the race — ${w?.name?.slice(0, 24)}`)
    }
  }

  const total = notifs.length
  console.log(`\n  ${'─'.repeat(92)}`)
  console.log(`  Total notifications:                              ${total}`)
  console.log(`  Never delivered (claimed inside her 10-min wait):  ${cancelledBeforeDelivery}`)
  console.log(`  Delivered but already gone:                       ${deliveredAndLost}`)
  console.log(`  Still open when notified:                         ${stillOpen}`)
  console.log(`  She actually claimed:                             ${notifs.filter(n => byId.get(n.leadId)?.routedToId === RESOLUTE).length}`)

  // Is this specific to her, or does every Wave 2 provider see it?
  const since = new Date(Date.now() - 60 * 86400000)
  const recent = await prisma.lead.findMany({
    where: { claimedAt: { not: null }, createdAt: { gte: since } },
    select: { id: true, createdAt: true, claimedAt: true, routedToId: true },
  })
  const fast = recent.filter(l => (l.claimedAt!.getTime() - l.createdAt.getTime()) / 1000 < 600)
  console.log(`\n  PLATFORM-WIDE (60d): ${fast.length} of ${recent.length} claimed leads were taken`)
  console.log(`  inside the 10-minute window — i.e. every free provider's copy was cancelled.`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
