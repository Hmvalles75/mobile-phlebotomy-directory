import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function validateAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  const validToken = process.env.ADMIN_TOKEN || 'default-admin-token'
  return token === validToken
}

/**
 * Returns counts of OPEN leads that need Hector's personal attention:
 *  - high-value leads sitting unclaimed (isHighValue=true, status=OPEN)
 *  - unrouted leads sitting in coverage gaps (status=OPEN, no provider notified)
 * Powers the admin attention banner + Leads-tab badge.
 */
export async function GET(req: NextRequest) {
  if (!validateAdminToken(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = Date.now()

    // High-value, OPEN, not yet claimed.
    const highValueLeads = await prisma.lead.findMany({
      where: { isHighValue: true, status: 'OPEN', claimedAt: null },
      select: { id: true, createdAt: true, estimatedValueCents: true, fullName: true, city: true, state: true },
      orderBy: { createdAt: 'asc' },
    })

    // OPEN leads with no providers notified (coverage gap or routing skipped).
    // routedProviderIds is a String[] in Prisma; absence of providers means routing
    // found nobody to contact, which is exactly the Hector-only signal we want.
    const unroutedLeads = await prisma.lead.findMany({
      where: { status: 'OPEN', claimedAt: null, routedProviderIds: { isEmpty: true } },
      select: { id: true, createdAt: true, isHighValue: true, fullName: true, city: true, state: true },
      orderBy: { createdAt: 'asc' },
    })

    // Dedupe — a lead can be both high-value AND unrouted.
    const allIds = new Set<string>([
      ...highValueLeads.map(l => l.id),
      ...unroutedLeads.map(l => l.id),
    ])
    const count = allIds.size

    const oldestHv = highValueLeads[0]
    const oldestUnrouted = unroutedLeads[0]

    const oldestHvAgeHours = oldestHv
      ? Math.floor((now - oldestHv.createdAt.getTime()) / (60 * 60 * 1000))
      : null
    const oldestUnroutedAgeHours = oldestUnrouted
      ? Math.floor((now - oldestUnrouted.createdAt.getTime()) / (60 * 60 * 1000))
      : null

    return NextResponse.json({
      success: true,
      count,
      highValueCount: highValueLeads.length,
      unroutedCount: unroutedLeads.length,
      oldestHvAgeHours,
      oldestUnroutedAgeHours,
    })
  } catch (error: any) {
    console.error('Failed to fetch lead attention:', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
