// 30-day lead diagnostic. Read-only. Run: npx tsx scripts/lead-diagnostic-30d.ts
//
// Combines the funnel from lead-insights-30d.ts and audit-leads-14d.ts with
// the failure-mode views those scripts skip: coverage failures by state,
// notification fan-out (how many providers each lead actually reached),
// per-provider claim/outcome behaviour, stale releases, delivery health, and
// the patient-confirmation signal. Every section is a candidate root cause,
// not just a stat.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { FAILED_CONTACT_OUTCOMES } from '../lib/leadOutcomes'

const prisma = new PrismaClient()
const DAYS = Number(process.env.DAYS || 30)
const NOW = new Date()
const START = new Date(NOW.getTime() - DAYS * 86400000)
const PREV_START = new Date(START.getTime() - DAYS * 86400000)

const BOOKED = new Set(['APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED'])
const FAILED_CONTACT = new Set<string>(FAILED_CONTACT_OUTCOMES as readonly string[])
const MID_FUNNEL = new Set(['CONTACTED', 'WORKING_IT', 'TEXT_SENT', 'EMAIL_SENT', 'SCHEDULED_CALLBACK'])
const TERMINAL_BAD = new Set(['DECLINED', 'DUPLICATE', 'NOT_INTERESTED', 'OUTSIDE_SERVICE_AREA', 'NO_AVAILABILITY', 'WRONG_SERVICE', 'NO_ORDER'])
const SPAM_STATUSES = new Set(['CLOSED_DUPLICATE', 'CLOSED_PRICING_ONLY', 'CLOSED_UNCONFIRMED'])

