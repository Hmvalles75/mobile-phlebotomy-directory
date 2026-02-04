import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication - accept either session token or raw password
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if it's a session token (base64 encoded JSON)
    let isAuthenticated = false

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const session = JSON.parse(decoded)
      if (session.authenticated && session.expiresAt > Date.now()) {
        isAuthenticated = true
      }
    } catch {
      // Not a valid session token, check if it's the raw password
      if (token === process.env.ADMIN_PASSWORD || token === process.env.ADMIN_SECRET) {
        isAuthenticated = true
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch provider statistics
    const totalProviders = await prisma.provider.count()
    const providersWithPayment = await prisma.provider.count({
      where: {
        OR: [
          { stripePaymentMethodId: { not: null } },
          // Only count Stripe customers who are actually featured (paid subscribers)
          { stripeCustomerId: { not: null }, isFeatured: true }
        ]
      }
    })
    const providersWhoClaimedLeads = await prisma.provider.count({
      where: {
        leads: {
          some: {}
        }
      }
    })
    const providersClaimedViaOnboard = await prisma.provider.count({
      where: {
        claimVerifiedAt: { not: null }
      }
    })
    const featuredProvidersReceivingNotifications = await prisma.provider.count({
      where: {
        isFeatured: true,
        notifyEnabled: true,
        OR: [
          { notificationEmail: { not: null } },
          { claimEmail: { not: null } },
          { email: { not: null } }
        ]
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

    // Fetch providers who claimed via /onboard
    const onboardedProviders = await prisma.provider.findMany({
      where: {
        claimVerifiedAt: { not: null }
      },
      orderBy: { claimVerifiedAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        phone: true,
        createdAt: true,
        claimVerifiedAt: true,
        stripePaymentMethodId: true,
        eligibleForLeads: true,
        status: true,
        _count: {
          select: {
            leads: true
          }
        }
      }
    })

    // Fetch featured providers receiving notifications
    const featuredProviders = await prisma.provider.findMany({
      where: {
        isFeatured: true,
        notifyEnabled: true,
        OR: [
          { notificationEmail: { not: null } },
          { claimEmail: { not: null } },
          { email: { not: null } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        notificationEmail: true,
        phone: true,
        createdAt: true,
        claimVerifiedAt: true,
        isFeatured: true,
        featuredTier: true,
        status: true,
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
        claimVerifiedAt: true,
        stripePaymentMethodId: true,
        eligibleForLeads: true,
        status: true,
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
        provider: {
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
          whoClaimedLeads: providersWhoClaimedLeads,
          claimedViaOnboard: providersClaimedViaOnboard,
          featuredReceivingNotifications: featuredProvidersReceivingNotifications
        },
        leads: {
          total: totalLeads,
          claimed: claimedLeads,
          open: openLeads
        }
      },
      recentProviders,
      onboardedProviders,
      featuredProviders,
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
