// Read-only supplement to lead-diagnostic-30d.ts (2026-09-21): the cuts that
// decide whether and how leads can be monetized.
//   npx tsx scripts/lead-monetization-cuts.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const D = 864e5
const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) + '%' : '-')
const WON = ['APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED']
const tally = <T,>(rows: T[], key: (r: T) => string) => {
  const m = new Map<string, number>()
  for (const r of rows) m.set(key(r), (m.get(key(r)) || 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')
}

async function main() {
  const now = Date.now()
  const d30 = new Date(now - 30 * D)
  const d90 = new Date(now - 90 * D)
  const leads90 = await prisma.lead.findMany({
    where: { createdAt: { gte: d90 }, status: { not: 'CLOSED_DUPLICATE' } },
    select: { id: true, createdAt: true, city: true, state: true, status: true, outcome: true, routedToId: true, claimedAt: true, paymentMethod: true, hasDoctorOrder: true, attributionSource: true, isHighValue: true, estimatedValueCents: true, patientOutcome: true, labPreference: true },
  })
  const leads30 = leads90.filter(l => l.createdAt >= d30)
  const paid = await prisma.provider.findMany({ where: { isFeatured: true, removedAt: null }, select: { id: true, name: true, featuredTier: true, primaryCity: true, primaryState: true, stripeCustomerId: true } })
  const paidIds = new Set(paid.map(p => p.id))
  const notes90 = await prisma.leadNotification.findMany({ where: { createdAt: { gte: d90 }, status: 'SENT' }, select: { providerId: true, leadId: true, createdAt: true } })

  console.log(`\n=== A. PAYING PROVIDERS: ${paid.length} (with a Stripe customer: ${paid.filter(p => p.stripeCustomerId).length}) ===`)
  for (const p of paid) {
    const sent30 = new Set(notes90.filter(n => n.providerId === p.id && n.createdAt >= d30).map(n => n.leadId)).size
    const sent90 = new Set(notes90.filter(n => n.providerId === p.id).map(n => n.leadId)).size
    const c30 = leads30.filter(l => l.routedToId === p.id)
    const c90 = leads90.filter(l => l.routedToId === p.id)
    const won = (rows: typeof c30) => rows.filter(l => WON.includes(l.outcome || '')).length
    console.log(`  ${p.name.trim().slice(0, 34).padEnd(34)} ${(p.primaryCity + ',' + p.primaryState).padEnd(22)} ${String(p.featuredTier).padEnd(17)} 30d sent ${String(sent30).padStart(2)} claimed ${String(c30.length).padStart(2)} won ${won(c30)} | 90d sent ${String(sent90).padStart(3)} claimed ${String(c90.length).padStart(2)} won ${won(c90)}`)
  }

  const claimed30 = leads30.filter(l => l.routedToId)
  const byPaid = claimed30.filter(l => paidIds.has(l.routedToId!))
  console.log(`\n=== B. WHO CLAIMS (30d) ===`)
  console.log(`  ${claimed30.length} claims; by paying providers ${byPaid.length} (${pct(byPaid.length, claimed30.length)}); wins by paying ${byPaid.filter(l => WON.includes(l.outcome || '')).length} of ${claimed30.filter(l => WON.includes(l.outcome || '')).length}`)
  const leadsWithPaid = new Set(notes90.filter(n => paidIds.has(n.providerId) && n.createdAt >= d30).map(n => n.leadId))
  const inBatch = leads30.filter(l => leadsWithPaid.has(l.id))
  console.log(`  leads with a paying provider in the batch: ${inBatch.length} of ${leads30.length}; claimed by the paying one ${inBatch.filter(l => l.routedToId && paidIds.has(l.routedToId)).length}; by a free one ${inBatch.filter(l => l.routedToId && !paidIds.has(l.routedToId)).length}; unclaimed ${inBatch.filter(l => !l.routedToId).length}`)

  const free = new Map<string, { n: number; won: number }>()
  for (const l of leads90) {
    if (!l.routedToId || paidIds.has(l.routedToId)) continue
    const f = free.get(l.routedToId) || { n: 0, won: 0 }
    f.n++
    if (WON.includes(l.outcome || '')) f.won++
    free.set(l.routedToId, f)
  }
  const top = [...free.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 12)
  const names = await prisma.provider.findMany({ where: { id: { in: top.map(t => t[0]) } }, select: { id: true, name: true, primaryCity: true, primaryState: true } })
  console.log(`\n=== C. FREE PROVIDERS WITH THE MOST CLAIMS (90d): upgrade targets ===`)
  for (const [id, f] of top) {
    const p = names.find(n => n.id === id)
    console.log(`  ${(p?.name || id).trim().slice(0, 36).padEnd(36)} ${(p?.primaryCity + ',' + p?.primaryState).padEnd(22)} claims ${String(f.n).padStart(2)}  won ${f.won}`)
  }
  console.log(`  free providers with 3+ claims in 90d: ${[...free.values()].filter(f => f.n >= 3).length}; with at least one win: ${[...free.values()].filter(f => f.won >= 1).length}; distinct free claimers: ${free.size}`)

  console.log(`\n=== D. DEMAND BY STATE (90d) vs paying supply ===`)
  const byState = new Map<string, { n: number; claimed: number; won: number; nocov: number }>()
  for (const l of leads90) {
    const s = byState.get(l.state) || { n: 0, claimed: 0, won: 0, nocov: 0 }
    s.n++
    if (l.routedToId) s.claimed++
    if (WON.includes(l.outcome || '')) s.won++
    if (l.status === 'NEEDS_COVERAGE') s.nocov++
    byState.set(l.state, s)
  }
  for (const [st, s] of [...byState.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 14)) {
    console.log(`  ${st.padEnd(3)} leads ${String(s.n).padStart(3)}  claimed ${pct(s.claimed, s.n).padStart(4)}  won ${String(s.won).padStart(2)}  no-coverage ${String(s.nocov).padStart(2)}  paying providers ${paid.filter(p => p.primaryState === st).length}`)
  }

  console.log(`\n=== E. PATIENT-REPORTED OUTCOMES (90d) ===`)
  const po = leads90.filter(l => l.patientOutcome)
  console.log(`  ${po.length} answered: ${tally(po, l => String(l.patientOutcome))}`)

  console.log(`\n=== F. STUCK MID-FUNNEL (claimed, soft outcome, older than 3 days) ===`)
  const soft = ['WORKING_IT', 'TEXT_SENT', 'EMAIL_SENT', 'VOICEMAIL', 'NO_ANSWER', 'SCHEDULED_CALLBACK']
  const mid = leads90.filter(l => l.routedToId && soft.includes(l.outcome || '') && l.claimedAt && now - l.claimedAt.getTime() > 3 * D)
  console.log(`  ${mid.length} leads: ${tally(mid, l => String(l.outcome))}`)
  console.log(`  of those, claimed by a paying provider: ${mid.filter(l => paidIds.has(l.routedToId!)).length}`)

  console.log(`\n=== G. INSTITUTIONAL / HIGH-VALUE (90d) ===`)
  const hv = leads90.filter(l => l.isHighValue || l.status === 'INSTITUTIONAL_REVIEW')
  console.log(`  ${hv.length} leads; est value $${Math.round(hv.reduce((n, l) => n + (l.estimatedValueCents || 0), 0) / 100)}; statuses: ${tally(hv, l => l.status)}`)

  console.log(`\n=== H. MONTHLY VOLUME ===`)
  const all = await prisma.lead.findMany({ where: { status: { not: 'CLOSED_DUPLICATE' } }, select: { createdAt: true, routedToId: true, outcome: true } })
  const months = new Map<string, { n: number; c: number; w: number }>()
  for (const l of all) {
    const k = l.createdAt.toISOString().slice(0, 7)
    const m = months.get(k) || { n: 0, c: 0, w: 0 }
    m.n++
    if (l.routedToId) m.c++
    if (WON.includes(l.outcome || '')) m.w++
    months.set(k, m)
  }
  for (const [k, m] of [...months.entries()].sort()) console.log(`  ${k}  leads ${String(m.n).padStart(3)}  claimed ${String(m.c).padStart(3)}  won ${String(m.w).padStart(3)}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
