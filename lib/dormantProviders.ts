/**
 * Dormant-provider sweep: stop routing leads to free listings that keep
 * receiving them and never claim.
 *
 * Why: in the 90 days to 2026-09-07, 20 free providers each received 5+ leads
 * and claimed none, and between them absorbed 22% of every notification sent.
 * Fan-out under 3 providers is a coin flip for the patient, so every slot a
 * dormant listing occupies is a slot a responsive one does not get. One of
 * them was notified 18 times and opened 8; another opened 113 emails and
 * claimed nothing. See docs/findings/lead-diagnostic-2026-09-04.md.
 *
 * Two stages, because a mechanical pause with no warning would also catch
 * partners and people on holiday:
 *   1. WARN: email the provider, set dormantWarnedAt. Dashboard shows a
 *      "keep my leads on" button (POST /api/provider/leads-resume).
 *   2. PAUSE: WARN_GRACE_DAYS later, if they have not resumed and still have
 *      no claim, eligibleForLeads=false, leadsPausedAt set, second email.
 *
 * Resuming (dashboard button, or admin flipping eligibleForLeads on) clears
 * both stamps, sets leadsResumedAt, and the provider is exempt from the sweep
 * for RESUME_GRACE_DAYS. Resume also rematches OPEN leads in their radius via
 * the existing hook.
 *
 * Never touches: paying providers (priorityRouting, isFeatured, featuredTier,
 * stripeCustomerId), providers younger than MIN_AGE_DAYS, removed or
 * notify-disabled providers. Paying non-claimers are a conversation, not a
 * cron (Ponce, PREMIUM, 15 notified 0 claims: flagged in the same report).
 */
import { prisma } from './prisma'
import { SITE_URL } from './seo'
import { emailLeadsPauseWarning, emailLeadsPaused } from './providerEmails'

export const LOOKBACK_DAYS = 90
export const MIN_LEADS_SENT = 5       // distinct leads sent in the lookback
export const MIN_AGE_DAYS = 60        // provider must be at least this old
export const WARN_GRACE_DAYS = 7      // warn -> pause
export const RESUME_GRACE_DAYS = 60   // after a resume, leave them alone this long

// Never warned or paused, whatever the numbers say. Partners who route work
// to us and to other providers by hand, not through the claim button. The
// sweep sees only claims, so it would read them as dormant.
export const DORMANT_EXEMPT_PROVIDER_IDS: string[] = [
  'cmk1sm7od0002lb04gj5d29o7', // Optimal Paramedical Exams (Janelle Lashley) -- completed a NeuroAge research draw via her staff, 2026-09; never a claim-button user
]

const days = (n: number) => new Date(Date.now() - n * 86400000)

export interface DormantCandidate {
  id: string
  name: string
  email: string | null
  primaryState: string | null
  ageDays: number
  leadsSent: number
  claimsInLookback: number
  claimsEver: number
  lastClaimAt: Date | null
  dormantWarnedAt: Date | null
  stage: 'warn' | 'pause' | 'waiting'   // waiting = warned, grace not yet over
}

export async function findDormantCandidates(): Promise<DormantCandidate[]> {
  const providers = await prisma.provider.findMany({
    where: {
      id: { notIn: DORMANT_EXEMPT_PROVIDER_IDS },
      removedAt: null,
      notifyEnabled: true,
      eligibleForLeads: true,
      status: 'VERIFIED',
      priorityRouting: false,
      isFeatured: false,
      featuredTier: null,
      stripeCustomerId: null,
      createdAt: { lte: days(MIN_AGE_DAYS) },
      OR: [{ leadsResumedAt: null }, { leadsResumedAt: { lt: days(RESUME_GRACE_DAYS) } }],
    },
    select: {
      id: true, name: true, email: true, notificationEmail: true, claimEmail: true, primaryState: true, createdAt: true,
      dormantWarnedAt: true,
      leadNotifications: { where: { status: 'SENT', outsideRadius: false, sentAt: { gte: days(LOOKBACK_DAYS) } }, select: { leadId: true } },
      leads: { where: { claimedAt: { not: null } }, select: { claimedAt: true } },
    },
  })
  const out: DormantCandidate[] = []
  for (const p of providers) {
    const leadsSent = new Set(p.leadNotifications.map(n => n.leadId)).size
    if (leadsSent < MIN_LEADS_SENT) continue
    const claimsInLookback = p.leads.filter(l => l.claimedAt! >= days(LOOKBACK_DAYS)).length
    if (claimsInLookback > 0) continue
    const lastClaimAt = p.leads.map(l => l.claimedAt!).sort((a, b) => b.getTime() - a.getTime())[0] || null
    const stage: DormantCandidate['stage'] = !p.dormantWarnedAt ? 'warn'
      : p.dormantWarnedAt <= days(WARN_GRACE_DAYS) ? 'pause' : 'waiting'
    out.push({
      id: p.id, name: p.name.trim(), email: p.notificationEmail || p.claimEmail || p.email, primaryState: p.primaryState,
      ageDays: Math.round((Date.now() - p.createdAt.getTime()) / 86400000),
      leadsSent, claimsInLookback, claimsEver: p.leads.length, lastClaimAt, dormantWarnedAt: p.dormantWarnedAt, stage,
    })
  }
  return out.sort((a, b) => b.leadsSent - a.leadsSent)
}

