import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

// Admin auth via the shared cookie-session (same as /api/admin/leads). The
// previous ADMIN_TOKEN bearer check was broken and 401'd every request, so the
// B2B attention banner silently showed nothing.
function validateAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  return verifyAdminSessionFromCookies(authHeader || cookieHeader)
}

const NEW_STALE_DAYS = 2
const CONTACTED_STALE_DAYS = 7

export async function GET(req: NextRequest) {
  if (!validateAdminToken(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = Date.now()
    const newStaleCutoff = new Date(now - NEW_STALE_DAYS * 24 * 60 * 60 * 1000)
    const contactedStaleCutoff = new Date(now - CONTACTED_STALE_DAYS * 24 * 60 * 60 * 1000)

    const [newCount, staleNew, staleContacted, oldestNew] = await Promise.all([
      prisma.coverageRequest.count({ where: { status: 'NEW' } }),
      prisma.coverageRequest.count({ where: { status: 'NEW', createdAt: { lt: newStaleCutoff } } }),
      // CONTACTED staleness keys off lastContactedAt (real activity), not
      // createdAt. Legacy rows with no lastContactedAt fall back to createdAt.
      prisma.coverageRequest.count({
        where: {
          status: 'CONTACTED',
          OR: [
            { lastContactedAt: { lt: contactedStaleCutoff } },
            { lastContactedAt: null, createdAt: { lt: contactedStaleCutoff } },
          ],
        },
      }),
      prisma.coverageRequest.findFirst({
        where: { status: 'NEW' },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
    ])

    const oldestNewAgeDays = oldestNew
      ? Math.floor((now - oldestNew.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      : null

    return NextResponse.json({
      success: true,
      count: newCount + staleContacted,
      newCount,
      staleNewCount: staleNew,
      staleContactedCount: staleContacted,
      oldestNewAgeDays,
    })
  } catch (error: any) {
    console.error('Failed to fetch coverage attention:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
