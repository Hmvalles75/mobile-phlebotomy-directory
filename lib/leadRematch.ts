/**
 * Rematch existing leads against the provider pool as it is today.
 *
 * Routing is a one-shot at submit time. Anything that changes who matches
 * afterwards -- a provider signing up, widening their radius, being re-enabled,
 * or a matcher rule change like the 2026-08-25 removal of the state filter --
 * leaves every lead that was already OPEN exactly where it was. The 2026-09-04
 * diagnostic found 9 OPEN leads with an in-radius provider who had never been
 * sent them, and 7 more that would gain providers; all three causes above were
 * represented. See docs/findings/lead-diagnostic-2026-09-04.md.
 *
 * Two entry points:
 *   - rematchOpenLeadsForProvider(providerId): awaited from the activation and
 *     radius-change paths (Next 14 has no after()/waitUntil, so a detached
 *     promise can be frozen with the function). Scoped to leads with no
 *     notification row for that provider, so a settings save cannot re-blast
 *     the pool, and capped per call so a request never waits on more than
 *     HOOK_MAX_LEADS sends; the admin one-shot picks up any remainder.
 *   - rematchOpenLeads(): every OPEN / NEEDS_COVERAGE lead in the window. This
 *     is the admin one-shot and what covers matcher-rule changes, which no
 *     per-provider trigger can see.
 *
 * Both bypass the notifier's 4-day cap, bounded at MAX_REMATCH_AGE_DAYS (14),
 * and only ever send to providers who have never received the lead. A lead
 * parked as NEEDS_COVERAGE goes back to OPEN before its first send so the
 * claim link works; if nothing sends it is parked again.
 *
 * runCoverageSweep() is the daily job: leads that are OPEN with zero SENT
 * notifications get one rematch attempt, then NEEDS_COVERAGE if it fails.
 */
import { prisma } from './prisma'
import { LeadStatus } from '@prisma/client'
import {
  findNewProvidersForLead,
  notifyFeaturedProvidersForLead,
  MAX_REMATCH_AGE_DAYS,
} from './leadNotifications'
import { markLeadNeedsCoverage } from './coverageGap'

export interface RematchLeadResult {
  leadId: string
  city: string
  state: string
  ageDays: number
  statusBefore: LeadStatus
  newProviders: { id: string; name: string }[]
  sent: number
  flippedToOpen: boolean
  reparked: boolean
}

export interface RematchSummary {
  scanned: number
  leadsWithNewMatches: number
  notificationsSent: number
  flippedToOpen: number
  reparked: number
  dryRun: boolean
  leads: RematchLeadResult[]
  errors: { leadId: string; error: string }[]
}

const REMATCHABLE: LeadStatus[] = [LeadStatus.OPEN, LeadStatus.NEEDS_COVERAGE]

function windowStart(): Date {
  return new Date(Date.now() - MAX_REMATCH_AGE_DAYS * 24 * 60 * 60 * 1000)
}

function emptySummary(dryRun: boolean): RematchSummary {
  return { scanned: 0, leadsWithNewMatches: 0, notificationsSent: 0, flippedToOpen: 0, reparked: 0, dryRun, leads: [], errors: [] }
}

/**
 * Rematch one lead. Preview first (pure read); only touch status or send when
 * there is at least one provider who has never received it.
 */
export async function rematchLead(leadId: string, opts: { dryRun?: boolean } = {}): Promise<RematchLeadResult | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, city: true, state: true, status: true, createdAt: true },
  })
  if (!lead || !REMATCHABLE.includes(lead.status)) return null

  const ageDays = (Date.now() - lead.createdAt.getTime()) / 86400000
  const newProviders = (await findNewProvidersForLead(leadId)).map(p => ({ id: p.id, name: p.name.trim() }))
  const result: RematchLeadResult = {
    leadId, city: lead.city, state: lead.state, ageDays: Math.round(ageDays * 10) / 10,
    statusBefore: lead.status, newProviders, sent: 0, flippedToOpen: false, reparked: false,
  }
  if (newProviders.length === 0 || opts.dryRun) return result

  // The claim endpoint only accepts OPEN, so a parked lead must be reopened
  // before the email goes out, not after.
  if (lead.status === LeadStatus.NEEDS_COVERAGE) {
    const r = await prisma.lead.updateMany({
      where: { id: leadId, status: LeadStatus.NEEDS_COVERAGE },
      data: { status: LeadStatus.OPEN },
    })
    result.flippedToOpen = r.count > 0
  }

  result.sent = await notifyFeaturedProvidersForLead(leadId, { bypassAgeCap: true, onlyNewProviders: true })

  if (result.sent === 0 && result.flippedToOpen) {
    result.reparked = await markLeadNeedsCoverage(leadId, 'coverage_sweep')
  }
  return result
}

async function rematchMany(leadIds: string[], dryRun: boolean): Promise<RematchSummary> {
  const summary = emptySummary(dryRun)
  summary.scanned = leadIds.length
  for (const id of leadIds) {
    try {
      const r = await rematchLead(id, { dryRun })
      if (!r) continue
      if (r.newProviders.length > 0) {
        summary.leadsWithNewMatches++
        summary.leads.push(r)
      }
      summary.notificationsSent += r.sent
      if (r.flippedToOpen && !r.reparked) summary.flippedToOpen++
      if (r.reparked) summary.reparked++
    } catch (err: any) {
      summary.errors.push({ leadId: id, error: err?.message || String(err) })
      console.error(`[Rematch] Lead ${id} failed:`, err?.message || err)
    }
  }
  return summary
}

