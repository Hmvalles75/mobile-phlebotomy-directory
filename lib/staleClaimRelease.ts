import { prisma } from './prisma'
import { notifyFeaturedProvidersForLead } from './leadNotifications'
import { sendSMSBlastToEligibleProviders } from './smsBlast'
import { sendClaimReleasedEmail } from './notifyClaimReleased'

// SLA: time from claim before an outcome MUST be logged or the claim
// auto-releases. Decision 2026-05-22 — moderate tier (option B from the
// stale-claim-release scoping). STAT is more urgent so the bar is tighter.
//
// Outcome-as-proof-of-life: ANY non-null LeadOutcome value within the
// SLA window saves the claim. Mid-funnel statuses (TEXT_SENT, VOICEMAIL,
// NO_ANSWER, etc.) count as engagement and they reset nothing — the
// claim is permanently "engaged" once the provider logs the first
// outcome. We don't re-check engaged claims; that'd punish providers
// who park leads on SCHEDULED_CALLBACK while patiently working them.
export const SLA_MINUTES_STAT = 120     // 2h
export const SLA_MINUTES_STANDARD = 360 // 6h

// Sanity cap: don't auto-release leads claimed more than 30 days ago.
// Those are dead by other means (DELIVERED via outcome, manually closed,
// etc.) and yanking them now serves no purpose. Belt-and-suspenders
// against weird historical state.
const MAX_CLAIM_AGE_DAYS = 30

export interface StaleCandidate {
  id: string
  fullName: string
  phone: string
  city: string
  state: string
  zip: string
  urgency: 'STAT' | 'STANDARD'
  claimedAt: Date | null
  claimedMinutesAgo: number
  routedToId: string
  providerName: string
  providerEmail: string | null
}

export interface SweepResult {
  scanned: number
  released: number
  notificationFailures: number
  errors: Array<{ leadId: string; error: string }>
}

/**
 * Returns the leads currently eligible for stale-claim auto-release.
 * Pure read — does not modify anything. Used by the dry-run script and
 * by the cron sweep before each individual release.
 */
export async function findStaleClaimCandidates(now: Date = new Date()): Promise<StaleCandidate[]> {
  const nowMs = now.getTime()
  const statCutoff = new Date(nowMs - SLA_MINUTES_STAT * 60_000)
  const standardCutoff = new Date(nowMs - SLA_MINUTES_STANDARD * 60_000)
  const maxAgeCutoff = new Date(nowMs - MAX_CLAIM_AGE_DAYS * 24 * 60 * 60_000)

  const stale = await prisma.lead.findMany({
    where: {
      status: 'CLAIMED',
      outcome: null,           // no outcome logged = no proof of life
      appointmentDate: null,   // safety net: provider booked but forgot the flag
      routedToId: { not: null },
      claimedAt: { gte: maxAgeCutoff },
      OR: [
        { urgency: 'STAT', claimedAt: { lte: statCutoff } },
        { urgency: 'STANDARD', claimedAt: { lte: standardCutoff } },
      ],
    },
    include: {
      provider: { select: { id: true, name: true, email: true, claimEmail: true, notificationEmail: true } },
    },
    orderBy: { claimedAt: 'asc' },
  })

  return stale.map(l => ({
    id: l.id,
    fullName: l.fullName,
    phone: l.phone,
    city: l.city,
    state: l.state,
    zip: l.zip,
    urgency: l.urgency,
    claimedAt: l.claimedAt,
    claimedMinutesAgo: l.claimedAt ? Math.round((nowMs - l.claimedAt.getTime()) / 60_000) : 0,
    routedToId: l.routedToId!,
    providerName: l.provider?.name?.trim() || 'unknown',
    providerEmail: l.provider?.notificationEmail || l.provider?.claimEmail || l.provider?.email || null,
  }))
}

/**
 * Atomically release a single stale claim:
 *   1. Update lead: status -> OPEN, null routedToId, set release audit fields
 *   2. Increment provider's staleReleaseCount, set lastStaleReleaseAt
 * Returns true on success. Throws if the lead is not in the expected state
 * (caller should treat as a race and skip).
 */
