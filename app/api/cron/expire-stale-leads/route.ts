/**
 * Unclaimed-lead expiry cron
 *
 * GET  /api/cron/expire-stale-leads          (Vercel cron, daily 13:00 UTC)
 * GET  /api/cron/expire-stale-leads?dry=1    (report only, nothing written)
 * POST                                       (manual invocation, same as GET)
 *
 * OPEN leads older than STALE_DAYS (4, was 14 until 2026-09-29) become
 * EXPIRED_NO_RESPONSE and the requester is emailed next steps. Logic lives in
 * lib/expireStaleLeads.ts so it can be dry-run from a script as well.
 *
 * Vercel crons invoke with GET. This file exported only POST from its first
 * commit, so the schedule 405'd every day and the job never ran once: on
 * 2026-09-04 there were 166 OPEN leads with no notification row going back
 * 108 days. GET is the cron entry; POST stays for manual invocation.
 */
import { NextRequest, NextResponse } from 'next/server'
import { runExpireStaleLeads, STALE_DAYS } from '@/lib/expireStaleLeads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handle(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const dryRun = req.nextUrl.searchParams.get('dry') === '1'
    const result = await runExpireStaleLeads({ dryRun })
    return NextResponse.json({ ok: true, staleDays: STALE_DAYS, ...result })
  } catch (error: any) {
    console.error('[ExpireStaleLeads] Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to expire stale leads' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) { return handle(req) }
export async function POST(req: NextRequest) { return handle(req) }
