import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { patientReroute } from '@/lib/patientReroute'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

/**
 * POST /api/request/[token]/no-answer — the requester says the provider who
 * accepted has not contacted them. Releases the claim and re-offers the
 * request (lib/patientReroute.ts). Gated on hours since the claim and on a
 * per-lead cap; the page only shows the button when the gate has passed, the
 * route enforces it anyway.
 */
export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  if (!TOKEN_RE.test(params.token)) return NextResponse.json({ ok: false, error: 'Invalid link' }, { status: 400 })
  const lead = await prisma.lead.findFirst({ where: { patientToken: params.token }, select: { id: true, status: true, isHighValue: true } })
  if (!lead || lead.isHighValue || lead.status === 'INSTITUTIONAL_REVIEW') return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 })

  const r = await patientReroute({ leadId: lead.id, source: 'status_page' })
  if (r.ok) return NextResponse.json({ ok: true, newProvidersNotified: r.newProvidersNotified, remindersSent: r.remindersSent })
  const msg: Record<string, string> = {
    not_claimed: 'No provider is holding this request right now.',
    booked: 'This request is marked as booked. If that is wrong, reply to your confirmation email.',
    too_early: 'Please give the provider a little longer before sending it on.',
    cap: 'This request has already been sent on twice. Reply to your confirmation email and Hector will place it by hand.',
    race: 'This request just changed. Reload the page.',
    not_found: 'Request not found',
  }
  return NextResponse.json({ ok: false, error: msg[r.code || 'race'] || msg.race }, { status: r.code === 'not_found' ? 404 : 409 })
}
