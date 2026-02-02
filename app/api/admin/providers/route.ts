import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET

    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all providers with address
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Map to include businessName and flatten address for compatibility
    const mappedProviders = providers.map(p => ({
      ...p,
      businessName: p.name,
      city: p.address?.city || '',
      state: p.address?.state || ''
    }))

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
