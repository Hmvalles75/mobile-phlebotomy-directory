import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Admin-only via the shared cookie-session (same as every other
// /api/admin/corporate-inquiries route). Not reachable from provider code.
function isAdmin(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  return verifyAdminSessionFromCookies(authHeader || cookieHeader)
}

const CHANNELS = ['EMAIL', 'PHONE', 'OTHER']
const DIRECTIONS = ['OUTBOUND', 'INBOUND']

/**
 * Log a contact attempt against a coverage request (institutional lead).
 * Advances status NEW -> CONTACTED and updates lastContactedAt (drives
 * staleness). Used both for real logging and for backfilling leads already
 * emailed from Gmail (pass a back-dated occurredAt).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = params
    const body = await req.json()

    const channel = CHANNELS.includes(body.channel) ? body.channel : 'EMAIL'
    const direction = DIRECTIONS.includes(body.direction) ? body.direction : 'OUTBOUND'
    const subject: string | null = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : null
    const note: string | null = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date()
    if (isNaN(occurredAt.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid date' }, { status: 400 })
    }

    const lead = await prisma.coverageRequest.findUnique({
      where: { id },
      select: { id: true, status: true, lastContactedAt: true },
    })
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Coverage request not found' }, { status: 404 })
    }

    const attempt = await prisma.contactAttempt.create({
      data: { leadId: id, channel: channel as any, direction: direction as any, subject, note, occurredAt },
    })

    // Keep lastContactedAt as the most recent touch; advance out of NEW.
    const nextLastContacted =
      !lead.lastContactedAt || occurredAt > lead.lastContactedAt ? occurredAt : lead.lastContactedAt
    await prisma.coverageRequest.update({
      where: { id },
      data: {
        lastContactedAt: nextLastContacted,
        ...(lead.status === 'NEW' ? { status: 'CONTACTED' } : {}),
      },
    })

    return NextResponse.json({ success: true, attempt })
  } catch (error: any) {
    console.error('[corporate-inquiries/contact] error:', error?.message || error)
    return NextResponse.json({ success: false, error: 'Failed to log contact' }, { status: 500 })
  }
}
