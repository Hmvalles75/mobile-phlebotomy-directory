import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * "I'm working it" — one-tap engagement signal for a claimed lead.
 *
 * Sets outcome = WORKING_IT (status stays CLAIMED) so the stale-claim cron
 * stops auto-releasing a lead the provider is actively working offline. The
 * cron treats any non-null outcome as "engaged" and skips it, so no cron change
 * is needed. Overwritten later when the provider logs a real outcome.
 *
 * Session-authenticated: only the provider holding the claim can mark it, and
 * only while the lead is still CLAIMED with no terminal outcome already logged.
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { leadId } = await req.json()
    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'leadId required' }, { status: 400 })
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, routedToId: true, status: true, outcome: true },
    })
    if (!lead) {
      return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    }
    if (lead.routedToId !== session.providerId) {
      return NextResponse.json({ ok: false, error: 'This lead is not assigned to you' }, { status: 403 })
    }
    if (lead.status !== 'CLAIMED') {
      return NextResponse.json({ ok: false, error: 'Lead is not currently claimed' }, { status: 409 })
    }

    // If a real outcome is already logged the claim is already protected —
    // don't clobber it.
    if (lead.outcome && lead.outcome !== 'WORKING_IT') {
      return NextResponse.json({ ok: true, outcome: lead.outcome, alreadyLogged: true })
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { outcome: 'WORKING_IT' },
    })
    return NextResponse.json({ ok: true, outcome: 'WORKING_IT' })
  } catch (err: any) {
    console.error('[lead-working] error:', err?.message || err)
    return NextResponse.json({ ok: false, error: 'Failed to update' }, { status: 500 })
  }
}
