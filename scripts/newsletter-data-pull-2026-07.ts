/**
 * Read-only aggregate pull for the newsletter issue. NO writes to app data.
 *
 * Privacy contract: fullName / phone / email / address1 / zip are never selected.
 * City + state are the finest geography that leaves the DB. CoverageRequest is
 * reduced to a single count — no org names, no location, no draw type.
 *
 * Window: 2026-06-02 → today. No pre-June comparisons: the May unclaimed-lead
 * sweep (105 rows reclassified) and the 2026-05-22 stale-claim release (27 rows)
 * make any trend line across that boundary meaningless.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

const WINDOW_START = new Date('2026-06-02T00:00:00.000Z')
const NOW = new Date()
const THIRTY_DAYS_AGO = new Date(NOW.getTime() - 30 * 86_400_000)
const OUT = 'reports/newsletter-data-2026-07-28.md'

// Excluded from every denominator, per instruction. Counted and reported.
const EXCLUDED_STATUSES = ['CLOSED_DUPLICATE', 'CLOSED_PRICING_ONLY', 'CLOSED_UNCONFIRMED']

const md: string[] = []
const w = (s = '') => md.push(s)

function median(xs: number[]): number {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}
const ageDays = (d: Date) => Math.floor((NOW.getTime() - d.getTime()) / 86_400_000)

async function main() {
  // ---- Fetch once, aggregate in memory. Non-PII columns only. ----
  const all = await prisma.lead.findMany({
    where: { createdAt: { gte: WINDOW_START } },
    select: {
      id: true, createdAt: true, city: true, state: true, status: true,
      routedToId: true, claimedAt: true, releasedAt: true, staleReleaseCount: true,
      outcome: true, appointmentDate: true, completedAt: true,
    },
  })

  const excluded = all.filter(l => EXCLUDED_STATUSES.includes(String(l.status)))
  const leads = all.filter(l => !EXCLUDED_STATUSES.includes(String(l.status)))

  const isAbandoned = (l: typeof leads[number]) => l.releasedAt !== null || l.staleReleaseCount > 0
  const isClaimed = (l: typeof leads[number]) => l.routedToId !== null && !isAbandoned(l)
  const isNeverClaimed = (l: typeof leads[number]) =>
    l.routedToId === null && l.claimedAt === null && !isAbandoned(l)

  w(`# Newsletter data pull`)
  w()
  w(`**Window:** 2026-06-02 → ${NOW.toISOString().slice(0, 10)} (${Math.floor((NOW.getTime() - WINDOW_START.getTime()) / 86_400_000)} days)`)
  w(`**Source:** production Neon database, read-only SELECTs. No read replica exists.`)
  w(`**Scope:** consumer \`Lead\` records only. Aggregate and city-level only — no names, no contact details, no PHI.`)
  w()
  w(`> No comparisons to pre-June periods. The May unclaimed-lead sweep (105 rows reclassified)`)
  w(`> and the 2026-05-22 stale-claim release (27 rows) sit just before this window and would`)
  w(`> make any trend line misleading.`)
  w()

  // ---- Data density (does the window start hold up?) ----
  w(`## Data density by week`)
  w()
  w(`Checks whether the 2026-06-02 start is supportable or should move later.`)
  w()
  const weeks = new Map<string, number>()
  for (const l of leads) {
    const wk = new Date(l.createdAt)
    wk.setUTCDate(wk.getUTCDate() - wk.getUTCDay())
    weeks.set(wk.toISOString().slice(0, 10), (weeks.get(wk.toISOString().slice(0, 10)) || 0) + 1)
  }
  w(`| Week beginning | Leads |`)
  w(`|---|---:|`)
  for (const [k, v] of [...weeks.entries()].sort()) w(`| ${k} | ${v} |`)
  w()

  // ---- A. Lead volume ----
  const last30 = leads.filter(l => l.createdAt >= THIRTY_DAYS_AGO)
  w(`## A. Lead volume`)
  w()
  w(`| Metric | Count |`)
  w(`|---|---:|`)
  w(`| Leads created in window | ${leads.length} |`)
  w(`| Leads created in last 30 days | ${last30.length} |`)
  w(`| Excluded from all denominators | ${excluded.length} |`)
  w()
  const exByStatus: Record<string, number> = {}
  for (const l of excluded) exByStatus[String(l.status)] = (exByStatus[String(l.status)] || 0) + 1
  w(`Excluded breakdown: ${Object.entries(exByStatus).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`)
  w()

  const claimed = leads.filter(isClaimed)
  const abandoned = leads.filter(isAbandoned)
  const never = leads.filter(isNeverClaimed)
  const needsCoverage = leads.filter(l => String(l.status) === 'NEEDS_COVERAGE')
  const expiredNoResponse = leads.filter(l => String(l.status) === 'EXPIRED_NO_RESPONSE')

  w(`### Claim outcome split`)
  w()
  const pct = (n: number) => leads.length ? `${((n / leads.length) * 100).toFixed(1)}%` : '—'
  w(`| Bucket | Count | Share |`)
  w(`|---|---:|---:|`)
  w(`| Claimed | ${claimed.length} | ${pct(claimed.length)} |`)
  w(`| Never claimed | ${never.length} | ${pct(never.length)} |`)
  w(`| Claimed then abandoned | ${abandoned.length} | ${pct(abandoned.length)} |`)
  w(`| **Total (denominator)** | **${leads.length}** | 100% |`)
  w()
  w(`Of the never-claimed, reported separately and never merged:`)
  w()
  w(`| Reason | Count | Meaning |`)
  w(`|---|---:|---|`)
  w(`| \`NEEDS_COVERAGE\` | ${needsCoverage.length} | No eligible provider existed — recruiting gap |`)
  w(`| \`EXPIRED_NO_RESPONSE\` | ${expiredNoResponse.length} | Providers were notified, nobody claimed — responsiveness gap |`)
  w()

  w(`### Full status distribution (audit)`)
  w()
  const byStatus: Record<string, number> = {}
  for (const l of leads) byStatus[String(l.status)] = (byStatus[String(l.status)] || 0) + 1
  w(`| LeadStatus | Count |`)
  w(`|---|---:|`)
  for (const [k, v] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) w(`| \`${k}\` | ${v} |`)
  w()

  // ---- B. Unclaimed leads by geography ----
  w(`## B. Unclaimed leads by geography`)
  w()
  w(`City-level counts are factual lead counts only. **No city is described as having zero`)
  w(`providers** — provider coverage is radius-based and cannot be resolved to a city safely.`)
  w()
  const unclaimed = [...never, ...abandoned]
  const byCity = new Map<string, { count: number; ages: number[] }>()
  for (const l of unclaimed) {
    const key = `${l.city}||${l.state}`
    if (!byCity.has(key)) byCity.set(key, { count: 0, ages: [] })
    const e = byCity.get(key)!
    e.count++
    e.ages.push(ageDays(l.createdAt))
  }
  w(`Total unclaimed (never claimed + claimed-then-abandoned): **${unclaimed.length}**`)
  w()
  w(`| City | State | Unclaimed | Age min (d) | Age median (d) | Age max (d) |`)
  w(`|---|---|---:|---:|---:|---:|`)
  for (const [key, e] of [...byCity.entries()].sort((a, b) => b[1].count - a[1].count)) {
    const [city, state] = key.split('||')
    w(`| ${city} | ${state} | ${e.count} | ${Math.min(...e.ages)} | ${median(e.ages)} | ${Math.max(...e.ages)} |`)
  }
  w()

  // State-level coverage gap — eligibleForLeads gate only, per instruction.
  const activeProviders = await prisma.provider.groupBy({
    by: ['primaryState'],
    where: { eligibleForLeads: true, removedAt: null },
    _count: { _all: true },
  })
  const activeByState = new Map(activeProviders.map(r => [r.primaryState || '(unset)', r._count._all]))

  const unclaimedByState = new Map<string, number>()
  for (const l of unclaimed) unclaimedByState.set(l.state, (unclaimedByState.get(l.state) || 0) + 1)

  w(`### Coverage gaps — STATE level only`)
  w()
  w(`Gate is \`eligibleForLeads = true\` and \`removedAt = null\`. Provider state is \`primaryState\`,`)
  w(`a single home state — a provider may serve across a state line, so this is a directional`)
  w(`signal, not a coverage map.`)
  w()
  w(`| State | Unclaimed leads | Active providers |`)
  w(`|---|---:|---:|`)
  for (const [st, n] of [...unclaimedByState.entries()].sort((a, b) => b[1] - a[1])) {
    w(`| ${st} | ${n} | ${activeByState.get(st) ?? 0} |`)
  }
  w()

  // Malformed state values corrupt any state-level rollup — surface them.
  const badStates = [...unclaimedByState.keys()].filter(s => !/^[A-Z]{2}$/.test(s))
  if (badStates.length) {
    w(`> **Data quality:** ${badStates.length} non-standard \`state\` value(s) present —`)
    w(`> ${badStates.map(s => `\`${s}\``).join(', ')}. These are unnormalized user input, not`)
    w(`> real states, and their rows are counted under those literal keys above.`)
    w()
  }

  // ---- C. Speed-to-claim ----
  w(`## C. Speed to claim`)
  w()
  w(`Leads with \`staleReleaseCount > 0\` or a non-null \`releasedAt\` are **excluded**:`)
  w(`\`claimedAt\` may have been overwritten on re-claim, so their timing is unreliable.`)
  w(`Not cross-referenced against outcome.`)
  w()
  const speedPool = leads.filter(l => l.claimedAt !== null && !isAbandoned(l))
  const speedExcluded = leads.filter(l => l.claimedAt !== null && isAbandoned(l))
  const buckets = { '<1 hr': 0, '1–6 hr': 0, '6–24 hr': 0, '24 hr+': 0 }
  const hoursList: number[] = []
  for (const l of speedPool) {
    const hrs = (l.claimedAt!.getTime() - l.createdAt.getTime()) / 3_600_000
    hoursList.push(hrs)
    if (hrs < 1) buckets['<1 hr']++
    else if (hrs < 6) buckets['1–6 hr']++
    else if (hrs < 24) buckets['6–24 hr']++
    else buckets['24 hr+']++
  }
  w(`| Time to claim | Leads | Share |`)
  w(`|---|---:|---:|`)
  for (const [k, v] of Object.entries(buckets)) {
    w(`| ${k} | ${v} | ${speedPool.length ? ((v / speedPool.length) * 100).toFixed(1) + '%' : '—'} |`)
  }
  w(`| **Total measured** | **${speedPool.length}** | 100% |`)
  w()
  w(`Excluded from these buckets (unreliable \`claimedAt\`): **${speedExcluded.length}**`)
  if (hoursList.length) w(`Median time to claim: **${median(hoursList.map(h => Math.round(h * 60)))} minutes**`)
  w()

  // ---- D. Provider funnel ----
  w(`## D. Provider funnel`)
  w()
  const totalProviders = await prisma.provider.count({ where: { removedAt: null } })
  const eligible = await prisma.provider.findMany({
    where: { eligibleForLeads: true, removedAt: null },
    select: { id: true },
  })
  const eligibleIds = new Set(eligible.map(p => p.id))

  const claimerIds = new Set(leads.filter(l => l.routedToId).map(l => l.routedToId!))
  const claimCounts = new Map<string, number>()
  for (const l of leads) if (l.routedToId) claimCounts.set(l.routedToId, (claimCounts.get(l.routedToId) || 0) + 1)
  const multiClaimers = [...claimCounts.values()].filter(n => n >= 2).length
  const eligibleZero = [...eligibleIds].filter(id => !claimCounts.has(id)).length

  // "Notified but never claimed" — SENT notifications on leads never claimed at all.
  const neverClaimedIds = leads
    .filter(l => l.routedToId === null && l.claimedAt === null && l.releasedAt === null && l.staleReleaseCount === 0)
    .map(l => l.id)
  const sentNotifs = await prisma.leadNotification.findMany({
    where: { leadId: { in: neverClaimedIds }, status: 'SENT' },
    select: { leadId: true },
  })
  const notifiedNeverClaimedLeads = new Set(sentNotifs.map(n => n.leadId)).size

  w(`| Metric | Count |`)
  w(`|---|---:|`)
  w(`| Providers on the directory (not removed) | ${totalProviders} |`)
  w(`| Providers eligible to receive leads | ${eligibleIds.size} |`)
  w(`| Providers who claimed ≥1 lead in window | ${claimerIds.size} |`)
  w(`| Providers who claimed ≥2 leads in window | ${multiClaimers} |`)
  w(`| **Eligible providers who claimed ZERO leads in window** | **${eligibleZero}** |`)
  w()
  w(`### Notified but never claimed`)
  w()
  w(`Leads that generated at least one \`LeadNotification\` with \`status = SENT\` and were never`)
  w(`claimed. This measures **delivery attempts, not attention** — there is no view or open`)
  w(`tracking in the system, and the SendGrid event webhook has recorded zero events.`)
  w()
  w(`| Metric | Count |`)
  w(`|---|---:|`)
  w(`| Leads notified but never claimed | ${notifiedNeverClaimedLeads} |`)
  w(`| SENT notifications those leads generated | ${sentNotifs.length} |`)
  w()

  // ---- Institutional: single count, nothing else ----
  const coverageRequests = await prisma.coverageRequest.count({
    where: { createdAt: { gte: WINDOW_START } },
  })
  w(`## Institutional pipeline`)
  w()
  w(`Institutional (\`CoverageRequest\`) records created in window: **${coverageRequests}**`)
  w()
  w(`Count only, by instruction. No organization names, locations, draw types, or geography.`)
  w()

  // ---- INTERNAL ONLY ----
  w(`---`)
  w()
  w(`# INTERNAL ONLY — DO NOT PUBLISH`)
  w()
  w(`These are **floor values, not true rates.** Outcomes are provider-self-reported and known`)
  w(`incomplete — the \`outcome-logging-nudge-2026-05\` campaign exists precisely because top`)
  w(`claimers had 2–5 unlogged outcomes each. A lead with no logged outcome is indistinguishable`)
  w(`from a lead that never happened.`)
  w()
  // Denominator is every lead EVER claimed — including ones later released.
  // Using only currently-held leads undercounts the denominator and produces
  // impossible >100% shares.
  const everClaimed = leads.filter(l =>
    l.claimedAt !== null || l.routedToId !== null || l.releasedAt !== null || l.staleReleaseCount > 0)
  const withOutcome = everClaimed.filter(l => l.outcome !== null)
  const booked = everClaimed.filter(l => String(l.outcome) === 'APPOINTMENT_BOOKED' || l.appointmentDate !== null)
  const completedOut = everClaimed.filter(l => String(l.outcome) === 'APPOINTMENT_COMPLETED' || l.completedAt !== null)
  w(`Denominator is **leads ever claimed (${everClaimed.length})**, including those later released —`)
  w(`not just currently-held leads.`)
  w()
  w(`| Metric (floor) | Count | Share of ever-claimed |`)
  w(`|---|---:|---:|`)
  const cp = (n: number) => everClaimed.length ? `${((n / everClaimed.length) * 100).toFixed(1)}%` : '—'
  w(`| Ever-claimed leads with ANY outcome logged | ${withOutcome.length} | ${cp(withOutcome.length)} |`)
  w(`| Appointment booked | ${booked.length} | ${cp(booked.length)} |`)
  w(`| Appointment completed | ${completedOut.length} | ${cp(completedOut.length)} |`)
  w(`| Ever-claimed leads with NO outcome logged | ${everClaimed.length - withOutcome.length} | ${cp(everClaimed.length - withOutcome.length)} |`)
  w()
  w(`Note: "completed" can exceed "booked" — providers often log \`APPOINTMENT_COMPLETED\``)
  w(`directly without ever setting \`APPOINTMENT_BOOKED\`. The two are not a funnel.`)
  w()

  // ---- Notification coverage diagnostic (internal) ----
  const allNeverClaimedNotifs = await prisma.leadNotification.groupBy({
    by: ['status'],
    where: { leadId: { in: neverClaimedIds } },
    _count: { _all: true },
  })
  const leadsWithAnyNotif = new Set(
    (await prisma.leadNotification.findMany({
      where: { leadId: { in: neverClaimedIds } },
      select: { leadId: true },
    })).map(n => n.leadId)
  ).size
  w(`## INTERNAL — notification coverage on never-claimed leads`)
  w()
  w(`| Metric | Count |`)
  w(`|---|---:|`)
  w(`| Never-claimed leads | ${neverClaimedIds.length} |`)
  w(`| …that have ANY notification row (any status) | ${leadsWithAnyNotif} |`)
  w(`| …that have NO notification row at all | ${neverClaimedIds.length - leadsWithAnyNotif} |`)
  w()
  w(`Notification rows on never-claimed leads by status: ${allNeverClaimedNotifs.map(r => `${r.status} ${r._count._all}`).join(', ') || 'none'}`)
  w()

  // ---- Reliability review ----
  const openCount = byStatus['OPEN'] || 0
  w(`---`)
  w()
  w(`# Numbers I would not publish as-is`)
  w()
  w(`### 1. "${never.length} never claimed" is NOT a provider-responsiveness figure`)
  w()
  w(`${neverClaimedIds.length - leadsWithAnyNotif} of ${neverClaimedIds.length} never-claimed leads have **no notification row at all** —`)
  w(`no provider was ever contacted about them. Only ${leadsWithAnyNotif} were ever routed to anyone.`)
  w(`If you write "over half our leads go unclaimed," readers will hear "providers ignore leads."`)
  w(`The data says the opposite: for the large majority, nobody was ever asked.`)
  w()
  w(`Safe framing: *"${leadsWithAnyNotif} leads reached a provider and went unclaimed"* — or lead with the`)
  w(`coverage gap, which is the real story.`)
  w()
  w(`### 2. \`OPEN\` (${openCount}) is a holding pen, not a status`)
  w()
  w(`\`NEEDS_COVERAGE\` shows only ${needsCoverage.length} and \`EXPIRED_NO_RESPONSE\` only ${expiredNoResponse.length}, yet ${openCount} leads sit \`OPEN\`.`)
  w(`The classification sweep that separates "no coverage existed" from "providers ignored it"`)
  w(`has not run since May. Those two counts are therefore **not trustworthy as published`)
  w(`categories** — they undercount both failure modes by roughly the size of the OPEN pool.`)
  w()
  w(`### 3. Claimed-then-abandoned (${abandoned.length}) is partly a system artifact`)
  w()
  w(`The stale-claim cron auto-releases claims when a provider does not log an outcome inside`)
  w(`SLA. A provider working a lead offline could be released without ever dropping the lead.`)
  w(`The \`WORKING_IT\` button shipped 2026-07-16 to fix this — mid-window — so early-window and`)
  w(`late-window abandonment rates are not measuring the same thing.`)
  w()
  w(`### 4. Speed-to-claim excludes the slowest cases by construction`)
  w()
  w(`${speedExcluded.length} leads were dropped from the buckets because \`claimedAt\` may have been overwritten.`)
  w(`Those are disproportionately the troubled ones. The "${((buckets['<1 hr'] / (speedPool.length || 1)) * 100).toFixed(0)}% claimed within an hour" figure is`)
  w(`true **of leads that were claimed cleanly and never released** — say that, or it reads as`)
  w(`an overall service level.`)
  w()
  w(`### 5. Malformed \`state\` values`)
  w()
  w(`\`No\`, \`Co\`, \`Pa\`, \`md\` appear as state values — unnormalized intake input. Small counts,`)
  w(`but they mean state rollups are approximate and a strict \`[A-Z]{2}\` filter would silently`)
  w(`drop real leads.`)
  w()
  w(`### 6. Provider counts are point-in-time, not window-accurate`)
  w()
  w(`\`eligibleForLeads\` and \`removedAt\` are read as they are **today**. A provider deactivated`)
  w(`last week counts as ineligible for the whole window. The ${eligibleZero}-of-${eligibleIds.size} zero-claim figure is`)
  w(`directionally sound but not a clean cohort.`)
  w()

  fs.writeFileSync(OUT, md.join('\n'), 'utf8')
  console.log(`Wrote ${OUT} (${md.length} lines)`)
  console.log(`\nHeadline: ${leads.length} leads in window, ${excluded.length} excluded, ${eligibleZero}/${eligibleIds.size} eligible providers claimed nothing`)
}

main()
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect() })
