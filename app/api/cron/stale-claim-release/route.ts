import { NextRequest, NextResponse } from 'next/server'
import { runStaleClaimReleaseSweep, SLA_MINUTES_STAT, SLA_MINUTES_STANDARD } from '@/lib/staleClaimRelease'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stale-claim auto-release cron.
 *
 * Scans for leads in CLAIMED status with no outcome logged past the SLA
 * (STAT 2h, STANDARD 6h). Auto-releases each back to OPEN, re-notifies
 * the standard provider fan-out, and emails the original claimer.
 *
 * Why: providers were claiming leads then going silent (Dominguez had
 * 4 claims / 0 actual call attempts logged in the previous month). The
 * net effect was the lead sitting frozen with no other provider able to
 * pick it up. Auto-release recovers those leads and creates back-pressure
 * on providers to log outcomes promptly.
 *
 * Engagement definition: ANY non-null LeadOutcome value within SLA counts
 * as engaged. Mid-funnel outcomes (TEXT_SENT, NO_ANSWER, etc.) save the
 * claim from auto-release. We don't re-check engaged claims.
 *
 * Schedule (vercel.json): every 15 minutes.
 *
 * Security: requires `Authorization: Bearer ${CRON_SECRET}` header.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runStaleClaimReleaseSweep()

    console.log(`[stale-claim-release] scanned=${result.scanned} released=${result.released} expired=${result.expired} notifyFails=${result.notificationFailures} errors=${result.errors.length}`)

    return NextResponse.json({
      ok: true,
      ...result,
      sla: { statMinutes: SLA_MINUTES_STAT, standardMinutes: SLA_MINUTES_STANDARD },
    })
  } catch (err: any) {
    console.error('[stale-claim-release] Handler error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Unknown error' }, { status: 500 })
  }
}
