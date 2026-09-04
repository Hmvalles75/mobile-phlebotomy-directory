import { NextRequest, NextResponse } from 'next/server'
import { runCoverageSweep } from '@/lib/leadRematch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Daily coverage sweep.
 *
 * OPEN leads that never had a single notification SENT get one rematch against
 * today's provider pool (a provider may have signed up or widened their radius
 * since submit). Anything still unreached is parked as NEEDS_COVERAGE so it
 * becomes recruitment inventory instead of an indistinguishable OPEN row.
 *
 * Why: the live submit path never wrote NEEDS_COVERAGE, so 24 unreached leads
 * sat OPEN in the 30 days to 2026-09-04 and the coverage-gap count read zero.
 * See lib/leadRematch.ts and docs/findings/lead-diagnostic-2026-09-04.md.
 *
 * Schedule (vercel.json): daily 13:30 UTC, after expire-stale-leads.
 * `?dryRun=1` reports without writing. Vercel crons call GET.
 * Security: requires `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'
    const result = await runCoverageSweep({ dryRun })
    console.log(`[coverage-sweep] dryRun=${dryRun} scanned=${result.scanned} rematched=${result.rematched} sent=${result.notificationsSent} parked=${result.parked} errors=${result.errors.length}`)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('[coverage-sweep] Handler error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Unknown error' }, { status: 500 })
  }
}
