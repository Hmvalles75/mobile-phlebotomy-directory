import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

// Admin auth via the shared cookie-session (same as /api/admin/leads). The
// previous ADMIN_TOKEN bearer check was broken: ADMIN_TOKEN was never set, so
// it expected the literal 'default-admin-token' while the panel sends the
// session token — 401ing every request and showing an empty Coverage Requests
// panel despite rows existing.
function validateAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  return verifyAdminSessionFromCookies(authHeader || cookieHeader)
}

/**
 * Manually log an institutional lead that arrived outside the web form —
 * cold email, phone call, conference, a warm intro. Without this, those leads
 * live only in Gmail and the channel mix in `attributionSource` is computed on
 * a denominator that silently omits them (NeuroAge was invisible this way).
 *
 * `attributionSource` is required and admin-supplied: for an off-site lead
 * there is nothing to infer it from, and defaulting to 'direct' would be a
 * fabricated data point.
 */
export async function POST(req: NextRequest) {
  if (!validateAdminToken(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const required = ['organizationName', 'contactName', 'email', 'attributionSource'] as const
    const missing = required.filter(f => !String(body[f] ?? '').trim())
    if (missing.length) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const created = await prisma.coverageRequest.create({
      data: {
        organizationName: String(body.organizationName).trim(),
        contactName: String(body.contactName).trim(),
        email: String(body.email).trim(),
        phone: body.phone ? String(body.phone).trim() : null,
        location: body.location ? String(body.location).trim() : 'Not specified',
        statesNeeded: body.statesNeeded ? String(body.statesNeeded).trim() : null,
        estimatedVolume: body.estimatedVolume ? String(body.estimatedVolume).trim() : 'Not sure yet',
        drawType: body.drawType ? String(body.drawType).trim() : 'Other',
        details: body.details ? String(body.details).trim() : null,
        attributionSource: String(body.attributionSource).trim(),
        intakeForm: 'admin-manual',
        // Off-site origin: there is no landing page or referrer to record.
        landingPage: null,
        referrer: null,
        // Logged by admin means we already know about it — treat as contacted
        // so it doesn't sit in the NEW queue as if it were untouched.
        status: 'CONTACTED',
        lastContactedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, inquiry: created })
  } catch (error: any) {
    console.error('Failed to create manual coverage request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  // Validate admin token
  if (!validateAdminToken(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const inquiries = await prisma.coverageRequest.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        contactAttempts: { orderBy: { occurredAt: 'desc' } },
      },
    })

    return NextResponse.json({
      success: true,
      inquiries
    })
  } catch (error: any) {
    console.error('Failed to fetch corporate inquiries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inquiries' },
      { status: 500 }
    )
  }
}
