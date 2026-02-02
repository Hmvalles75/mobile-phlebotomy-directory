import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie')
    const isAuthenticated = verifyAdminSessionFromCookies(authHeader || cookieHeader)

    if (!isAuthenticated) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all providers with address and coverage
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        slug: true,
        status: true,
        eligibleForLeads: true,
        stripeCustomerId: true,
        stripePaymentMethodId: true,
        trialStatus: true,
        createdAt: true,
        address: {
          select: {
            city: true,
            state: true
          }
        },
        coverage: {
          select: {
            state: { select: { abbr: true } },
            city: { select: { name: true } }
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Map to include businessName and flatten address/coverage for compatibility
    const mappedProviders = providers.map(p => {
      // Try address first, then fall back to first coverage area
      const city = p.address?.city || p.coverage?.[0]?.city?.name || ''
      const state = p.address?.state || p.coverage?.[0]?.state?.abbr || ''
      return {
        ...p,
        businessName: p.name,
        city,
        state
      }
    })

    return NextResponse.json({
      ok: true,
      providers: mappedProviders
    })

  } catch (error: any) {
    console.error('[Admin Providers] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}
