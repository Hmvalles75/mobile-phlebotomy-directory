import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailOnboardingFollowUp } from '@/lib/providerEmails'

/**
 * API endpoint to send onboarding follow-up emails
 * Should be called by a cron service every 2-4 hours
 *
 * Security: Requires CRON_SECRET env var to match
 *
 * Example cron setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/onboarding-followup",
 *     "schedule": "0 star-slash-2 star star star"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (basic security)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting onboarding follow-up job...')

    // Calculate time window: 24-26 hours ago
    const now = new Date()
    const twentySixHoursAgo = new Date(now.getTime() - 26 * 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Find providers who were approved 24 hours ago but haven't onboarded
    const providers = await prisma.provider.findMany({
      where: {
        createdAt: {
          gte: twentySixHoursAgo,
          lte: twentyFourHoursAgo
        },
        claimEmail: null,  // Haven't onboarded
        email: {
          not: null  // Have an email address
        },
        status: {
          in: ['VERIFIED', 'PENDING']  // Only send to verified/pending providers
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    if (providers.length === 0) {
      console.log('[Cron] No providers need follow-up at this time.')
      return NextResponse.json({
        ok: true,
        message: 'No providers need follow-up',
        sent: 0
      })
    }

    console.log(`[Cron] Found ${providers.length} provider(s) needing follow-up`)

    let sentCount = 0
    const errors: string[] = []

    for (const provider of providers) {
      try {
        await emailOnboardingFollowUp(
          provider.email!,
          provider.name,
          provider.name  // Use business name as fallback
        )
        console.log(`[Cron] ✅ Sent follow-up to ${provider.name}`)
        sentCount++
      } catch (error: any) {
        const errorMsg = `Failed to send to ${provider.name}: ${error.message}`
        console.error(`[Cron] ❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    console.log(`[Cron] Completed: ${sentCount}/${providers.length} emails sent`)

    return NextResponse.json({
      ok: true,
      message: `Onboarding follow-up emails sent`,
      total: providers.length,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('[Cron] Error in onboarding follow-up job:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Failed to send follow-up emails'
      },
      { status: 500 }
    )
  }
}
