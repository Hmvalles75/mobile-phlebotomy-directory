import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all providers with primary state (source of truth)
    const providers = await prisma.provider.findMany({
      select: {
        primaryState: true
      },
      where: {
        primaryState: {
          not: null
        }
      }
    })

    // Count providers by state
    const stateCounts: Record<string, number> = {}

    providers.forEach(provider => {
      if (provider.primaryState) {
        const stateAbbr = provider.primaryState.toUpperCase()
        stateCounts[stateAbbr] = (stateCounts[stateAbbr] || 0) + 1
      }
    })

    return NextResponse.json(stateCounts)
  } catch (error) {
    console.error('Error fetching state provider counts:', error)
    return NextResponse.json({}, { status: 500 })
  }
}