export interface DormantSweepResult {
  dryRun: boolean
  candidates: number
  warned: DormantCandidate[]
  paused: DormantCandidate[]
  waiting: DormantCandidate[]
  errors: { id: string; error: string }[]
}

export async function runDormantSweep(opts: { dryRun?: boolean } = {}): Promise<DormantSweepResult> {
  const dryRun = !!opts.dryRun
  const cands = await findDormantCandidates()
  const result: DormantSweepResult = { dryRun, candidates: cands.length, warned: [], paused: [], waiting: [], errors: [] }
  const dashboardUrl = `${SITE_URL.replace(/\/+$/, '')}/dashboard/login`

  for (const c of cands) {
    try {
      if (c.stage === 'waiting') { result.waiting.push(c); continue }
      if (c.stage === 'warn') {
        result.warned.push(c)
        if (dryRun) continue
        await prisma.provider.update({ where: { id: c.id }, data: { dormantWarnedAt: new Date() } })
        if (c.email) await emailLeadsPauseWarning(c.email, c.name, c.leadsSent, LOOKBACK_DAYS, WARN_GRACE_DAYS, dashboardUrl)
        continue
      }
      // pause
      result.paused.push(c)
      if (dryRun) continue
      await prisma.provider.update({
        where: { id: c.id },
        data: { eligibleForLeads: false, leadsPausedAt: new Date(), leadsPausedReason: `dormant: ${c.leadsSent} leads sent in ${LOOKBACK_DAYS}d, 0 claimed` },
      })
      if (c.email) await emailLeadsPaused(c.email, c.name, c.leadsSent, LOOKBACK_DAYS, dashboardUrl)
    } catch (err: any) {
      result.errors.push({ id: c.id, error: err?.message || String(err) })
      console.error(`[DormantSweep] ${c.name} (${c.id}) failed:`, err?.message || err)
    }
  }
  console.log(`[DormantSweep] dryRun=${dryRun} candidates=${cands.length} warned=${result.warned.length} paused=${result.paused.length} waiting=${result.waiting.length} errors=${result.errors.length}`)
  return result
}

/**
 * Provider (or admin on their behalf) turns leads back on. Clears the dormant
 * stamps and starts the resume grace period. Caller handles the rematch.
 */
export async function resumeLeads(providerId: string, by: 'provider' | 'admin'): Promise<{ wasPaused: boolean; wasWarned: boolean }> {
  const before = await prisma.provider.findUnique({ where: { id: providerId }, select: { leadsPausedAt: true, dormantWarnedAt: true } })
  await prisma.provider.update({
    where: { id: providerId },
    data: { eligibleForLeads: true, leadsPausedAt: null, leadsPausedReason: null, dormantWarnedAt: null, leadsResumedAt: new Date() },
  })
  console.log(`[DormantSweep] leads resumed for ${providerId} by ${by} (wasPaused=${!!before?.leadsPausedAt} wasWarned=${!!before?.dormantWarnedAt})`)
  return { wasPaused: !!before?.leadsPausedAt, wasWarned: !!before?.dormantWarnedAt }
}
