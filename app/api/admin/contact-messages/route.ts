import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

/**
 * Admin view over the /contact form.
 *
 * The form was fixed on 2026-08-25 and shipped without a panel, on the
 * reasoning that the alert email carries the whole message. Within a day a
 * corporate event inquiry (SHE Media, ~80 attendees) arrived through it and was
 * invisible in /admin, because that panel reads coverage_requests and this is a
 * different table. Recording a message and never showing it is only a quieter
 * version of losing it.
 *
 * The response also carries coverage requests whose admin alert never sent
 * (`adminNotifiedAt IS NULL`). Those columns exist to make "nobody was told" a
 * query rather than a guess, and this is the screen that asks it.
 */
function isAdmin(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  return verifyAdminSessionFromCookies(authHeader || cookieHeader)
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const includeSpam = req.nextUrl.searchParams.get('includeSpam') === 'true'

    const messages = await prisma.contactMessage.findMany({
      where: includeSpam ? {} : { status: { not: 'SPAM' } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    // Anything that arrived without an alert going out, on either intake.
    const [unnotifiedMessages, unnotifiedCoverage] = await Promise.all([
      prisma.contactMessage.count({ where: { notifiedAt: null, status: { not: 'SPAM' } } }),
      prisma.coverageRequest.count({ where: { adminNotifiedAt: null } }),
    ])

    const newCount = messages.filter(m => m.status === 'NEW').length

    return NextResponse.json({
      success: true,
      messages,
      counts: {
        new: newCount,
        unnotifiedMessages,
        // Historic rows predate the tracking columns, so this is only
        // meaningful for requests submitted after 2026-08-26.
        unnotifiedCoverage,
        attention: newCount + unnotifiedMessages,
      },
    })
  } catch (error: any) {
    console.error('[admin/contact-messages] GET failed:', error?.message || error)
    return NextResponse.json({ success: false, error: 'Failed to load messages' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, status } = await req.json()
    const allowed = ['NEW', 'READ', 'REPLIED', 'SPAM']
    if (!id || !allowed.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    })
    return NextResponse.json({ success: true, message: updated })
  } catch (error: any) {
    console.error('[admin/contact-messages] PATCH failed:', error?.message || error)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}
