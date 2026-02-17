/**
 * Lead Follow-ups Cron Job
 *
 * POST /api/cron/lead-followups
 *
 * Handles automated lead lifecycle management:
 * 1. Send reminders to unresponsive patients
 * 2. Close stale leads that timeout
 * 3. Route qualified leads to providers
 * 4. Escalate stale routing situations
 *
 * Recommended schedule: Every 30 minutes
 *
 * COMPLIANCE:
 * - Only sends SMS to patients who initiated contact
 * - Respects SMS count limits per patient
 * - Provider routing handled by optedInRouting.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadStatus, DispatchTaskReason } from '@prisma/client'
import { sendPatientReminder } from '@/lib/patientSmsFlow'
import { attemptRouteToOptedInProviders } from '@/lib/optedInRouting'

// Timing constants (in milliseconds)
const FOUR_HOURS = 4 * 60 * 60 * 1000
const SIX_HOURS = 6 * 60 * 60 * 1000
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
const TWO_HOURS = 2 * 60 * 60 * 1000

interface FollowupResult {
  reminders: { sent: number; failed: number }
  closedUnconfirmed: number
  closedStaleDetails: number
  routedQualified: { success: number; failed: number }
  escalatedRouting: number
}

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting lead follow-ups job...')

    const now = new Date()
    const result: FollowupResult = {
      reminders: { sent: 0, failed: 0 },
      closedUnconfirmed: 0,
      closedStaleDetails: 0,
      routedQualified: { success: 0, failed: 0 },
      escalatedRouting: 0
    }

    // 1. Send reminders to patients awaiting confirmation (4+ hours, < 3 SMS sent)
    const fourHoursAgo = new Date(now.getTime() - FOUR_HOURS)
    const awaitingReminderLeads = await prisma.lead.findMany({
      where: {
        status: LeadStatus.AWAITING_CONFIRM,
        lastPatientSmsAt: { lt: fourHoursAgo },
        patientSmsCount: { lt: 3 }
      },
      select: { id: true, phone: true, city: true, patientSmsCount: true }
    })

    console.log(`[Cron] Found ${awaitingReminderLeads.length} leads needing reminders`)

    for (const lead of awaitingReminderLeads) {
      const sent = await sendPatientReminder(lead.id)
      if (sent) {
        result.reminders.sent++
        console.log(`[Cron] ✅ Sent reminder for lead ${lead.id}`)
      } else {
        result.reminders.failed++
      }
    }

    // 2. Close unconfirmed leads after 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - TWENTY_FOUR_HOURS)
    const unconfirmedLeads = await prisma.lead.findMany({
      where: {
        status: LeadStatus.AWAITING_CONFIRM,
        OR: [
          { lastPatientSmsAt: { lt: twentyFourHoursAgo } },
          { patientSmsCount: { gte: 3 } }
        ]
      },
      select: { id: true }
    })

    if (unconfirmedLeads.length > 0) {
      await prisma.lead.updateMany({
        where: {
          id: { in: unconfirmedLeads.map(l => l.id) }
        },
        data: { status: LeadStatus.CLOSED_UNCONFIRMED }
      })
      result.closedUnconfirmed = unconfirmedLeads.length
      console.log(`[Cron] Closed ${unconfirmedLeads.length} unconfirmed leads`)
    }

    // 3. Close stale COLLECTING_DETAILS leads after 6 hours
    const sixHoursAgo = new Date(now.getTime() - SIX_HOURS)
    const staleDetailsLeads = await prisma.lead.findMany({
      where: {
        status: { in: [LeadStatus.CONFIRMED, LeadStatus.COLLECTING_DETAILS] },
        lastPatientSmsAt: { lt: sixHoursAgo }
      },
      select: { id: true }
    })

    if (staleDetailsLeads.length > 0) {
      await prisma.lead.updateMany({
        where: {
          id: { in: staleDetailsLeads.map(l => l.id) }
        },
        data: { status: LeadStatus.CLOSED_UNCONFIRMED }
      })
      result.closedStaleDetails = staleDetailsLeads.length
      console.log(`[Cron] Closed ${staleDetailsLeads.length} stale detail-collection leads`)
    }

    // 4. Route qualified leads that haven't been routed yet
    const qualifiedLeads = await prisma.lead.findMany({
      where: {
        status: LeadStatus.QUALIFIED,
        routedAt: null
      },
      select: { id: true, zip: true }
    })

    console.log(`[Cron] Found ${qualifiedLeads.length} qualified leads to route`)

    for (const lead of qualifiedLeads) {
      const routeResult = await attemptRouteToOptedInProviders(lead.id)
      if (routeResult.success) {
        result.routedQualified.success++
        console.log(`[Cron] ✅ Routed lead ${lead.id} to ${routeResult.providersNotified} providers`)
      } else {
        result.routedQualified.failed++
        console.log(`[Cron] ❌ Failed to route lead ${lead.id}: ${routeResult.reason}`)
      }
    }

    // 5. Handle stale ROUTING leads (no claim after 2 hours)
    const twoHoursAgo = new Date(now.getTime() - TWO_HOURS)
    const staleRoutingLeads = await prisma.lead.findMany({
      where: {
        status: LeadStatus.ROUTING,
        routedAt: { lt: twoHoursAgo }
      },
      select: { id: true, zip: true, routedProviderIds: true }
    })

    console.log(`[Cron] Found ${staleRoutingLeads.length} stale routing leads`)

    for (const lead of staleRoutingLeads) {
      // Check if dispatch task already exists
      const existingTask = await prisma.dispatchTask.findFirst({
        where: {
          leadId: lead.id,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      })

      if (!existingTask) {
        // Create escalation task
        await prisma.dispatchTask.create({
          data: {
            leadId: lead.id,
            status: 'OPEN',
            reason: DispatchTaskReason.ALL_PROVIDERS_DECLINED,
            notes: `Lead routed to ${lead.routedProviderIds?.length || 0} providers but no claim after 2 hours. ZIP: ${lead.zip}`
          }
        })

        // Update lead status
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: LeadStatus.NEEDS_COVERAGE }
        })

        result.escalatedRouting++
        console.log(`[Cron] Escalated stale routing for lead ${lead.id}`)
      }
    }

    console.log('[Cron] Lead follow-ups completed:', JSON.stringify(result, null, 2))

    return NextResponse.json({
      ok: true,
      message: 'Lead follow-ups completed',
      result
    })

  } catch (error: any) {
    console.error('[Cron] Lead follow-ups error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to run lead follow-ups' },
      { status: 500 }
    )
  }
}

// Also support GET for Vercel cron
export async function GET(req: NextRequest) {
  return POST(req)
}
