import { NextRequest, NextResponse } from 'next/server'
import { runDormantSweep, MIN_LEADS_SENT, LOOKBACK_DAYS, WARN_GRACE_DAYS } from '@/lib/dormantProviders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Daily dormant-provider sweep. See lib/dormantProviders.ts.
 *
 * Free listings that received MIN_LEADS_SENT+ leads in the last LOOKBACK_DAYS
 * and claimed none are warned by email; WARN_GRACE_DAYS later, still silent,
 * lead routing is paused (eligibleForLeads=false). Either way the dashboard
 * offers a one-click resume. Paying and brand-new providers are never touched.
 *
 * Schedule (vercel.json): daily 14:00 UTC. `?dryRun=1` reports only.
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
    const result = await runDormantSweep({ dryRun })
    const brief = (xs: { name: string; leadsSent: number }[]) => xs.map(x => `${x.name} (${x.leadsSent})`)
    return NextResponse.json({
      ok: true,
      rule: { minLeadsSent: MIN_LEADS_SENT, lookbackDays: LOOKBACK_DAYS, warnGraceDays: WARN_GRACE_DAYS },
      dryRun: result.dryRun,
      candidates: result.candidates,
      warned: brief(result.warned),
      paused: brief(result.paused),
      waiting: brief(result.waiting),
      errors: result.errors,
    })
  } catch (err: any) {
    console.error('[dormant-providers] Handler error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Unknown error' }, { status: 500 })
  }
}
