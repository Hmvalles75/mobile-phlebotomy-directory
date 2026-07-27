/**
 * Internal analysis: lead update, recruiting-market ranking, provider non-responders.
 * Read-only. Provider names included (internal use, not the newsletter).
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const WINDOW_START = new Date('2026-06-02T00:00:00.000Z')
const NOW = new Date()
const D30 = new Date(NOW.getTime() - 30 * 86_400_000)
const D7 = new Date(NOW.getTime() - 7 * 86_400_000)
const EXCLUDED = ['CLOSED_DUPLICATE', 'CLOSED_PRICING_ONLY', 'CLOSED_UNCONFIRMED']

async function main() {
  const all = await prisma.lead.findMany({
    where: { createdAt: { gte: WINDOW_START } },
    select: {
      id: true, createdAt: true, city: true, state: true, zip: true, status: true,
      routedToId: true, claimedAt: true, releasedAt: true, staleReleaseCount: true,
      routedProviderIds: true, phone: true,
    },
  })

  // Intake has no dedup: one Mililani HI submitter created 13 separate OPEN rows
  // in two days. Counting raw rows as "demand" massively overstates thin markets,
  // so market sizing below uses DISTINCT PEOPLE (normalized phone), not rows.
  const normPhone = (p: string) => (p || '').replace(/\D/g, '').slice(-10)
  const distinctPeople = (rows: { phone: string; state: string }[]) => {
    const s = new Set<string>()
    for (const r of rows) s.add(normPhone(r.phone) || `unknown:${Math.random()}`)
    return s.size
  }
  const leads = all.filter(l => !EXCLUDED.includes(String(l.status)))
  const abandoned = (l: any) => l.releasedAt !== null || l.staleReleaseCount > 0
  const claimedNow = leads.filter(l => l.routedToId !== null && !abandoned(l))
  const unclaimed = leads.filter(l => !(l.routedToId !== null && !abandoned(l)))

  console.log('='.repeat(94))
  console.log('1. LEAD UPDATE')
  console.log('='.repeat(94))
  console.log(`Window 2026-06-02 → ${NOW.toISOString().slice(0, 10)}: ${leads.length} leads`)
  console.log(`  last 30 days: ${leads.filter(l => l.createdAt >= D30).length}`)
  console.log(`  last  7 days: ${leads.filter(l => l.createdAt >= D7).length}`)
  console.log(`  claimed (held): ${claimedNow.length}  |  unclaimed or released: ${unclaimed.length}`)
  const everClaimed = leads.filter(l => l.claimedAt || l.routedToId || l.releasedAt || l.staleReleaseCount > 0)
  console.log(`  ever touched by a provider: ${everClaimed.length} (${((everClaimed.length / leads.length) * 100).toFixed(1)}%)`)
  const neverRouted = leads.filter(l => l.routedProviderIds.length === 0)
  console.log(`  never routed to ANY provider: ${neverRouted.length} (${((neverRouted.length / leads.length) * 100).toFixed(1)}%)`)

  // ---- 2. Recruiting markets ----
  console.log('\n' + '='.repeat(94))
  console.log('2. RECRUITING MARKETS — demand vs supply by state')
  console.log('='.repeat(94))

  const provAll = await prisma.provider.groupBy({
    by: ['primaryState'],
    where: { removedAt: null },
    _count: { _all: true },
  })
  const provEligible = await prisma.provider.groupBy({
    by: ['primaryState'],
    where: { removedAt: null, eligibleForLeads: true, status: 'VERIFIED' },
    _count: { _all: true },
  })
  const totalByState = new Map(provAll.map(r => [r.primaryState || '?', r._count._all]))
  const eligByState = new Map(provEligible.map(r => [r.primaryState || '?', r._count._all]))

  const byStateRows = new Map<string, typeof unclaimed>()
  for (const l of unclaimed) {
    if (!byStateRows.has(l.state)) byStateRows.set(l.state, [])
    byStateRows.get(l.state)!.push(l)
  }
  const totalDemand = new Map<string, number>()
  for (const l of leads) totalDemand.set(l.state, (totalDemand.get(l.state) || 0) + 1)

  const rows = [...byStateRows.entries()]
    .filter(([s]) => /^[A-Z]{2}$/.test(s))
    .map(([state, rs]) => {
      const elig = eligByState.get(state) ?? 0
      const total = totalByState.get(state) ?? 0
      const people = distinctPeople(rs)
      return {
        state,
        unclaimed: rs.length,
        people,
        dupInflation: rs.length - people,
        allLeads: totalDemand.get(state) ?? 0,
        eligible: elig,
        directory: total,
        dormant: total - elig,
        // Distinct unserved PEOPLE per eligible provider — higher = more starved
        ratio: elig === 0 ? Infinity : +(people / elig).toFixed(2),
      }
    })
    .sort((a, b) => b.people - a.people)

  const HDR = 'state  PEOPLE  rawRows  dupes  eligible  inDirectory  dormant  people/eligible'
  const line = (r: typeof rows[number]) =>
    `  ${r.state}     ${String(r.people).padStart(4)}    ${String(r.unclaimed).padStart(5)}  ${String(r.dupInflation).padStart(5)}    ${String(r.eligible).padStart(5)}       ${String(r.directory).padStart(5)}    ${String(r.dormant).padStart(5)}      ${r.ratio === Infinity ? '—' : r.ratio}`

  console.log('\nRECRUIT (zero eligible providers) — ranked by DISTINCT unserved people:')
  console.log(HDR)
  for (const r of rows.filter(r => r.eligible === 0).sort((a, b) => b.people - a.people)) console.log(line(r))

  console.log('\nSTARVED (eligible providers exist, ≥3 distinct unserved people):')
  console.log(HDR)
  for (const r of rows.filter(r => r.eligible > 0 && r.people >= 3).sort((a, b) => b.ratio - a.ratio)) console.log(line(r))

  console.log('\nOVERSUPPLIED (for contrast — do NOT recruit here):')
  for (const r of rows.filter(r => r.eligible >= 10 && r.ratio < 1).sort((a, b) => a.ratio - b.ratio).slice(0, 6)) {
    console.log(`  ${r.state}  unclaimed=${r.unclaimed}  eligible=${r.eligible}  ratio=${r.ratio}`)
  }

  // City concentration within the top recruit states
  console.log('\nTOP CITIES BY UNCLAIMED DEMAND:')
  const byCity = new Map<string, { n: number; state: string; zips: Set<string>; phones: Set<string>; people: number }>()
  for (const l of unclaimed) {
    const k = `${l.city}, ${l.state}`
    if (!byCity.has(k)) byCity.set(k, { n: 0, state: l.state, zips: new Set(), phones: new Set(), people: 0 })
    const e = byCity.get(k)!
    e.n++
    e.zips.add(l.zip)
    e.phones.add(normPhone(l.phone))
  }
  for (const e of byCity.values()) e.people = e.phones.size
  for (const [k, e] of [...byCity.entries()].sort((a, b) => b[1].people - a[1].people || b[1].n - a[1].n).slice(0, 15)) {
    console.log(`  people=${String(e.people).padStart(2)} rows=${String(e.n).padStart(3)}  ${k.padEnd(26)} eligibleInState=${eligByState.get(e.state) ?? 0}  zips=${[...e.zips].slice(0, 3).join(',')}`)
  }

  // ---- 3. Non-responders ----
  console.log('\n' + '='.repeat(94))
  console.log('3. PROVIDERS EMAILED BUT NOT RESPONDING (window)')
  console.log('='.repeat(94))

  const leadIds = leads.map(l => l.id)
  const notifs = await prisma.leadNotification.findMany({
    where: { leadId: { in: leadIds }, status: 'SENT' },
    select: { providerId: true, leadId: true },
  })
  const sentByProvider = new Map<string, Set<string>>()
  for (const n of notifs) {
    if (!sentByProvider.has(n.providerId)) sentByProvider.set(n.providerId, new Set())
    sentByProvider.get(n.providerId)!.add(n.leadId)
  }
  const claimsByProvider = new Map<string, number>()
  for (const l of leads) if (l.routedToId) claimsByProvider.set(l.routedToId, (claimsByProvider.get(l.routedToId) || 0) + 1)

  const provs = await prisma.provider.findMany({
    where: { id: { in: [...sentByProvider.keys()] } },
    select: {
      id: true, name: true, email: true, claimEmail: true, notificationEmail: true,
      primaryCity: true, primaryState: true, isFeatured: true, listingTier: true,
      eligibleForLeads: true, createdAt: true,
    },
  })
  const pById = new Map(provs.map(p => [p.id, p]))

  const ranked = [...sentByProvider.entries()]
    .map(([id, set]) => ({ id, sent: set.size, claims: claimsByProvider.get(id) || 0, p: pById.get(id) }))
    .sort((a, b) => b.sent - a.sent)

  console.log(`\nProviders who received ≥1 SENT notification in window: ${ranked.length}`)
  console.log(`Total SENT notifications: ${notifs.length}`)
  const zero = ranked.filter(r => r.claims === 0)
  console.log(`Received notifications but claimed NOTHING: ${zero.length}`)
  console.log(`  …notifications wasted on them: ${zero.reduce((s, r) => s + r.sent, 0)}`)

  console.log('\nWORST OFFENDERS (most notifications, zero claims):')
  console.log('sent  claims  provider')
  for (const r of zero.sort((a, b) => b.sent - a.sent).slice(0, 20)) {
    const p = r.p
    console.log(`${String(r.sent).padStart(4)}  ${String(r.claims).padStart(6)}  ${(p?.name || r.id).slice(0, 40).padEnd(40)} ${p?.primaryCity || '?'}, ${p?.primaryState || '?'}  ${p?.isFeatured ? 'FEATURED' : p?.listingTier}`)
  }

  console.log('\nRESPONDERS (claimed at least one):')
  console.log('sent  claims  rate   provider')
  for (const r of ranked.filter(r => r.claims > 0).sort((a, b) => b.claims - a.claims).slice(0, 15)) {
    const p = r.p
    const rate = r.sent ? ((r.claims / r.sent) * 100).toFixed(0) + '%' : '—'
    console.log(`${String(r.sent).padStart(4)}  ${String(r.claims).padStart(6)}  ${rate.padStart(5)}  ${(p?.name || r.id).slice(0, 40).padEnd(40)} ${p?.primaryCity || '?'}, ${p?.primaryState || '?'}`)
  }

  // Featured providers who aren't responding — these are PAYING
  const featuredZero = zero.filter(r => r.p?.isFeatured)
  console.log(`\nFEATURED/paying providers with notifications and zero claims: ${featuredZero.length}`)
  for (const r of featuredZero) console.log(`  ${r.p?.name} — ${r.sent} sent, 0 claims (${r.p?.primaryCity}, ${r.p?.primaryState})`)
}

main().catch(e => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
