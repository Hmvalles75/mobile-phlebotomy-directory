import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailAdmin } from '@/lib/adminEmail'
import { sendWaitlistedRequestNow } from '@/lib/coverageWaitlist'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

/**
 * GET /api/waitlist/[token]/go — "Send my request now" from the coverage-
 * arrived email. Reopens the parked lead and routes it to whoever covers the
 * ZIP today, then lands on the status page, which shows "Sent to providers".
 * If nothing could be sent (the provider left again), the lead stays parked,
 * the admin is told, and the status page explains.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  if (!TOKEN_RE.test(params.token)) return NextResponse.redirect(new URL('/request-blood-draw', req.url), 302)
  const lead = await prisma.lead.findFirst({ where: { patientToken: params.token }, select: { id: true, status: true, isHighValue: true, fullName: true, city: true, state: true } })
  if (!lead || lead.isHighValue) return NextResponse.redirect(new URL('/request-blood-draw', req.url), 302)
  if (lead.status === 'NEEDS_COVERAGE') {
    const r = await sendWaitlistedRequestNow(lead.id)
    console.log(`[waitlist] ${lead.id} go: sent=${r?.sent ?? 'n/a'} reparked=${r?.reparked ?? 'n/a'}`)
    if (!r || r.sent === 0) {
      emailAdmin(
        `Waitlist "send now" found nobody: ${lead.fullName} (${lead.city}, ${lead.state})`,
        `The requester tapped "send my request now" from the coverage-arrived email but no provider matched today. Lead stays NEEDS_COVERAGE.\n\n${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/admin/lead-diagnostic/${lead.id}`,
      ).catch(() => {})
    }
  }
  // Any other status: already sent, claimed, closed. The status page says which.
  return NextResponse.redirect(new URL(`/request/${params.token}`, req.url), 302)
}
