import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { renotifyOpenLead } from '@/lib/leadNotifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin: re-send an OPEN lead to the providers who already received it, with
 * "still unclaimed" framing.
 *
 * POST /api/admin/leads/:leadId/renotify             -> send
 * POST /api/admin/leads/:leadId/renotify?dryRun=1    -> list who would get it
 * body { includeNew?: boolean }                      -> also send to providers
 *                                                       the matcher would add today
 *
 * Why: the retry cron deliberately never re-sends a lead to a provider who has
 * a SENT row, and the rematch path sends only to providers who have never had
 * it. Neither can nudge four providers who opened the email and did nothing,
 * which is where a Miami patient sat for three days in September 2026. A
 * provider is skipped if they were notified in the last MIN_RENOTIFY_HOURS.
 */
export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  if (!verifyAdminSessionFromCookies(authHeader || cookieHeader)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'
    let includeNew = false
    try {
      const body = await req.json()
      includeNew = body?.includeNew === true
    } catch {
      // no body is fine
    }
    const result = await renotifyOpenLead(params.leadId, { includeNew, dryRun })
    const status = result.reason ? 409 : 200
    return NextResponse.json({ ok: !result.reason, ...result }, { status })
  } catch (err: any) {
    console.error('[admin/renotify] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Renotify failed' }, { status: 500 })
  }
}
