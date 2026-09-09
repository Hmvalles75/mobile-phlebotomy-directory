import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { notifyFeaturedProvidersForLead } from '@/lib/leadNotifications'
import { markLeadNeedsCoverage } from '@/lib/coverageGap'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin: an INSTITUTIONAL_REVIEW lead turned out to be an ordinary patient.
 * Flip it to OPEN and run the normal provider fan-out. Bypasses the 4-day
 * notification cap (bounded at 14 days) since review may take a day or two.
 * If nobody matches, it is parked as NEEDS_COVERAGE like any other lead.
 */
export async function POST(req: NextRequest, { params }: { params: { leadId: string } }) {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  if (!verifyAdminSessionFromCookies(authHeader || cookieHeader)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const flipped = await prisma.lead.updateMany({
      where: { id: params.leadId, status: 'INSTITUTIONAL_REVIEW' },
      data: { status: 'OPEN' },
    })
    if (flipped.count === 0) {
      return NextResponse.json({ ok: false, error: 'Lead is not in INSTITUTIONAL_REVIEW' }, { status: 409 })
    }
    const sent = await notifyFeaturedProvidersForLead(params.leadId, { bypassAgeCap: true })
    let parked = false
    if (sent === 0) {
      const rows = await prisma.leadNotification.count({ where: { leadId: params.leadId } })
      if (rows === 0) parked = await markLeadNeedsCoverage(params.leadId, 'submit_no_match')
    }
    console.log(`[admin/release-to-providers] lead ${params.leadId} -> OPEN, sent=${sent}, parked=${parked}`)
    return NextResponse.json({ ok: true, sent, parked })
  } catch (err: any) {
    console.error('[admin/release-to-providers] Error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Release failed' }, { status: 500 })
  }
}
