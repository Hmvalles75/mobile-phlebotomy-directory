/**
 * Provider response score cron
 *
 * GET /api/cron/provider-score          (Vercel cron, daily 12:30 UTC)
 * GET /api/cron/provider-score?dry=1    (compute and report, write nothing)
 *
 * Recomputes Provider.responseScore / responseStats from the last 90 days.
 * See lib/providerScore.ts for the formula.
 */
import { NextRequest, NextResponse } from 'next/server'
import { runProviderScoring } from '@/lib/providerScore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runProviderScoring({ dryRun: req.nextUrl.searchParams.get('dry') === '1' })
    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    console.error('[provider-score] Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'scoring failed' }, { status: 500 })
  }
}
