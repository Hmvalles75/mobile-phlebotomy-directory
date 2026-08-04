import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Did the three new Founding Partners see lead notifications in the run-up to
 * subscribing?
 *
 * If yes, lead volume sold the upgrade — they saw demand and paid for priority.
 * If no, something else did (newsletter, SEO, the listing itself), and volume
 * is not the lever. Subscription times come from Stripe.
 */
const WINDOW_START = new Date('2026-07-25T00:00:00Z')
const WINDOW_END = new Date('2026-08-03T23:59:59Z')

const SUBS = [
  { name: 'Pleasant Stick',  id: 'cmit330i900owg0m0prrngxqw', subscribedAt: new Date('2026-07-31T14:59:01Z') },
  { name: 'Dynamic Stix',    id: 'cms3iz6050009k104t9z18jel', subscribedAt: new Date('2026-08-01T22:47:01Z') },
  { name: 'A & A (Amanda)',  id: 'cmpzuqibg000il504u9lrhn7s', subscribedAt: new Date('2026-08-03T22:54:54Z') },
]

async function main() {
  console.log('═'.repeat(92))
  console.log(`LEAD NOTIFICATIONS  ${WINDOW_START.toISOString().slice(0, 10)} → ${WINDOW_END.toISOString().slice(0, 10)}`)
  console.log('═'.repeat(92))

  for (const s of SUBS) {
    const notifs = await prisma.leadNotification.findMany({
      where: { providerId: s.id, createdAt: { gte: WINDOW_START, lte: WINDOW_END } },
      select: { createdAt: true, leadId: true },
      orderBy: { createdAt: 'asc' },
    })

    const before = notifs.filter(n => n.createdAt < s.subscribedAt)
    const after = notifs.filter(n => n.createdAt >= s.subscribedAt)

    console.log(`\n── ${s.name}`)
    console.log(`   subscribed: ${s.subscribedAt.toISOString().slice(0, 16)}`)
    console.log(`   notifications in window: ${notifs.length}   BEFORE subscribing: ${before.length}   after: ${after.length}`)

    if (notifs.length) {
      const leadIds = notifs.map(n => n.leadId)
      const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, city: true, state: true, status: true, claimedAt: true, routedToId: true },
      })
      const leadMap = new Map(leads.map(l => [l.id, l]))
      for (const n of notifs) {
        const l = leadMap.get(n.leadId)
        const when = n.createdAt < s.subscribedAt ? 'BEFORE' : 'after '
        const mine = l?.routedToId === s.id ? ' ← they claimed it' : ''
        console.log(`     ${when}  ${n.createdAt.toISOString().slice(0, 16)}  ${l ? `${l.city}, ${l.state}`.padEnd(24) : '(lead gone)'.padEnd(24)} ${l?.status || ''}${mine}`)
      }
    }

    // All-time context: is this their normal rate, or a spike?
    const allTime = await prisma.leadNotification.count({ where: { providerId: s.id } })
    const firstEver = await prisma.leadNotification.findFirst({
      where: { providerId: s.id },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    console.log(`   all-time notifications: ${allTime}${firstEver ? `, first on ${firstEver.createdAt.toISOString().slice(0, 10)}` : ''}`)
  }

  // Platform-wide baseline for the same window, so the numbers have context.
  const [totalNotifs, totalLeads] = await Promise.all([
    prisma.leadNotification.count({ where: { createdAt: { gte: WINDOW_START, lte: WINDOW_END } } }),
    prisma.lead.count({ where: { createdAt: { gte: WINDOW_START, lte: WINDOW_END } } }),
  ])
  console.log(`\n${'═'.repeat(92)}`)
  console.log(`PLATFORM BASELINE, same window: ${totalLeads} leads created, ${totalNotifs} notifications sent`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
