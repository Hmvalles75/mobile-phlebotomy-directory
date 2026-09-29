import { prisma } from './prisma'

/**
 * Provider response score (2026-09-29).
 *
 * One number per provider, 0-100, from the last WINDOW_DAYS of lead history,
 * so routing and admin can tell a provider who claims in ten minutes and
 * books from one who lets seven leads go by (Ann Arbor, 9/23) or claims and
 * ghosts (Arfm, 9/15). Recomputed nightly by /api/cron/provider-score.
 *
 * Inputs (all already recorded):
 *   sent       distinct leads with a SENT notification to the provider
 *   claimed    leads where routedToId = provider and claimedAt in window
 *   booked     of those, outcome APPOINTMENT_BOOKED / COMPLETED
 *   median claim minutes  claimedAt - the provider's notification createdAt
 *   stale releases        leads released from the provider by the stale-claim
 *                         cron (claimed, then no outcome for the SLA)
 *
 * Score = 45 * claimRate + 25 * bookRate + 30 * speed - 20 * ghostRate,
 * clamped 0-100. speed is 1 at <= 30 min (the observed median), falling
 * linearly to 0 at 24 h. ghostRate = staleReleases / claimed. A provider sent
 * fewer than MIN_SENT leads gets null: unknown, not bad.
 */
export const WINDOW_DAYS = 90
export const MIN_SENT = 3
/** Unknown providers (null score) sort as this in routing decisions. */
export const UNKNOWN_SCORE = 40

export interface ProviderStats {
  windowDays: number
  sent: number
  claimed: number
  booked: number
  staleReleases: number
  medianClaimMinutes: number | null
  claimRate: number
  bookRate: number
}

export function scoreFromStats(s: ProviderStats): number | null {
  if (s.sent < MIN_SENT) return null
  const speed = s.medianClaimMinutes === null ? 0 : s.medianClaimMinutes <= 30 ? 1 : Math.max(0, 1 - (s.medianClaimMinutes - 30) / (24 * 60 - 30))
  // Releases can outnumber in-window claims (multi-cycle releases, claims from before the window); cap at 1.
  const ghostRate = s.claimed > 0 ? Math.min(1, s.staleReleases / s.claimed) : 0
  const raw = 45 * s.claimRate + 25 * s.bookRate + 30 * speed - 20 * ghostRate
  return Math.round(Math.max(0, Math.min(100, raw)))
}

export async function computeProviderStats(now = new Date()): Promise<Map<string, ProviderStats>> {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86400e3)
  const sent = await prisma.leadNotification.findMany({ where: { createdAt: { gte: since }, status: 'SENT' }, select: { providerId: true, leadId: true, createdAt: true } })
  const claimed = await prisma.lead.findMany({ where: { claimedAt: { gte: since }, routedToId: { not: null } }, select: { id: true, routedToId: true, claimedAt: true, outcome: true } })
  const releases = await prisma.lead.groupBy({ by: ['releasedFromProviderId'], where: { releasedAt: { gte: since }, releaseReason: { in: ['stale_claim', 'stale_claim_cycle_cap'] }, releasedFromProviderId: { not: null } }, _count: { _all: true } })

  const sentLeads = new Map<string, Set<string>>()
  const firstSent = new Map<string, Date>()   // `${providerId}:${leadId}` -> earliest notification
  for (const n of sent) {
    if (!sentLeads.has(n.providerId)) sentLeads.set(n.providerId, new Set())
    sentLeads.get(n.providerId)!.add(n.leadId)
    const k = `${n.providerId}:${n.leadId}`
    if (!firstSent.has(k) || n.createdAt < firstSent.get(k)!) firstSent.set(k, n.createdAt)
  }
  const claims = new Map<string, { n: number; booked: number; minutes: number[] }>()
  for (const l of claimed) {
    const pid = l.routedToId as string
    const c = claims.get(pid) || { n: 0, booked: 0, minutes: [] }
    c.n++
    if (l.outcome === 'APPOINTMENT_BOOKED' || l.outcome === 'APPOINTMENT_COMPLETED') c.booked++
    const at = firstSent.get(`${pid}:${l.id}`)
    if (at && l.claimedAt) c.minutes.push((l.claimedAt.getTime() - at.getTime()) / 60000)
    claims.set(pid, c)
  }
  const stale = new Map(releases.map(r => [r.releasedFromProviderId as string, r._count._all]))

  const out = new Map<string, ProviderStats>()
  const ids = new Set([...sentLeads.keys(), ...claims.keys()])
  for (const pid of ids) {
    const s = sentLeads.get(pid)?.size || 0
    const c = claims.get(pid) || { n: 0, booked: 0, minutes: [] }
    const m = [...c.minutes].sort((a, b) => a - b)
    out.set(pid, {
      windowDays: WINDOW_DAYS, sent: s, claimed: c.n, booked: c.booked, staleReleases: stale.get(pid) || 0,
      medianClaimMinutes: m.length ? Math.round(m[Math.floor(m.length / 2)]) : null,
      claimRate: s > 0 ? Math.min(1, c.n / s) : 0,
      bookRate: c.n > 0 ? c.booked / c.n : 0,
    })
  }
  return out
}

export interface ScoreRunResult { dryRun: boolean; providers: number; scored: number; unknown: number; cleared: number; sample: { name: string; score: number | null; stats: ProviderStats }[] }

export async function runProviderScoring(opts: { dryRun?: boolean } = {}): Promise<ScoreRunResult> {
  const now = new Date()
  const stats = await computeProviderStats(now)
  const providers = await prisma.provider.findMany({ where: { removedAt: null }, select: { id: true, name: true, responseScore: true } })
  const r: ScoreRunResult = { dryRun: !!opts.dryRun, providers: providers.length, scored: 0, unknown: 0, cleared: 0, sample: [] }
  const ids: string[] = [], scores: (number | null)[] = [], statsJson: string[] = []
  for (const p of providers) {
    const s = stats.get(p.id) || { windowDays: WINDOW_DAYS, sent: 0, claimed: 0, booked: 0, staleReleases: 0, medianClaimMinutes: null, claimRate: 0, bookRate: 0 }
    const score = scoreFromStats(s)
    if (score === null) { r.unknown++; if (p.responseScore !== null) r.cleared++ } else r.scored++
    if (r.sample.length < 12 && s.sent >= MIN_SENT) r.sample.push({ name: p.name.trim(), score, stats: s })
    ids.push(p.id); scores.push(score); statsJson.push(JSON.stringify(s))
  }
  if (!opts.dryRun) {
    // One statement per BATCH providers instead of one round trip each:
    // 807 sequential updates took 310 s from a laptop (2026-09-29) against a
    // 60 s function limit.
    const BATCH = 200
    for (let i = 0; i < ids.length; i += BATCH) {
      await prisma.$executeRaw`
        UPDATE providers AS p
        SET "responseScore" = v.score, "responseScoredAt" = ${now}, "responseStats" = v.stats::jsonb
        FROM unnest(${ids.slice(i, i + BATCH)}::text[], ${scores.slice(i, i + BATCH)}::float8[], ${statsJson.slice(i, i + BATCH)}::text[]) AS v(id, score, stats)
        WHERE p.id = v.id`
    }
  }
  r.sample.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  console.log(`[providerScore] dry=${r.dryRun} providers=${r.providers} scored=${r.scored} unknown=${r.unknown}`)
  return r
}
