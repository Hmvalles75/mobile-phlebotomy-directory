import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import sg from '@sendgrid/mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

// Only verified SendGrid sender (same pattern as lib/adminEmail + corporate/submit).
const FROM = 'hector@mobilephlebotomy.org'

// Admin-only via the shared cookie-session. Not reachable from provider code.
function isAdmin(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  return verifyAdminSessionFromCookies(authHeader || cookieHeader)
}

/**
 * Email a coverage-request lead from hector@ (Reply-To hector@), then log a
 * ContactAttempt as the audit trail.
 *
 * Condition: the ContactAttempt is written ONLY after a confirmed 2xx from
 * SendGrid. A failed send returns an error (surfaced in the modal) and writes
 * nothing — no attempt row, no status/lastContactedAt change.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = params
    const { subject, body } = await req.json()
    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ success: false, error: 'Subject and body are required' }, { status: 400 })
    }
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({ success: false, error: 'Email is not configured on this environment' }, { status: 503 })
    }

    const lead = await prisma.coverageRequest.findUnique({
      where: { id },
      select: { id: true, email: true, status: true },
    })
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Coverage request not found' }, { status: 404 })
    }
    if (!lead.email) {
      return NextResponse.json({ success: false, error: 'This lead has no email address on file' }, { status: 400 })
    }

    // ---- Send FIRST. Nothing is written unless SendGrid confirms 2xx. ----
    let sgStatus = 0
    try {
      const [resp] = await sg.send({
        to: lead.email,
        from: FROM,
        replyTo: FROM,
        subject: subject.trim(),
        text: body,
      })
      sgStatus = resp?.statusCode ?? 0
    } catch (sendErr: any) {
      const detail = sendErr?.response?.body?.errors?.[0]?.message || sendErr?.message || 'Send failed'
      console.error('[corporate-inquiries/email] send failed:', detail)
      return NextResponse.json({ success: false, error: `Email not sent: ${detail}` }, { status: 502 })
    }
    if (sgStatus < 200 || sgStatus >= 300) {
      return NextResponse.json({ success: false, error: `Email not sent (SendGrid returned ${sgStatus})` }, { status: 502 })
    }

    // ---- Confirmed sent — write the audit row + advance status. ----
    const now = new Date()
    const attempt = await prisma.contactAttempt.create({
      data: {
        leadId: id,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        subject: subject.trim(),
        note: body, // full body stored for the audit trail
        occurredAt: now,
      },
    })
    await prisma.coverageRequest.update({
      where: { id },
      data: {
        lastContactedAt: now,
        ...(lead.status === 'NEW' ? { status: 'CONTACTED' } : {}),
      },
    })

    return NextResponse.json({ success: true, attempt, sentTo: lead.email })
  } catch (error: any) {
    console.error('[corporate-inquiries/email] error:', error?.message || error)
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
