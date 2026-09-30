import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

/**
 * GET /api/waitlist/[token] — one tap from the "We're Expanding" email.
 *
 * The token is the requester's own patientToken (same authorisation as
 * /request/[token]). Stamps waitlistedAt (first tap wins) and sends them to
 * their status page, which now says they are on the list. Until 2026-09-30
 * the email asked for a "YES" reply that landed in Hector's inbox and was
 * recorded nowhere.
 */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  if (!TOKEN_RE.test(params.token)) return NextResponse.redirect(new URL('/request-blood-draw', _req.url), 302)
  const lead = await prisma.lead.findFirst({ where: { patientToken: params.token }, select: { id: true, status: true, isHighValue: true, waitlistedAt: true } })
  if (!lead || lead.isHighValue || lead.status === 'INSTITUTIONAL_REVIEW') return NextResponse.redirect(new URL('/request-blood-draw', _req.url), 302)
  if (!lead.waitlistedAt) {
    await prisma.lead.updateMany({ where: { id: lead.id, waitlistedAt: null }, data: { waitlistedAt: new Date(), waitlistSource: 'link' } })
    console.log(`[waitlist] ${lead.id} joined via link`)
  }
  return NextResponse.redirect(new URL(`/request/${params.token}`, _req.url), 302)
}
