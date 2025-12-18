import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Search providers by name, email, or phone
    const providers = await prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { claimEmail: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { phonePublic: { contains: query } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        claimEmail: true,
        phone: true,
        phonePublic: true,
        zipCodes: true,
        stripePaymentMethodId: true,
        eligibleForLeads: true,
        trialStatus: true
      },
      take: 10
    })

    return NextResponse.json({
      ok: true,
      providers,
      count: providers.length
    })

  } catch (error: any) {
    console.error('Provider search error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
