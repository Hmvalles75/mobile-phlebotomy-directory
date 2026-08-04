import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getDistanceBetweenZips, getZipInfo } from '../lib/zip-geocode'

const prisma = new PrismaClient()

/**
 * Diagnose-only. Classifies every lead that was never routed despite a
 * provider being in radius today.
 *
 * Two structural facts from lib/leadNotifications.ts shape the classes:
 *
 *  - Routing NEVER matches on city name or slug. findFeaturedProvidersForNotification
 *    matches on state ABBR (coverage.state.abbr or primaryState) plus a ZIP
 *    radius/explicit-ZIP test. So the 86 whitespace-corrupted city names cannot
 *    cause a routing miss. Verified by reading the predicate, and asserted below.
 *
 *  - A leadNotification row is created BEFORE the send is attempted (status
 *    QUEUED, then SENT or FAILED). So zero notification rows means routing
 *    found nobody or was never invoked; FAILED rows mean delivery broke.
 *    This is the discriminator for "send attempted and failed".
 *
 * Historical eligibility cannot be reconstructed exactly — there is no audit
 * log on eligibleForLeads/status/notifyEnabled. Provider createdAt and their
 * first-ever notification are used as proxies and labelled as inferred.
 */
const DAYS = 180
const MAX_NOTIFICATION_AGE_DAYS = 4  // mirrors leadNotifications.ts

type Klass =
  | 'PROVIDER_NOT_YET_ELIGIBLE'
  | 'STATE_ABBR_CORRUPTED'     // provider DID intend this state; abbr row holds the full name
  | 'CROSS_STATE_NO_COVERAGE'  // radius reaches, but provider never claimed that state — correct
  | 'LEAD_ZIP_NOT_GEOCODABLE'
  | 'SEND_ATTEMPTED_FAILED'
  | 'AGE_GATE'
  | 'NOTIFY_NEVER_INVOKED'
  | 'UNEXPLAINED'

