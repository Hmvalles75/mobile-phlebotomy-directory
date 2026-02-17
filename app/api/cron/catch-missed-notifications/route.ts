/**
 * Catch Missed Notifications Cron Job
 *
 * POST /api/cron/catch-missed-notifications
 *
 * Finds leads from the last 24 hours that didn't receive any notifications
 * and sends them to matching featured providers.
 *
 * Recommended schedule: Every 15-30 minutes
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import sg from '@sendgrid/mail'

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Checking for missed notifications...')

    // Find leads from last 24 hours with NO notifications
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    // Only check leads at least 5 minutes old (give normal flow time to complete)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const missedLeads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
          lte: fiveMinutesAgo
        },
        status: 'OPEN',
        leadNotifications: { none: {} }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (missedLeads.length === 0) {
      console.log('[Cron] No missed notifications found')
      return NextResponse.json({ ok: true, fixed: 0 })
    }

    console.log(`[Cron] Found ${missedLeads.length} leads without notifications`)

    // Get all featured providers with notifications enabled
    const featuredProviders = await prisma.provider.findMany({
      where: {
        isFeatured: true,
        notifyEnabled: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        notificationEmail: true,
        zipCodes: true,
        coverage: {
          select: {
            state: { select: { abbr: true } }
          }
        }
      }
    })

    sg.setApiKey(process.env.SENDGRID_API_KEY!)

    let fixedCount = 0

    for (const lead of missedLeads) {
      // Find matching providers for this lead
      const matchingProviders = featuredProviders.filter(provider => {
        // Check state coverage
        const coverageStates = provider.coverage.map(c => c.state.abbr)
        if (coverageStates.includes(lead.state)) {
          return true
        }

        // Check ZIP coverage
        if (!provider.zipCodes) return false
        const serviceZips = provider.zipCodes.split(',').map(z => z.trim())
        return serviceZips.some(zip => {
          if (zip === lead.zip) return true
          if (zip.includes('*')) return lead.zip.startsWith(zip.replace('*', ''))
          return false
        })
      })

      if (matchingProviders.length === 0) {
        console.log(`[Cron] No matching providers for lead ${lead.id} in ${lead.state}`)
        continue
      }

      // Send notifications to matching providers
      for (const provider of matchingProviders) {
        const email = provider.notificationEmail || provider.claimEmail || provider.email
        if (!email) continue

        // Check if notification already exists (race condition protection)
        const existing = await prisma.leadNotification.findFirst({
          where: { leadId: lead.id, providerId: provider.id }
        })
        if (existing) continue

        // Create notification record
        const notif = await prisma.leadNotification.create({
          data: {
            leadId: lead.id,
            providerId: provider.id,
            channel: 'email',
            status: 'QUEUED'
          }
        })

        try {
          await sg.send({
            to: email,
            from: process.env.LEAD_EMAIL_FROM!,
            subject: `New request in ${lead.city}, ${lead.state} - Reply ASAP`,
            text: `Hi ${provider.name},

New request in ${lead.city}, ${lead.state} just came in.
Please reply ASAP to confirm availability so we can route it.

Location: ${lead.city}, ${lead.state} ${lead.zip}
Lab preference: ${lead.labPreference}
Urgency: ${lead.urgency}
Notes: ${lead.notes || 'None'}

Review the request here:
https://mobilephlebotomy.org/dashboard

— MobilePhlebotomy.org`
          })

          await prisma.leadNotification.update({
            where: { id: notif.id },
            data: { status: 'SENT', sentAt: new Date() }
          })

          console.log(`[Cron] ✅ Sent missed notification for lead ${lead.id} to ${provider.name}`)
          fixedCount++

        } catch (error: any) {
          console.error(`[Cron] ❌ Failed to send to ${provider.name}:`, error.message)
          await prisma.leadNotification.update({
            where: { id: notif.id },
            data: { status: 'FAILED', errorMessage: error.message }
          })
        }
      }
    }

    console.log(`[Cron] Fixed ${fixedCount} missed notifications`)

    return NextResponse.json({
      ok: true,
      leadsChecked: missedLeads.length,
      fixed: fixedCount
    })

  } catch (error: any) {
    console.error('[Cron] Catch missed notifications error:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

// Support GET for Vercel cron
export async function GET(req: NextRequest) {
  return POST(req)
}
