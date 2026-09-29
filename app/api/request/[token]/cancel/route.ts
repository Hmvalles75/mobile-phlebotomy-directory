import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { closeLead } from '@/lib/closeLead'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

/**
 * POST /api/request/[token]/cancel — the requester cancels their own
 * consumer request from /request/[token]. The token is the authorisation
 * (same model as the outcome survey and check-in links). Closes as
 * CLOSED_PATIENT_CANCELLED via the shared close-lead logic, which cancels any
 * queued head-start sends and emails the claimer "no action needed".
 * Institutional leads have no token and are refused even if one existed.
 */
export async function POST(_req: NextRequest, { params }: { params: { token: string } }) {
  if (!TOKEN_RE.test(params.token)) return NextResponse.json({ ok: false, error: 'Invalid link' }, { status: 400 })
  const lead = await prisma.lead.findFirst({ where: { patientToken: params.token }, select: { id: true, status: true, isHighValue: true } })
  if (!lead || lead.isHighValue || lead.status === 'INSTITUTIONAL_REVIEW') return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 })
  if (!['OPEN', 'CLAIMED', 'NEEDS_COVERAGE'].includes(lead.status)) {
    return NextResponse.json({ ok: false, error: 'This request is already closed.' }, { status: 409 })
  }
  const r = await closeLead({ leadId: lead.id, status: 'CLOSED_PATIENT_CANCELLED', note: 'Cancelled by the patient from their status page', actor: 'patient' })
  if (!r.ok) return NextResponse.json({ ok: false, error: r.code === 'already_terminal' ? 'This request is already closed.' : 'Request not found' }, { status: r.code === 'not_found' ? 404 : 409 })
  return NextResponse.json({ ok: true, status: r.status, providerTold: r.providerTold })
}
