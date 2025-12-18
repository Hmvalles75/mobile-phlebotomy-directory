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

    // Fetch all providers
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
        status: true,
        stripeCustomerId: true,
        stripePaymentMethodId: true,
        trialStatus: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      ok: true,
      providers
    })

  } catch (error: any) {
    console.error('[Admin Providers] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}
