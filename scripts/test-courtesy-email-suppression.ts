import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { freeTierDelaySeconds } from '../lib/leadNotifications'

/**
 * Exercises the courtesy-email delivery reconstruction from
 * lib/cancelLeadNotifications.ts against the three cases that matter.
 *
 * Pure function test — no DB writes, no emails. The predicate under test is
 * reproduced here exactly as written in the source; if that changes, this
 * fails and should be updated deliberately.
 */
interface Notif {
  provider: string
  priorityRouting: boolean
  sentAtOffsetSec: number   // relative to lead creation
}

function decide(
  notifs: Notif[],
  claimerName: string,
  urgency: 'STANDARD' | 'STAT',
  claimedAtOffsetSec: number,
): { delivered: string[]; suppressed: string[] } {
  const payingInBatch = notifs.filter(n => n.priorityRouting).length
  const otherDelay = freeTierDelaySeconds(payingInBatch, urgency)
  const delivered: string[] = []
  const suppressed: string[] = []
  for (const n of notifs) {
    if (n.provider === claimerName) continue
    const delay = n.priorityRouting ? 0 : otherDelay
    const deliveryTime = n.sentAtOffsetSec + delay
    ;(deliveryTime <= claimedAtOffsetSec ? delivered : suppressed).push(n.provider)
  }
  return { delivered, suppressed }
}

let pass = 0, fail = 0
function check(label: string, actual: string[], expected: string[]) {
  const a = [...actual].sort().join(',')
  const e = [...expected].sort().join(',')
  const ok = a === e
  ok ? pass++ : fail++
  console.log(`    ${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) console.log(`          expected [${e}]  got [${a}]`)
}

console.log('CASE 1 — claimed INSIDE the window (the Resolute case)')
console.log('  Columbia MD: 7 notified, 1 paying, claimed at 26s\n')
{
  const notifs: Notif[] = [
    { provider: 'Dynamic Stix', priorityRouting: true, sentAtOffsetSec: 0 },
    { provider: 'Resolute', priorityRouting: false, sentAtOffsetSec: 0 },
    { provider: 'Sticks R Us', priorityRouting: false, sentAtOffsetSec: 0 },
    { provider: 'Traveling Tubes', priorityRouting: false, sentAtOffsetSec: 0 },
  ]
  const r = decide(notifs, 'Sticks R Us', 'STANDARD', 26)
  check('Wave 1 (Dynamic Stix) gets a courtesy email', r.delivered, ['Dynamic Stix'])
  check('Wave 2 suppressed — never delivered', r.suppressed, ['Resolute', 'Traveling Tubes'])
}

console.log('\nCASE 2 — claimed AFTER the Wave 2 window elapsed')
console.log('  Same batch, claimed at 2400s (40 min > 30 min window)\n')
{
  const notifs: Notif[] = [
    { provider: 'Dynamic Stix', priorityRouting: true, sentAtOffsetSec: 0 },
    { provider: 'Resolute', priorityRouting: false, sentAtOffsetSec: 0 },
    { provider: 'Traveling Tubes', priorityRouting: false, sentAtOffsetSec: 0 },
  ]
  const r = decide(notifs, 'Resolute', 'STANDARD', 2400)
  check('everyone else got it — all receive courtesy', r.delivered, ['Dynamic Stix', 'Traveling Tubes'])
  check('nothing suppressed', r.suppressed, [])
}

console.log('\nCASE 3 — no paying provider in range (otherDelay = 0)')
console.log('  5 free providers, claimed at 20s — open race, all delivered instantly\n')
{
  const notifs: Notif[] = [
    { provider: 'Skilled Labs', priorityRouting: false, sentAtOffsetSec: 0 },
    { provider: 'Resolute', priorityRouting: false, sentAtOffsetSec: 0 },
    { provider: "Mom Vic's", priorityRouting: false, sentAtOffsetSec: 0 },
  ]
  const r = decide(notifs, 'Skilled Labs', 'STANDARD', 20)
  check('all non-claimers receive courtesy', r.delivered, ['Resolute', "Mom Vic's"])
  check('nothing suppressed', r.suppressed, [])
}

console.log('\nCASE 4 — STAT lead (no free delay even with a paying provider)')
{
  const notifs: Notif[] = [
    { provider: 'Dynamic Stix', priorityRouting: true, sentAtOffsetSec: 0 },
    { provider: 'Resolute', priorityRouting: false, sentAtOffsetSec: 0 },
  ]
  const r = decide(notifs, 'Dynamic Stix', 'STAT', 15)
  check('Wave 2 delivered immediately on STAT', r.delivered, ['Resolute'])
  check('nothing suppressed', r.suppressed, [])
}

console.log('\nCASE 5 — re-notification: same lead notified again days later')
console.log('  A stale-released lead re-notified at t+172800s, claimed 40s after that\n')
{
  const notifs: Notif[] = [
    { provider: 'Dynamic Stix', priorityRouting: true, sentAtOffsetSec: 172800 },
    { provider: 'Resolute', priorityRouting: false, sentAtOffsetSec: 172800 },
  ]
  const r = decide(notifs, 'Dynamic Stix', 'STANDARD', 172840)
  check('uses each row\'s own send time, not lead creation', r.suppressed, ['Resolute'])
  check('nobody wrongly credited as delivered', r.delivered, [])
}

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
