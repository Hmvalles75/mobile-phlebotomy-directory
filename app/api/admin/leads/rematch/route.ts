import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { rematchOpenLeads, rematchOpenLeadsForProvider } from '@/lib/leadRematch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin one-shot rematch.
 *
 * POST /api/admin/leads/rematch            -> every OPEN/NEEDS_COVERAGE lead <= 14d
 * POST /api/admin/leads/rematch?dryRun=1   -> preview only, nothing written
 * body { providerId } (optional)           -> scope to leads that provider never got
 *
 * The per-provider trigger fires on activation and radius change. This
 * endpoint exists for the case no trigger can see: a matcher rule change
 * (2026-08-25 dropped the state filter and nothing re-routed the OPEN pool).
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  if (!verifyAdminSessionFromCookies(authHeader || cookieHeader)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'
    let providerId: string | undefined
    try {
      const body = await req.json()
      if (body && typeof body.providerId === 'string') providerId = body.providerId
    } catch {
      // no body is fine
    }

    const summary = providerId
      ? await rematchOpenLeadsForProvider(providerId, { dryRun })
      : await rematchOpenLeads({ dryRun })
    console.log(`[admin/rematch] dryRun=${dryRun} provider=${providerId ?? 'all'} scanned=${summary.scanned} newMatches=${summary.leadsWithNewMatches} sent=${summary.notificationsSent} reopened=${summary.flippedToOpen}`)
    return NextResponse.json({ ok: true, ...summary })
  } catch (err: any) {
    console.error('[admin/rematch] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Rematch failed' }, { status: 500 })
  }
}
