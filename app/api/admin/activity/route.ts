import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Verify admin password
    const authHeader = req.headers.get('authorization')
    const password = authHeader?.replace('Bearer ', '')

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch provider statistics
    const totalProviders = await prisma.provider.count()
    const providersWithPayment = await prisma.provider.count({
      where: {
        stripePaymentMethodId: { not: null }
      }
    })
    const providersWhoClaimedLeads = await prisma.provider.count({
      where: {
        leads: {
          some: {}
        }
      }
    })

    // Fetch recent providers (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentProviders = await prisma.provider.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        phone: true,
        createdAt: true,
        stripePaymentMethodId: true,
        eligibleForLeads: true,
        _count: {
          select: {
            leads: true
          }
        }
      }
    })

    // Fetch all providers for full list
    const allProviders = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        phone: true,
        createdAt: true,
        stripePaymentMethodId: true,
        eligibleForLeads: true,
        _count: {
          select: {
            leads: true
          }
        }
      }
    })

    // Fetch recent lead claims (last 30 days)
    const recentLeadClaims = await prisma.lead.findMany({
      where: {
        status: 'CLAIMED',
        routedAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { routedAt: 'desc' },
      take: 50,
      include: {
        routedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Lead statistics
    const totalLeads = await prisma.lead.count()
    const claimedLeads = await prisma.lead.count({
      where: { status: 'CLAIMED' }
    })
    const openLeads = await prisma.lead.count({
      where: { status: 'OPEN' }
    })

    return NextResponse.json({
      ok: true,
      stats: {
        providers: {
          total: totalProviders,
          withPayment: providersWithPayment,
          whoClaimedLeads: providersWhoClaimedLeads
        },
        leads: {
          total: totalLeads,
          claimed: claimedLeads,
          open: openLeads
        }
      },
      recentProviders,
      allProviders,
      recentLeadClaims
    })

  } catch (error: any) {
    console.error('[Admin] Activity fetch error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch activity data' },
      { status: 500 }
    )
  }
}
