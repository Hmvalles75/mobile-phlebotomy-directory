import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch provider data
    const provider = await prisma.provider.findUnique({
      where: { id: session.providerId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        stripePaymentMethodId: true,
        featuredTier: true,
        claimEmail: true,
        email: true,
        phone: true,
        phonePublic: true,
        website: true,
        zipCodes: true,
        twilioNumber: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Fetch recent leads for this provider
    const leads = await prisma.lead.findMany({
      where: {
        routedToId: session.providerId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        fullName: true,
        phone: true,
        email: true,
        city: true,
        state: true,
        zip: true,
        urgency: true,
        status: true,
        priceCents: true,
        notes: true
      }
    })

    // Calculate stats
    const stats = {
      totalLeads: leads.length,
      newLeads: leads.filter((l: typeof leads[number]) => l.status === 'NEW').length,
      deliveredLeads: leads.filter((l: typeof leads[number]) => l.status === 'DELIVERED').length,
      revenueGenerated: leads.reduce((sum: number, lead: typeof leads[number]) => sum + lead.priceCents, 0) / 100
    }

    return NextResponse.json({
      ok: true,
      provider,
      leads,
      stats
    })

  } catch (error: any) {
    console.error('[Dashboard API] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
