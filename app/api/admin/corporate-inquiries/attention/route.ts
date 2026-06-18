import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function validateAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const validToken = process.env.ADMIN_TOKEN || 'default-admin-token'
  return token === validToken
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
      prisma.coverageRequest.count({ where: { status: 'CONTACTED', createdAt: { lt: contactedStaleCutoff } } }),
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