async function releaseStaleLead(leadId: string, providerId: string): Promise<void> {
  const now = new Date()
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'OPEN',
        routedToId: null,
        claimedAt: null,           // Null on release. The previous claim is undone; audit lives in releasedFromProviderId + releasedAt. Without this, leads come back to OPEN with stale claimedAt and downstream queries that filter `claimedAt: null` miss them (e.g. recover-unclaimed-leads.ts before the 2026-05-26 fix).
        releasedFromProviderId: providerId,
        releasedAt: now,
        releaseReason: 'stale_claim',
      },
    }),
    prisma.provider.update({
      where: { id: providerId },
      data: {
        staleReleaseCount: { increment: 1 },
        lastStaleReleaseAt: now,
      },
    }),
  ])
}

/**
 * Orchestrator: find all stale candidates, release each, send notifications,
 * re-fire the standard provider fan-out so other providers can pick it up.
 *
 * Notification design notes:
 *  - Original claimer gets a "your claim was auto-released" email. This is
 *    the only direct message they receive about it.
 *  - Re-notification uses the existing fan-out (notifyFeaturedProvidersForLead
 *    + sendSMSBlastToEligibleProviders). It does NOT exclude the original
 *    claimer. The accepted trade-off (2026-05-22): if they re-claim, that's
 *    a signal of intent — give them another shot. If they re-stale, the
 *    next sweep catches it and staleReleaseCount keeps climbing until the
 *    pattern is obvious enough for manual pause.
 *
 * Failure isolation: per-lead try/catch. One bad release doesn't tank the
 * sweep. Notification failures (email or fan-out) are logged but don't
 * roll back the release — the lead is back in the pool either way, and a
 * missed claimer email is far less bad than a stuck CLAIMED status.
 */
export async function runStaleClaimReleaseSweep(opts: { dryRun?: boolean } = {}): Promise<SweepResult> {
  const candidates = await findStaleClaimCandidates()
  const result: SweepResult = {
    scanned: candidates.length,
    released: 0,
    notificationFailures: 0,
    errors: [],
  }

  if (opts.dryRun) {
    return result
  }

  for (const c of candidates) {
    try {
      await releaseStaleLead(c.id, c.routedToId)
      result.released++

      // Email the original claimer. Fire-and-forget — already-released
      // state doesn't depend on this delivering. Counted as a soft failure.
      sendClaimReleasedEmail({
        toEmail: c.providerEmail,
        providerName: c.providerName,
        leadFullName: c.fullName,
        leadCity: c.city,
        leadState: c.state,
        leadZip: c.zip,
        claimedMinutesAgo: c.claimedMinutesAgo,
        slaMinutes: c.urgency === 'STAT' ? SLA_MINUTES_STAT : SLA_MINUTES_STANDARD,
      }).catch((err: any) => {
        result.notificationFailures++
        console.error(`[stale-claim-release] Claimer email failed for lead ${c.id}:`, err.message || err)
      })

      // Re-fire the standard fan-out so other providers can claim.
      // Synchronous so we know if it failed during the sweep window.
      try {
        await notifyFeaturedProvidersForLead(c.id)
      } catch (err: any) {
        result.notificationFailures++
        console.error(`[stale-claim-release] Featured fan-out failed for lead ${c.id}:`, err.message || err)
      }
      try {
        await sendSMSBlastToEligibleProviders({
          id: c.id,
          zip: c.zip,
          urgency: c.urgency,
          city: c.city,
          state: c.state,
        })
      } catch (err: any) {
        result.notificationFailures++
        console.error(`[stale-claim-release] SMS blast failed for lead ${c.id}:`, err.message || err)
      }
    } catch (err: any) {
      result.errors.push({ leadId: c.id, error: err.message || String(err) })
      console.error(`[stale-claim-release] Release failed for lead ${c.id}:`, err.message || err)
    }
  }

  return result
}
