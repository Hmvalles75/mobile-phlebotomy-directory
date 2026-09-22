import { NextRequest, NextResponse } from 'next/server'
import { runSoftOutcomeNudgeSweep, NUDGE_AFTER_HOURS, MAX_CLAIM_AGE_DAYS } from '@/lib/softOutcomeNudge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Soft-outcome nudge cron. Hourly (vercel.json).
 *
 * GET /api/cron/soft-outcome-nudge          run
 * GET /api/cron/soft-outcome-nudge?dry=1    count only, send nothing
 *
 * Two days after a provider logs a soft outcome (text sent, no answer,
 * voicemail, email sent, working it, callback), one nudge to the provider and
 * one check-in to the patient, each once per claim. See lib/softOutcomeNudge.ts.
 * Nothing here changes a lead's status.
 *
 * Security: requires `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const dryRun = req.nextUrl.searchParams.get('dry') === '1'
    const result = await runSoftOutcomeNudgeSweep({ dryRun })
    return NextResponse.json({ ...result, nudgeAfterHours: NUDGE_AFTER_HOURS, maxClaimAgeDays: MAX_CLAIM_AGE_DAYS })
  } catch (error: any) {
    console.error('[soft-outcome-nudge] job failed:', error?.message || error)
    return NextResponse.json({ error: 'Job failed', detail: String(error?.message || error).slice(0, 300) }, { status: 500 })
  }
}
