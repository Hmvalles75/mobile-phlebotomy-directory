/**
 * NEEDS_COVERAGE bookkeeping for the live (non-SMS) lead path.
 *
 * Until 2026-09 the only writers of NEEDS_COVERAGE lived in the SMS
 * qualification flow (lib/optedInRouting.ts, lead-followups cron step 5), which
 * the public intake form never enters. The live submit route left a lead OPEN
 * when zero providers matched, so "no coverage existed" and "providers were
 * notified and ignored it" were the same row in the database. The 30-day
 * diagnostic on 2026-09-04 found 24 such leads and a weekly no-coverage count
 * that had read zero forever. See docs/findings/lead-diagnostic-2026-09-04.md.
 *
 * Deliberately email-free: the submit route already alerts the admin and sends
 * the patient an expansion email; the daily sweep reports in aggregate.
 */
import { prisma } from './prisma'
import { DispatchTaskReason, LeadStatus } from '@prisma/client'

export type CoverageGapSource = 'submit_no_match' | 'coverage_sweep'

/**
 * Park an OPEN lead as NEEDS_COVERAGE and record a dispatch task so it shows
 * up as recruitment inventory. Idempotent: a lead that is no longer OPEN is
 * left alone (someone may have claimed it in the meantime), and an existing
 * open task is not duplicated.
 *
 * Returns true when the status actually changed.
 */
export async function markLeadNeedsCoverage(leadId: string, source: CoverageGapSource): Promise<boolean> {
  const flipped = await prisma.lead.updateMany({
    where: { id: leadId, status: LeadStatus.OPEN },
    data: { status: LeadStatus.NEEDS_COVERAGE },
  })
  if (flipped.count === 0) return false

  const existing = await prisma.dispatchTask.findFirst({
    where: { leadId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    select: { id: true },
  })
  if (!existing) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { zip: true, city: true, state: true } })
    await prisma.dispatchTask.create({
      data: {
        leadId,
        status: 'OPEN',
        reason: DispatchTaskReason.NO_OPTED_IN_PROVIDERS,
        notes: `No eligible provider matched (${source}). ${lead?.city ?? ''}, ${lead?.state ?? ''} ${lead?.zip ?? ''}`.trim(),
      },
    })
  }
  console.log(`[CoverageGap] Lead ${leadId} -> NEEDS_COVERAGE (${source})`)
  return true
}