const pct = (n: number, d: number) => d ? `${Math.round(100 * n / d)}%` : '—'
const day = (d: Date) => d.toISOString().slice(0, 10)
const hrs = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 3600000
const fmtH = (h: number) => h < 1 ? `${Math.round(h * 60)}m` : h < 48 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`
const pad = (s: any, n: number) => String(s).padStart(n)
const padE = (s: any, n: number) => String(s).slice(0, n).padEnd(n)
const median = (xs: number[]) => xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : NaN
function tally<T>(xs: T[], key: (x: T) => string) {
  const m = new Map<string, number>()
  for (const x of xs) { const k = key(x); m.set(k, (m.get(k) || 0) + 1) }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
function h(title: string) { console.log(`\n${'─'.repeat(88)}\n${title}\n${'─'.repeat(88)}`) }

// patient dedup (phone/email union-find) — same as audit-leads-14d
const normPhone = (s?: string | null) => (s || '').replace(/\D/g, '').slice(-10)
const normEmail = (s?: string | null) => (s || '').trim().toLowerCase()
function groupByPatient<T extends { id: string; phone: string; email: string | null }>(leads: T[]) {
  const parent = new Map<string, string>()
  const root = (x: string): string => { let p = parent.get(x) || x; while (p !== (parent.get(p) || p)) p = parent.get(p) || p; return p }
  const union = (a: string, b: string) => { const ra = root(a), rb = root(b); if (ra !== rb) parent.set(ra, rb) }
  const byPhone = new Map<string, string>(), byEmail = new Map<string, string>()
  for (const l of leads) {
    const p = normPhone(l.phone), e = normEmail(l.email)
    if (p.length === 10) { if (byPhone.has(p)) union(byPhone.get(p)!, l.id); else byPhone.set(p, l.id) }
    if (e) { if (byEmail.has(e)) union(byEmail.get(e)!, l.id); else byEmail.set(e, l.id) }
  }
  const groups = new Map<string, T[]>()
  for (const l of leads) { const r = root(l.id); if (!groups.has(r)) groups.set(r, []); groups.get(r)!.push(l) }
  return [...groups.values()]
}

async function main() {
  const select = {
    id: true, createdAt: true, claimedAt: true, routedAt: true, completedAt: true, firstContactAt: true,
    fullName: true, phone: true, email: true, city: true, state: true, zip: true,
    urgency: true, status: true, outcome: true, outcomeNotes: true, callAttempts: true,
    source: true, attributionSource: true, landingPage: true,
    isHighValue: true, estimatedValueCents: true, drawCount: true, requestType: true,
    hasDoctorOrder: true, paymentMethod: true, organizationName: true,
    routedToId: true, routedProviderIds: true, preferredProviderId: true,
    releasedAt: true, releaseReason: true, releasedFromProviderId: true, staleReleaseCount: true,
    statEscalatedAt: true, notificationBatchId: true,
    provider: { select: { id: true, name: true, listingTier: true, priorityRouting: true, eligibleForLeads: true } },
    leadNotifications: { select: { providerId: true, status: true, sentAt: true, createdAt: true, errorMessage: true, passedAt: true, provider: { select: { name: true, email: true } } } },
  } as const

  const [leads, prev] = await Promise.all([
    prisma.lead.findMany({ where: { createdAt: { gte: START } }, select, orderBy: { createdAt: 'desc' } }),
    prisma.lead.findMany({ where: { createdAt: { gte: PREV_START, lt: START } }, select: { id: true, claimedAt: true, outcome: true, status: true, completedAt: true } }),
  ])

  console.log(`LEAD DIAGNOSTIC — ${DAYS} days  (${day(START)} → ${day(NOW)})   prior window ${day(PREV_START)} → ${day(START)}`)

  // ── 1. Funnel ──────────────────────────────────────────────────────────────
  h('1. FUNNEL (raw rows, then unique patients)   [vs prior window]')
  const real = leads.filter(l => !SPAM_STATUSES.has(l.status))
  const f = (xs: typeof leads | typeof prev) => ({
    created: xs.length,
    claimed: xs.filter(l => l.claimedAt).length,
    outcome: xs.filter(l => l.outcome).length,
    booked: xs.filter(l => l.outcome && BOOKED.has(l.outcome)).length,
    completed: xs.filter(l => l.outcome === 'APPOINTMENT_COMPLETED' || l.completedAt).length,
  })
  const cur = f(leads), pr = f(prev)
  const row = (label: string, a: number, b: number, d: number, dp: number) =>
    console.log(`  ${padE(label, 26)} ${pad(a, 4)}  ${pad(pct(a, d), 5)}     [${pad(b, 4)}  ${pad(pct(b, dp), 5)}]`)
  row('Created', cur.created, pr.created, cur.created, pr.created)
  row('Claimed', cur.claimed, pr.claimed, cur.created, pr.created)
  row('Any outcome logged', cur.outcome, pr.outcome, cur.created, pr.created)
  row('Booked', cur.booked, pr.booked, cur.created, pr.created)
  row('Completed', cur.completed, pr.completed, cur.created, pr.created)
  console.log(`  Claimed→Booked ${pct(cur.booked, cur.claimed)}  [${pct(pr.booked, pr.claimed)}]   Booked→Completed ${pct(cur.completed, cur.booked)}  [${pct(pr.completed, pr.booked)}]`)

  const groups = groupByPatient(leads)
  const uClaimed = groups.filter(g => g.some(l => l.claimedAt)).length
  const uBooked = groups.filter(g => g.some(l => l.outcome && BOOKED.has(l.outcome))).length
  const uCompleted = groups.filter(g => g.some(l => l.outcome === 'APPOINTMENT_COMPLETED' || l.completedAt)).length
  const resub = groups.filter(g => g.length > 1)
  console.log(`\n  Unique patients ${groups.length}  (${resub.length} re-submitters, ${leads.length - groups.length} extra rows)`)
  console.log(`  Claimed ${uClaimed} (${pct(uClaimed, groups.length)})   Booked ${uBooked} (${pct(uBooked, groups.length)})   Completed ${uCompleted} (${pct(uCompleted, groups.length)})`)
  if (resub.length) {
    console.log(`  Re-submitters (count × name, city — statuses):`)
    for (const g of resub.sort((a, b) => b.length - a.length).slice(0, 8))
      console.log(`    ${g.length}× ${padE(g[0].fullName, 24)} ${g[0].city},${g[0].state} — ${g.map(l => l.status).join(', ')}`)
  }

  // ── 2. Weekly trend ────────────────────────────────────────────────────────
  h('2. WEEKLY TREND (wk0 = most recent 7 days)')
  const wk = (d: Date) => Math.min(Math.floor(hrs(d, NOW) / 168), Math.ceil(DAYS / 7) - 1)
  const nW = Math.ceil(DAYS / 7)
  const W = Array.from({ length: nW }, () => ({ created: 0, claimed: 0, booked: 0, stat: 0, nocov: 0 }))
  for (const l of leads) {
    const w = W[wk(l.createdAt)]
    w.created++; if (l.claimedAt) w.claimed++; if (l.outcome && BOOKED.has(l.outcome)) w.booked++
    if (l.urgency === 'STAT') w.stat++; if (l.status === 'NEEDS_COVERAGE') w.nocov++
  }
  console.log(`  ${'      '}${W.map((_, i) => pad('wk' + i, 7)).join('')}`)
  for (const k of ['created', 'claimed', 'booked', 'stat', 'nocov'] as const) console.log(`  ${padE(k, 8)}${W.map(w => pad(w[k], 7)).join('')}`)
  console.log(`  claim% ${W.map(w => pad(pct(w.claimed, w.created), 7)).join('')}`)

  // ── 3. Status ──────────────────────────────────────────────────────────────
  h('3. CURRENT STATUS of every lead in window')
  for (const [s, c] of tally(leads, l => l.status)) console.log(`  ${pad(c, 4)}  ${pad(pct(c, leads.length), 4)}  ${s}`)

  // ── 4. Coverage failures ───────────────────────────────────────────────────
  h('4. NEVER REACHED A PROVIDER (no notifications sent)')
  const sentCount = (l: typeof leads[0]) => l.leadNotifications.filter(n => n.status === 'SENT').length
  const unreached = leads.filter(l => sentCount(l) === 0 && !SPAM_STATUSES.has(l.status))
  console.log(`  ${unreached.length} of ${leads.length} leads (${pct(unreached.length, leads.length)}) had zero SENT notifications`)
  console.log(`  by status: ${tally(unreached, l => l.status).map(([s, c]) => `${s}=${c}`).join('  ')}`)
  console.log(`  by state:`)
  for (const [st, c] of tally(unreached, l => l.state).slice(0, 15)) {
    const cities = tally(unreached.filter(l => l.state === st), l => l.city).slice(0, 4).map(([ci, n]) => n > 1 ? `${ci}×${n}` : ci).join(', ')
    console.log(`    ${pad(c, 3)}  ${padE(st, 4)} ${cities}`)
  }
  const unreachedQueuedOrFailed = unreached.filter(l => l.leadNotifications.length > 0)
  if (unreachedQueuedOrFailed.length) {
    console.log(`  ⚠ ${unreachedQueuedOrFailed.length} of these HAVE notification rows that never reached SENT:`)
    for (const l of unreachedQueuedOrFailed.slice(0, 10))
      console.log(`    ${l.id} ${l.city},${l.state} ${l.status}  ${l.leadNotifications.map(n => `${n.status}${n.errorMessage ? ':' + n.errorMessage.slice(0, 40) : ''}`).join(' | ')}`)
  }
  const nocovHV = unreached.filter(l => l.isHighValue)
  if (nocovHV.length) console.log(`  ⚠ ${nocovHV.length} high-value leads never reached a provider: ${nocovHV.map(l => `${l.organizationName || l.fullName} (${l.city},${l.state}, $${l.estimatedValueCents / 100})`).join('; ')}`)

  // ── 5. Fan-out ─────────────────────────────────────────────────────────────
  h('5. NOTIFICATION FAN-OUT (providers reached per lead → claim rate)')
  const reached = leads.filter(l => sentCount(l) > 0)
  const bucket = (n: number) => n === 1 ? '1' : n === 2 ? '2' : n <= 4 ? '3-4' : n <= 8 ? '5-8' : '9+'
  const fanout = new Map<string, { n: number; claimed: number; booked: number }>()
  for (const l of reached) {
    const b = bucket(sentCount(l)); if (!fanout.has(b)) fanout.set(b, { n: 0, claimed: 0, booked: 0 })
    const x = fanout.get(b)!; x.n++; if (l.claimedAt) x.claimed++; if (l.outcome && BOOKED.has(l.outcome)) x.booked++
  }
  console.log(`  ${'reached'.padEnd(9)} leads  claim%  booked%`)
  for (const b of ['1', '2', '3-4', '5-8', '9+']) { const x = fanout.get(b); if (x) console.log(`  ${b.padEnd(9)} ${pad(x.n, 5)}  ${pad(pct(x.claimed, x.n), 6)}  ${pad(pct(x.booked, x.n), 7)}`) }
  const med = median(reached.map(sentCount))
  console.log(`  median providers reached per lead: ${med}`)
  const ignored = reached.filter(l => !l.claimedAt && !SPAM_STATUSES.has(l.status))
  console.log(`  Reached but NEVER claimed: ${ignored.length} (${pct(ignored.length, reached.length)} of reached)  status: ${tally(ignored, l => l.status).map(([s, c]) => `${s}=${c}`).join(' ')}`)
  // Which providers were notified most and ignored most
  const provNotif = new Map<string, { name: string; email: string | null; notified: number; claimed: number; passed: number }>()
  for (const l of leads) for (const n of l.leadNotifications) {
    if (n.status !== 'SENT') continue
    if (!provNotif.has(n.providerId)) provNotif.set(n.providerId, { name: n.provider.name.trim(), email: n.provider.email, notified: 0, claimed: 0, passed: 0 })
    const x = provNotif.get(n.providerId)!; x.notified++; if (l.routedToId === n.providerId && l.claimedAt) x.claimed++; if (n.passedAt) x.passed++
  }
  const silent = [...provNotif.values()].filter(x => x.notified >= 3 && x.claimed === 0).sort((a, b) => b.notified - a.notified)
  console.log(`\n  Providers notified ≥3× with ZERO claims (${silent.length}):`)
  for (const x of silent.slice(0, 20)) console.log(`    ${pad(x.notified, 3)} notified  ${padE(x.name, 36)} ${x.email || '(no email)'}`)

  // ── 6. Delivery health ─────────────────────────────────────────────────────
  h('6. EMAIL DELIVERY HEALTH (LeadNotification + SendGrid events)')
  const allNotifs = leads.flatMap(l => l.leadNotifications)
  console.log(`  notification rows: ${allNotifs.length}   ${tally(allNotifs, n => n.status).map(([s, c]) => `${s}=${c}`).join('  ')}`)
  const failed = allNotifs.filter(n => n.status === 'FAILED')
  if (failed.length) for (const [e, c] of tally(failed, n => (n.errorMessage || '(none)').slice(0, 60)).slice(0, 6)) console.log(`    FAILED ×${c}: ${e}`)
  const ev = await prisma.emailEvent.groupBy({ by: ['event'], where: { timestamp: { gte: START }, leadId: { not: null } }, _count: true })
  console.log(`  SendGrid events on lead emails: ${ev.map(e => `${e.event}=${e._count}`).join('  ')}`)
  const bounced = await prisma.emailEvent.findMany({ where: { timestamp: { gte: START }, leadId: { not: null }, event: { in: ['bounce', 'dropped', 'spamreport'] } }, select: { email: true, event: true, reason: true }, distinct: ['email'] })
  if (bounced.length) { console.log(`  Bouncing/dropped provider addresses (${bounced.length}):`); for (const b of bounced.slice(0, 15)) console.log(`    ${b.event.padEnd(10)} ${padE(b.email, 40)} ${(b.reason || '').slice(0, 50)}`) }

  // ── 7. Claim latency ───────────────────────────────────────────────────────
  h('7. CLAIM LATENCY (routed → claimed)')
  const lat = leads.filter(l => l.routedAt && l.claimedAt).map(l => ({ h: hrs(l.routedAt!, l.claimedAt!), u: l.urgency }))
  for (const u of ['STAT', 'STANDARD']) {
    const xs = lat.filter(x => x.u === u).map(x => x.h)
    if (!xs.length) continue
    console.log(`  ${padE(u, 9)} n=${xs.length}  median ${fmtH(median(xs))}  <15m ${pct(xs.filter(x => x < 0.25).length, xs.length)}  <1h ${pct(xs.filter(x => x < 1).length, xs.length)}  <6h ${pct(xs.filter(x => x < 6).length, xs.length)}  >24h ${pct(xs.filter(x => x > 24).length, xs.length)}`)
  }
  const stat = leads.filter(l => l.urgency === 'STAT')
  console.log(`  STAT leads ${stat.length}: claimed ${stat.filter(l => l.claimedAt).length}, escalated to admin ${stat.filter(l => l.statEscalatedAt).length}, never reached ${stat.filter(l => sentCount(l) === 0).length}`)

  // ── 8. Outcomes ────────────────────────────────────────────────────────────
  h('8. OUTCOMES on claimed leads')
  const claimed = leads.filter(l => l.claimedAt)
  for (const [o, c] of tally(claimed, l => l.outcome || '(none)')) {
    const tag = l_tag(o)
    console.log(`  ${pad(c, 3)}  ${pad(pct(c, claimed.length), 4)}  ${padE(o, 24)} ${tag}`)
  }
  function l_tag(o: string) { return o === '(none)' ? '' : BOOKED.has(o) ? 'WON' : FAILED_CONTACT.has(o) ? 'failed-contact' : MID_FUNNEL.has(o) ? 'mid-funnel' : TERMINAL_BAD.has(o) ? 'lost' : '' }
  const fc = claimed.filter(l => l.outcome && FAILED_CONTACT.has(l.outcome)).length
  const mid = claimed.filter(l => l.outcome && MID_FUNNEL.has(l.outcome)).length
  const lost = claimed.filter(l => l.outcome && TERMINAL_BAD.has(l.outcome)).length
  const none = claimed.filter(l => !l.outcome).length
  console.log(`  won ${cur.booked} (${pct(cur.booked, claimed.length)})  failed-contact ${fc} (${pct(fc, claimed.length)})  mid-funnel ${mid} (${pct(mid, claimed.length)})  lost ${lost} (${pct(lost, claimed.length)})  no outcome ${none} (${pct(none, claimed.length)})`)
  const lostNotes = claimed.filter(l => l.outcome && TERMINAL_BAD.has(l.outcome) && l.outcomeNotes)
  if (lostNotes.length) { console.log(`  Lost-lead notes:`); for (const l of lostNotes.slice(0, 12)) console.log(`    [${l.outcome}] ${l.city},${l.state}: ${l.outcomeNotes!.replace(/\s+/g, ' ').slice(0, 110)}`) }
  const bookedNotDone = claimed.filter(l => l.outcome === 'APPOINTMENT_BOOKED' && hrs(l.claimedAt!, NOW) > 24 * 7)
  console.log(`  Booked >7d ago, never marked completed: ${bookedNotDone.length}`)

  // ── 9. Providers ───────────────────────────────────────────────────────────
  h('9. PROVIDER SCOREBOARD (claimers)')
  const ps = new Map<string, { name: string; tier: string; pri: boolean; elig: boolean; claims: number; booked: number; done: number; noOut: number; fc: number; lost: number; released: number; medH: number[] }>()
  for (const l of claimed) {
    if (!l.provider) continue
    if (!ps.has(l.provider.id)) ps.set(l.provider.id, { name: l.provider.name.trim(), tier: l.provider.listingTier, pri: l.provider.priorityRouting, elig: l.provider.eligibleForLeads, claims: 0, booked: 0, done: 0, noOut: 0, fc: 0, lost: 0, released: 0, medH: [] })
    const s = ps.get(l.provider.id)!
    s.claims++
    if (l.outcome && BOOKED.has(l.outcome)) s.booked++
    if (l.outcome === 'APPOINTMENT_COMPLETED') s.done++
    if (!l.outcome) s.noOut++
    if (l.outcome && FAILED_CONTACT.has(l.outcome)) s.fc++
    if (l.outcome && TERMINAL_BAD.has(l.outcome)) s.lost++
    if (l.routedAt) s.medH.push(hrs(l.routedAt, l.claimedAt!))
  }
  for (const l of leads) if (l.releasedFromProviderId && ps.has(l.releasedFromProviderId)) ps.get(l.releasedFromProviderId)!.released++
  console.log(`  ${padE('provider', 34)} tier     pri elig claims booked done noOut failC lost rel  medClaim`)
  for (const s of [...ps.values()].sort((a, b) => b.claims - a.claims))
    console.log(`  ${padE(s.name, 34)} ${padE(s.tier, 8)} ${s.pri ? '⚡' : ' '}   ${s.elig ? 'y' : 'N'}   ${pad(s.claims, 5)}  ${pad(s.booked, 5)} ${pad(s.done, 4)} ${pad(s.noOut, 5)} ${pad(s.fc, 5)} ${pad(s.lost, 4)} ${pad(s.released, 3)}  ${fmtH(median(s.medH))}`)
  console.log(`  distinct claimers: ${ps.size}   top-3 share of claims: ${pct([...ps.values()].sort((a, b) => b.claims - a.claims).slice(0, 3).reduce((a, s) => a + s.claims, 0), claimed.length)}`)

  // ── 10. Stale releases + in-flight ────────────────────────────────────────
  h('10. STALE-CLAIM RELEASES + IN-FLIGHT CLAIMS')
  const released = leads.filter(l => l.releasedAt)
  console.log(`  released in window: ${released.length}   cycles: ${tally(released, l => String(l.staleReleaseCount)).map(([k, c]) => `${k}×=${c}`).join(' ')}   now: ${tally(released, l => l.status).map(([s, c]) => `${s}=${c}`).join(' ')}`)
  const reclaimed = released.filter(l => l.claimedAt && l.routedToId !== l.releasedFromProviderId)
  console.log(`  re-claimed by a different provider after release: ${reclaimed.length}  → booked ${reclaimed.filter(l => l.outcome && BOOKED.has(l.outcome)).length}`)
  const inflight = leads.filter(l => l.status === 'CLAIMED' && !l.outcome)
  console.log(`  CLAIMED with no outcome right now: ${inflight.length}`)
  for (const l of inflight.slice(0, 10)) console.log(`    claimed ${fmtH(hrs(l.claimedAt!, NOW))} ago  ${padE(l.provider?.name || '?', 30)} ${l.city},${l.state} ${l.urgency}`)
  const stuckOpen = leads.filter(l => l.status === 'OPEN')
  console.log(`  still OPEN: ${stuckOpen.length}`)
  for (const l of stuckOpen.slice(0, 12)) console.log(`    ${fmtH(hrs(l.createdAt, NOW)).padStart(5)} old  ${padE(l.city + ',' + l.state, 24)} ${l.urgency.padEnd(8)} reached=${sentCount(l)} ${l.isHighValue ? 'HV' : ''} ${l.releasedAt ? 'released' : ''}`)

  // ── 11. Intake quality ────────────────────────────────────────────────────
  h('11. INTAKE QUALITY (gates, source, attribution)')
  const dim = (label: string, key: (l: typeof leads[0]) => string) => {
    console.log(`  ${label}`)
    for (const [k, c] of tally(leads, key).slice(0, 8)) {
      const xs = leads.filter(l => key(l) === k)
      console.log(`    ${padE(k, 26)} ${pad(c, 4)}  claim ${pad(pct(xs.filter(l => l.claimedAt).length, c), 4)}  booked ${pad(pct(xs.filter(l => l.outcome && BOOKED.has(l.outcome)).length, c), 4)}`)
    }
  }
  dim('doctor order', l => l.hasDoctorOrder || '(unset)')
  dim('payment', l => l.paymentMethod || '(unset)')
  dim('draw count', l => l.drawCount || '(unset)')
  dim('source', l => l.source || '(unset)')
  dim('attribution', l => l.attributionSource || '(unset)')
  dim('landing page', l => (l.landingPage || '(unset)').replace(/\?.*$/, '').replace(/^https?:\/\/[^/]+/, '').slice(0, 26))
  const hv = leads.filter(l => l.isHighValue)
  console.log(`  high-value: ${hv.length}  est $${hv.reduce((a, l) => a + l.estimatedValueCents, 0) / 100}`)
  for (const l of hv) console.log(`    ${day(l.createdAt)} $${pad(l.estimatedValueCents / 100, 5)} ${padE(l.status, 18)} ${padE(l.outcome || '—', 22)} ${l.organizationName || l.fullName}  ${l.city},${l.state}`)

  // ── 12. Patient confirmation ──────────────────────────────────────────────
  h('12. PATIENT-CONFIRMATION SIGNAL (provider says vs patient says)')
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(`select column_name from information_schema.columns where table_name='leads' and column_name in ('patientOutcome','outcomeRequestSentAt')`)
  if (cols.length < 2) {
    console.log(`  ⚠ prod is missing patient-confirmation columns (${cols.map(c => c.column_name).join(',') || 'none'} present). Schema declares them; db push never ran. Feature is inert in prod.`)
  } else {
    const rows = await prisma.$queryRawUnsafe<any[]>(`select id, outcome, "patientOutcome", "patientOutcomeReason", "outcomeRequestSentAt", "outcomeReminderSentAt" from leads where "createdAt" >= $1 and "outcomeRequestSentAt" is not null`, START)
    const answered = rows.filter(r => r.patientOutcome)
    console.log(`  asked ${rows.length}  reminded ${rows.filter(r => r.outcomeReminderSentAt).length}  answered ${answered.length} (${pct(answered.length, rows.length)})`)
    for (const r of answered) console.log(`    ${(r.outcome === 'APPOINTMENT_COMPLETED') === (r.patientOutcome === 'COMPLETED') ? '  ' : '⚠ '} provider=${r.outcome} patient=${r.patientOutcome}${r.patientOutcomeReason ? ' — ' + r.patientOutcomeReason.slice(0, 80) : ''}`)
  }

  // ── 13. Geography ─────────────────────────────────────────────────────────
  h('13. TOP STATES (demand vs. fulfilment)')
  console.log(`  ${'st'.padEnd(4)} leads  reached  claimed  booked  nocov`)
  for (const [st, c] of tally(leads, l => l.state).slice(0, 15)) {
    const xs = leads.filter(l => l.state === st)
    console.log(`  ${st.padEnd(4)} ${pad(c, 5)}  ${pad(xs.filter(l => sentCount(l) > 0).length, 7)}  ${pad(xs.filter(l => l.claimedAt).length, 7)}  ${pad(xs.filter(l => l.outcome && BOOKED.has(l.outcome)).length, 6)}  ${pad(xs.filter(l => l.status === 'NEEDS_COVERAGE').length, 5)}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
