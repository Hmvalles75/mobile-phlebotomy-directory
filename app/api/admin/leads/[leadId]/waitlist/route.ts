import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin: put a lead on the coverage waitlist by hand, for a requester who
 * replied "YES" by email instead of tapping the link (or whose lead predates
 * the link). Same stamp as /api/waitlist/[token], source 'admin'.
 */
export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  if (!verifyAdminSessionFromCookies(authHeader || cookieHeader)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const lead = await prisma.lead.findUnique({ where: { id: params.leadId }, select: { id: true, status: true, waitlistedAt: true } })
  if (!lead) return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
  if (lead.waitlistedAt) return NextResponse.json({ ok: true, alreadyWaitlistedAt: lead.waitlistedAt })
  await prisma.lead.update({ where: { id: lead.id }, data: { waitlistedAt: new Date(), waitlistSource: 'admin' } })
  console.log(`[waitlist] ${lead.id} added by admin`)
  return NextResponse.json({ ok: true })
}
