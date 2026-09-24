import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { sendTransactionalEmail } from '@/lib/sendTransactionalEmail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin: close a lead by hand from the diagnostic page.
 *
 * Until 2026-09-23 the only way to close junk, a duplicate, or a patient who
 * went quiet was a one-off script (Victor Reeves x3, Neal Premier's Matthews
 * patient). Nothing here is deleted or re-offered; the claim history on
 * routedToId is kept. A lead flagged junk also loses its high-value flag and
 * estimated value so it drops out of the "high-value never reached a
 * provider" count.
 *
 * POST body: { status, note, junk?: boolean }
 */
const CLOSE_STATUSES = ['CLOSED_DUPLICATE', 'CLOSED_DECLINED', 'CLOSED_PRICING_ONLY', 'CLOSED_UNCONFIRMED', 'EXPIRED_NO_RESPONSE'] as const
type CloseStatus = typeof CLOSE_STATUSES[number]
const TERMINAL = new Set<string>([...CLOSE_STATUSES, 'COMPLETED'])
/** What the claiming provider is told; the admin's note stays internal. */
const PROVIDER_REASON: Record<CloseStatus, string> = {
  CLOSED_DUPLICATE: 'It was a duplicate of another request or not a genuine patient.',
  CLOSED_DECLINED: 'The patient has decided not to go ahead.',
  CLOSED_PRICING_ONLY: 'The patient only wanted a price and is not booking.',
  CLOSED_UNCONFIRMED: 'The patient has not responded to anyone and I am not going to keep it open.',
  EXPIRED_NO_RESPONSE: 'The request has aged out.',
}

export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  if (!verifyAdminSessionFromCookies(authHeader || cookieHeader)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const status = body?.status as CloseStatus
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : ''
    const junk = body?.junk === true
    if (!CLOSE_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: `status must be one of ${CLOSE_STATUSES.join(', ')}` }, { status: 400 })
    }
    if (!note) {
      return NextResponse.json({ ok: false, error: 'A note is required' }, { status: 400 })
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
      select: {
        status: true, outcomeNotes: true, fullName: true, city: true, state: true,
        provider: { select: { name: true, notificationEmail: true, claimEmail: true, email: true, notifyEnabled: true } },
      },
    })
    if (!lead) return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
    if (TERMINAL.has(lead.status)) {
      return NextResponse.json({ ok: false, error: `Lead is already ${lead.status}` }, { status: 409 })
    }

    const stamp = `Closed by admin ${new Date().toISOString().slice(0, 10)}${junk ? ' (junk)' : ''}: ${note}`
    await prisma.lead.update({
      where: { id: params.leadId },
      data: {
        status,
        outcomeUpdatedAt: new Date(),
        outcomeNotes: lead.outcomeNotes ? `${lead.outcomeNotes}\n\n${stamp}` : stamp,
        ...(junk ? { isHighValue: false, estimatedValueCents: 0 } : {}),
      },
    })
    console.log(`[admin/close] lead ${params.leadId}: ${lead.status} -> ${status}${junk ? ' (junk)' : ''}`)

    // A CLAIMED lead disappears from the claimer's dashboard queue the moment
    // it closes; tell them so they stop working it. The crons and one-tap
    // links already ignore non-CLAIMED leads, so this is the only loose end.
    let providerTold = false
    const to = lead.provider?.notificationEmail || lead.provider?.claimEmail || lead.provider?.email
    if (lead.status === 'CLAIMED' && to && lead.provider?.notifyEnabled !== false) {
      const why = PROVIDER_REASON[status]
      const text = `Hi ${lead.provider!.name.trim()},

I've closed the request from ${lead.fullName} in ${lead.city}, ${lead.state} that you accepted. ${why} No action needed on your end, and nothing is held against you for it.

Hector Valles
MobilePhlebotomy.org`
      const err = await sendTransactionalEmail({
        to,
        subject: `Closed: ${lead.fullName} (${lead.city}, ${lead.state}) — no action needed`,
        text,
        html: `<p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
      })
      providerTold = !err
      if (err) console.error(`[admin/close] provider notice failed for ${params.leadId}: ${err}`)
    }
    return NextResponse.json({ ok: true, from: lead.status, status, providerTold })
  } catch (err: any) {
    console.error('[admin/close] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Close failed' }, { status: 500 })
  }
}
