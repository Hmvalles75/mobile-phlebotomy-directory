import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { closeLead, CLOSE_STATUSES, type CloseStatus } from '@/lib/closeLead'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin: close a lead by hand from the diagnostic page.
 *
 * Until 2026-09-23 the only way to close junk, a duplicate, or a patient who
 * went quiet was a one-off script. The logic now lives in lib/closeLead.ts
 * (shared with the requester's own cancel on /request/[token]): nothing is
 * deleted or re-offered, routedToId is kept, a CLAIMED lead's provider is
 * told "no action needed", and queued head-start sends are cancelled.
 *
 * POST body: { status, note, junk?: boolean }
 */
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
    if (!CLOSE_STATUSES.includes(status) || status === 'CLOSED_PATIENT_CANCELLED') {
      return NextResponse.json({ ok: false, error: `status must be one of ${CLOSE_STATUSES.filter(s => s !== 'CLOSED_PATIENT_CANCELLED').join(', ')}` }, { status: 400 })
    }
    if (!note) return NextResponse.json({ ok: false, error: 'A note is required' }, { status: 400 })

    const r = await closeLead({ leadId: params.leadId, status, note, actor: 'admin', junk })
    if (!r.ok) {
      return r.code === 'not_found'
        ? NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
        : NextResponse.json({ ok: false, error: `Lead is already ${r.status}` }, { status: 409 })
    }
    return NextResponse.json({ ok: true, from: r.from, status: r.status, providerTold: r.providerTold })
  } catch (err: any) {
    console.error('[admin/close] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Close failed' }, { status: 500 })
  }
}
