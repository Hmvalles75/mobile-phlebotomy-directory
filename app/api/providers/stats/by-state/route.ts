import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all providers and group by state
    const providers = await prisma.provider.findMany({
      select: {
        coverage: true
      }
    })

    // Count providers by state
    const stateCounts: Record<string, number> = {}

    providers.forEach(provider => {
      const coverage = provider.coverage as any

      // Handle different coverage formats
      if (coverage && coverage.statesCovered && Array.isArray(coverage.statesCovered)) {
        coverage.statesCovered.forEach((state: string) => {
          const stateAbbr = state.toUpperCase()
          stateCounts[stateAbbr] = (stateCounts[stateAbbr] || 0) + 1
        })
      }

      // Also check for state field directly
      if (coverage && coverage.state) {
        const stateAbbr = coverage.state.toUpperCase()
        stateCounts[stateAbbr] = (stateCounts[stateAbbr] || 0) + 1
      }
    })

    return NextResponse.json(stateCounts)
  } catch (error) {
    console.error('Error fetching state provider counts:', error)
    return NextResponse.json({}, { status: 500 })
  }
}
