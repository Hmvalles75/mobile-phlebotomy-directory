import { NextRequest, NextResponse } from 'next/server'
import { retryFailedNotifications } from '@/lib/leadNotifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Re-sends lead-notification emails that failed (e.g. during a SendGrid
 * outage) so a transient failure self-heals instead of needing a manual
 * re-fire. All the safety logic (health gate, retry cap, still-OPEN check,
 * no-double-send) lives in retryFailedNotifications(). This route is just the
 * scheduled trigger.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await retryFailedNotifications()

    console.log(`[retry-failed-notifications] attempted=${result.attempted} succeeded=${result.succeeded} stillFailed=${result.stillFailed} skipped=${result.skipped} skippedUnhealthy=${result.skippedUnhealthy}`)

    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('[retry-failed-notifications] Handler error:', err?.message || err)
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