/** Every OPEN / NEEDS_COVERAGE lead inside the rematch window. */
export async function rematchOpenLeads(opts: { dryRun?: boolean } = {}): Promise<RematchSummary> {
  const leads = await prisma.lead.findMany({
    where: { status: { in: REMATCHABLE }, createdAt: { gte: windowStart() } },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  return rematchMany(leads.map(l => l.id), !!opts.dryRun)
}

/**
 * Leads in the window that this provider has never been sent. Called after a
 * provider becomes eligible or widens their coverage. Each lead is rematched
 * in full -- if the change also surfaces another never-notified provider, they
 * get it too; that is the same gap, not a different one.
 */
export async function rematchOpenLeadsForProvider(providerId: string, opts: { dryRun?: boolean; limit?: number } = {}): Promise<RematchSummary> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { eligibleForLeads: true, isFeatured: true, notifyEnabled: true, removedAt: true, status: true },
  })
  const routable = provider && !provider.removedAt && provider.notifyEnabled
    && (provider.isFeatured || (provider.eligibleForLeads && provider.status === 'VERIFIED'))
  if (!routable) return emptySummary(!!opts.dryRun)

  const leads = await prisma.lead.findMany({
    where: {
      status: { in: REMATCHABLE },
      createdAt: { gte: windowStart() },
      leadNotifications: { none: { providerId } },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    ...(opts.limit ? { take: opts.limit } : {}),
  })
  return rematchMany(leads.map(l => l.id), !!opts.dryRun)
}

// Most a request handler will wait on. Newest leads first; anything beyond
// this is left for the admin one-shot or the next trigger.
export const HOOK_MAX_LEADS = 25

/**
 * Wrapper for request handlers. Awaited by the caller (see module comment);
 * never throws, so a rematch failure cannot fail the provider's own save.
 */
export async function rematchForProviderAfterChange(providerId: string, trigger: string): Promise<void> {
  try {
    const s = await rematchOpenLeadsForProvider(providerId, { limit: HOOK_MAX_LEADS })
    if (s.scanned > 0) {
      console.log(`[Rematch] ${trigger} provider=${providerId}: scanned=${s.scanned} newMatches=${s.leadsWithNewMatches} sent=${s.notificationsSent} reopened=${s.flippedToOpen}`)
    }
  } catch (err: any) {
    console.error(`[Rematch] ${trigger} provider=${providerId} failed:`, err?.message || err)
  }
}

export interface CoverageSweepSummary {
  scanned: number
  rematched: number
  notificationsSent: number
  parked: number
  dryRun: boolean
  parkedLeads: { leadId: string; city: string; state: string; zip: string; ageDays: number }[]
  errors: { leadId: string; error: string }[]
}

// Give the submit path's own sends time to land before a lead counts as
// unreached. Wave 2 is scheduled up to PAID_HEAD_START_SECONDS out, and a
// QUEUED row that is still in flight must not be read as "nobody was sent".
const SWEEP_MIN_AGE_MINUTES = 60

/**
 * Daily: OPEN leads that were never sent to anyone get one rematch attempt
 * against today's pool; still unreached -> NEEDS_COVERAGE.
 */
export async function runCoverageSweep(opts: { dryRun?: boolean } = {}): Promise<CoverageSweepSummary> {
  const dryRun = !!opts.dryRun
  const summary: CoverageSweepSummary = { scanned: 0, rematched: 0, notificationsSent: 0, parked: 0, dryRun, parkedLeads: [], errors: [] }
  const leads = await prisma.lead.findMany({
    where: {
      status: LeadStatus.OPEN,
      createdAt: { lt: new Date(Date.now() - SWEEP_MIN_AGE_MINUTES * 60 * 1000) },
      // No rows at all. A lead whose rows are all FAILED had providers and
      // lost the send; that is the retry cron's job, not a coverage gap.
      leadNotifications: { none: {} },
    },
    select: { id: true, city: true, state: true, zip: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  summary.scanned = leads.length

  for (const l of leads) {
    try {
      const ageDays = Math.round(((Date.now() - l.createdAt.getTime()) / 86400000) * 10) / 10
      // Past the rematch bound the notifier would refuse anyway; park directly.
      const r = ageDays <= MAX_REMATCH_AGE_DAYS ? await rematchLead(l.id, { dryRun }) : null
      const wouldSend = dryRun ? (r?.newProviders.length ?? 0) : (r?.sent ?? 0)
      if (wouldSend > 0) {
        summary.rematched++
        summary.notificationsSent += wouldSend
        continue
      }
      if (!dryRun) await markLeadNeedsCoverage(l.id, 'coverage_sweep')
      summary.parked++
      summary.parkedLeads.push({ leadId: l.id, city: l.city, state: l.state, zip: l.zip, ageDays })
    } catch (err: any) {
      summary.errors.push({ leadId: l.id, error: err?.message || String(err) })
      console.error(`[CoverageSweep] Lead ${l.id} failed:`, err?.message || err)
    }
  }
  return summary
}
