import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { freeTierDelaySeconds, PAID_HEAD_START_SECONDS } from '../lib/leadNotifications'

const prisma = new PrismaClient()

/**
 * Replay the last 90 days through the reinstated head-start rules. Read-only.
 *
 * Answers the two questions that decide whether this is safe to ship: how often
 * the window actually engages, and how many real claims it would have delayed
 * or taken from a free provider.
 */
async function main() {
  const since = new Date(Date.now() - 90 * 864e5)
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true, city: true, state: true, urgency: true, createdAt: true, claimedAt: true, routedToId: true },
    orderBy: { createdAt: 'desc' },
  })

  let windowed = 0, noPayer = 0, statExempt = 0
  let claimsInsideWindow = 0
  const affected: string[] = []

  for (const l of leads) {
    const notified = await prisma.leadNotification.findMany({
      where: { leadId: l.id },
      select: { provider: { select: { id: true, name: true, priorityRouting: true } } },
      distinct: ['providerId'],
    })
    if (notified.length === 0) continue
    const payers = notified.filter(n => n.provider.priorityRouting).length
    const delay = freeTierDelaySeconds(payers, l.urgency as 'STANDARD' | 'STAT')

    if (delay === 0) { payers === 0 ? noPayer++ : statExempt++; continue }
    windowed++

    if (l.claimedAt && l.routedToId) {
      const winner = notified.find(n => n.provider.id === l.routedToId)
      const secs = (l.claimedAt.getTime() - l.createdAt.getTime()) / 1000
      if (winner && !winner.provider.priorityRouting && secs < PAID_HEAD_START_SECONDS) {
        claimsInsideWindow++
        affected.push(`    ${l.createdAt.toISOString().slice(0,10)}  ${(l.city ?? '').slice(0,16).padEnd(16)} claimed at +${Math.round(secs)}s by ${winner.provider.name}`)
      }
    }
  }

  console.log(`Leads with notifications, last 90d: ${windowed + noPayer + statExempt}`)
  console.log(`  window ENGAGES (paying provider in range, STANDARD): ${windowed}`)
  console.log(`  no delay — no paying provider covers the area:       ${noPayer}`)
  console.log(`  no delay — STAT/urgent:                              ${statExempt}`)
  console.log(`\nFree-provider claims that landed inside the 10-min window: ${claimsInsideWindow}`)
  affected.forEach(a => console.log(a))
  console.log(`\n(Those are the claims this change would have given the paying provider first refusal on.)`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