async function main() {
  const since = new Date(Date.now() - DAYS * 86400000)

  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true, createdAt: true, city: true, state: true, zip: true,
      status: true, source: true, routedToId: true, routedProviderIds: true,
      notificationBatchId: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const neverRouted = leads.filter(l => !l.routedToId && l.routedProviderIds.length === 0)

  const provs = await prisma.provider.findMany({
    where: { removedAt: null, eligibleForLeads: true, notifyEnabled: true, zipCodes: { not: null } },
    select: {
      id: true, name: true, createdAt: true, status: true,
      zipCodes: true, serviceRadiusMiles: true, primaryState: true,
      notificationEmail: true, claimEmail: true, email: true,
      coverage: { select: { state: { select: { abbr: true, name: true } } } },
    },
  })

  // name → clean abbr, built from the uncorrupted State rows. Lets us ask
  // "did this provider mean to cover the lead's state?" even when their
  // coverage row points at a State whose abbr holds the full name.
  const nameToAbbr = new Map<string, string>()
  for (const s of await prisma.state.findMany({ select: { abbr: true, name: true } })) {
    if (s.abbr.length === 2 && s.abbr === s.abbr.toUpperCase()) {
      nameToAbbr.set(s.name.toLowerCase(), s.abbr)
    }
  }

  // First-ever notification per provider — proxy for "when did they go live".
  const firstNotif = new Map<string, Date>()
  for (const r of await prisma.leadNotification.groupBy({
    by: ['providerId'], _min: { createdAt: true },
  })) {
    if (r._min.createdAt) firstNotif.set(r.providerId, r._min.createdAt)
  }

  // Notification rows for the leads in question.
  const notifRows = await prisma.leadNotification.findMany({
    where: { leadId: { in: neverRouted.map(l => l.id) } },
    select: { leadId: true, providerId: true, status: true, errorMessage: true },
  })
  const notifByLead = new Map<string, typeof notifRows>()
  for (const n of notifRows) {
    const a = notifByLead.get(n.leadId) || []
    a.push(n); notifByLead.set(n.leadId, a)
  }

  const rows: Array<{
    lead: typeof neverRouted[0]
    provider: typeof provs[0]
    dist: number
    klass: Klass
    note: string
  }> = []

  for (const l of neverRouted) {
    if (!l.zip) continue
    const leadGeo = getZipInfo(l.zip)

    // Who is in radius today?
    const inRange = provs
      .map(p => {
        const z = (p.zipCodes || '').split(',').map(s => s.trim()).filter(s => s.length >= 5)[0]
        if (!z) return null
        const d = getDistanceBetweenZips(z, l.zip!)
        if (d === null) return null
        return d <= (p.serviceRadiusMiles || 25) ? { p, d } : null
      })
      .filter(Boolean) as Array<{ p: typeof provs[0]; d: number }>

    if (inRange.length === 0) continue  // genuine coverage gap, not in this set
    inRange.sort((a, b) => a.d - b.d)
    const { p, d } = inRange[0]

    const notifs = notifByLead.get(l.id) || []
    const failed = notifs.filter(n => n.status === 'FAILED')

    // Would the state filter have passed? Routing compares ABBRs exactly.
    const covAbbrs = p.coverage.map(c => c.state.abbr)
    const stateOk = covAbbrs.includes(l.state) || p.primaryState === l.state

    // Would the provider have matched if every State.abbr were clean? If their
    // coverage names resolve to the lead's state, the corrupted abbr is what
    // blocked it. If not, they simply never claimed that state.
    const covResolved = p.coverage.map(c =>
      c.state.abbr.length === 2 ? c.state.abbr : (nameToAbbr.get(c.state.name.toLowerCase()) || c.state.abbr)
    )
    const wouldMatchIfClean = covResolved.includes(l.state) || p.primaryState === l.state

    // Inferred: was this provider live yet?
    const fn = firstNotif.get(p.id)
    const notYetLive = p.createdAt > l.createdAt || (fn ? fn > l.createdAt : true)

    let klass: Klass
    let note = ''
    if (failed.length > 0) {
      klass = 'SEND_ATTEMPTED_FAILED'
      note = failed[0].errorMessage?.slice(0, 60) || 'no error text'
    } else if (!leadGeo) {
      klass = 'LEAD_ZIP_NOT_GEOCODABLE'
      note = `zip ${l.zip} absent from geocode table`
    } else if (!stateOk && wouldMatchIfClean) {
      klass = 'STATE_ABBR_CORRUPTED'
      note = `lead "${l.state}"; coverage abbr=[${covAbbrs.join(',')}] resolves to [${covResolved.join(',')}]`
    } else if (!stateOk) {
      klass = 'CROSS_STATE_NO_COVERAGE'
      note = `lead "${l.state}"; provider covers ${p.primaryState}/[${covResolved.join(',')}] — radius reaches, coverage does not`
    } else if (['NEEDS_COVERAGE', 'CLOSED_UNCONFIRMED', 'CLOSED_DUPLICATE', 'CLOSED_PRICING_ONLY'].includes(l.status)) {
      klass = 'NOTIFY_NEVER_INVOKED'
      note = `status ${l.status} — never entered the notify path`
    } else if (notYetLive) {
      klass = 'PROVIDER_NOT_YET_ELIGIBLE'
      note = `provider created ${p.createdAt.toISOString().slice(0, 10)}` +
             (fn ? `, first notified ${fn.toISOString().slice(0, 10)}` : ', never notified')
    } else {
      klass = 'UNEXPLAINED'
      note = notifs.length ? `${notifs.length} notif row(s), none failed` : 'no notification rows at all'
    }

    rows.push({ lead: l, provider: p, dist: d, klass, note })
  }

  // ── Assertion: does routing touch city names at all? ──
  const src = require('fs').readFileSync('lib/leadNotifications.ts', 'utf-8')
  const fnBody = src.slice(src.indexOf('async function findFeaturedProvidersForNotification'), src.indexOf('export async function notifyFeaturedProvidersForLead'))
  const usesCityName = /city\s*\.\s*name|citySlug|city\.slug/.test(fnBody)
  console.log('═'.repeat(104))
  console.log('PRE-CHECK — does the routing predicate match on city name/slug?')
  console.log(`  ${usesCityName ? '⚠ YES' : 'NO'} — whitespace-corrupted city names ${usesCityName ? 'COULD' : 'CANNOT'} affect routing.`)
  console.log('═'.repeat(104))

  console.log(`\nLeads never routed (180d): ${neverRouted.length}`)
  console.log(`Of those, ≥1 provider in radius TODAY: ${rows.length}\n`)

  console.log('LEAD ID'.padEnd(28) + 'CITY'.padEnd(22) + 'DATE'.padEnd(12) + 'MATCHED PROVIDER'.padEnd(34) + 'FAILURE CLASS')
  console.log('─'.repeat(126))
  for (const r of rows) {
    console.log(
      r.lead.id.padEnd(28) +
      `${r.lead.city}, ${r.lead.state}`.slice(0, 21).padEnd(22) +
      r.lead.createdAt.toISOString().slice(0, 10).padEnd(12) +
      `${r.provider.name} (${r.dist.toFixed(0)}mi)`.slice(0, 33).padEnd(34) +
      r.klass
    )
  }

  const byClass = new Map<Klass, number>()
  for (const r of rows) byClass.set(r.klass, (byClass.get(r.klass) || 0) + 1)
  console.log(`\n${'═'.repeat(104)}`)
  console.log('FAILURE CLASS TOTALS')
  console.log('═'.repeat(104))
  for (const [k, n] of [...byClass.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(30)} ${String(n).padStart(3)}  ${'█'.repeat(n)}`)
  }

  console.log('\nSAMPLE NOTES PER CLASS')
  for (const k of byClass.keys()) {
    const ex = rows.filter(r => r.klass === k).slice(0, 3)
    console.log(`\n  ${k}`)
    for (const e of ex) console.log(`    ${e.lead.city}, ${e.lead.state} ${e.lead.createdAt.toISOString().slice(0, 10)} — ${e.note}`)
  }

  // Supporting counts
  const badState = leads.filter(l => l.state.length !== 2 || l.state !== l.state.toUpperCase())
  console.log(`\n── SUPPORTING ──`)
  console.log(`  Leads (all, 180d) whose state is not a clean 2-letter abbr: ${badState.length}`)
  if (badState.length) console.log(`     e.g. ${[...new Set(badState.map(l => l.state))].slice(0, 10).join(' | ')}`)
  const ungeocodable = leads.filter(l => l.zip && !getZipInfo(l.zip))
  console.log(`  Leads whose ZIP is not in the geocode table: ${ungeocodable.length}`)
  const failedAll = await prisma.leadNotification.count({ where: { status: 'FAILED' } })
  console.log(`  leadNotification rows with status FAILED (all time): ${failedAll}`)

  // Status breakdown of the never-invoked class — which gate killed them.
  const invoked = rows.filter(r => r.klass === 'NOTIFY_NEVER_INVOKED')
  const byStatus = new Map<string, number>()
  for (const r of invoked) byStatus.set(r.lead.status, (byStatus.get(r.lead.status) || 0) + 1)
  console.log(`\n  NOTIFY_NEVER_INVOKED by lead status:`)
  for (const [s, n] of [...byStatus.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`     ${s.padEnd(24)} ${n}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
