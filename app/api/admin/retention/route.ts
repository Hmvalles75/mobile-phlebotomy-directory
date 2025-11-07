import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Data Retention Cron Job
 * Run daily via Vercel cron to purge old data
 *
 * Retention policies:
 * - Leads: 18 months
 * - Call recordings: 90 days
 * - Corrections: 24 months
 */

export async function POST(req: NextRequest) {
  try {
    // Verify this is coming from Vercel Cron (optional but recommended)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const stats = {
      leadsDeleted: 0,
      callLogsDeleted: 0,
      correctionsDeleted: 0
    }

    // Delete leads older than 18 months
    const eighteenMonthsAgo = new Date(now)
    eighteenMonthsAgo.setMonth(now.getMonth() - 18)

    const leadsResult = await prisma.lead.deleteMany({
      where: {
        createdAt: {
          lt: eighteenMonthsAgo
        }
      }
    })
    stats.leadsDeleted = leadsResult.count

    // Delete call logs older than 90 days (if they have recordings)
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(now.getDate() - 90)

    const callLogsResult = await prisma.callLog.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo
        },
        recordingUrl: {
          not: null
        }
      }
    })
    stats.callLogsDeleted = callLogsResult.count

    // Delete closed provider corrections older than 24 months
    const twentyFourMonthsAgo = new Date(now)
    twentyFourMonthsAgo.setMonth(now.getMonth() - 24)

    const correctionsResult = await prisma.providerCorrections.deleteMany({
      where: {
        createdAt: {
          lt: twentyFourMonthsAgo
        },
        status: 'CLOSED'
      }
    })
    stats.correctionsDeleted = correctionsResult.count

    console.log('[Retention Job] Completed:', stats)

    return NextResponse.json({
      success: true,
      message: 'Retention job completed successfully',
      stats,
      timestamp: now.toISOString()
    })

  } catch (error: any) {
    console.error('[Retention Job] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to run retention job'
      },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing (remove in production or protect with auth)
export async function GET(req: NextRequest) {
  // Check for admin authorization
  const authHeader = req.headers.get('authorization')
  const adminSecret = process.env.ADMIN_SECRET

  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return POST(req)
}
