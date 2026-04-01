/**
 * Provider Data Audit Cron Job
 *
 * POST /api/cron/provider-audit
 *
 * Checks for providers missing critical fields needed for lead routing.
 * Emails admin only when issues are found, plus a weekly "all clear" summary.
 *
 * Recommended schedule: Daily at 8am (0 8 * * *)
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

    sg.setApiKey(process.env.SENDGRID_API_KEY!)

    console.log('[Audit] Running provider data audit...')

    // Find eligible providers missing critical fields
    const missingState = await prisma.provider.findMany({
      where: { eligibleForLeads: true, primaryState: null },
      select: { id: true, name: true, email: true, zipCodes: true }
    })

    const missingEmail = await prisma.provider.findMany({
      where: { eligibleForLeads: true, notificationEmail: null },
      select: { id: true, name: true, email: true }
    })

    const missingRadius = await prisma.provider.findMany({
      where: { eligibleForLeads: true, serviceRadiusMiles: null },
      select: { id: true, name: true, email: true }
    })

    const notFeatured = await prisma.provider.findMany({
      where: { eligibleForLeads: true, isFeatured: false },
      select: { id: true, name: true, email: true }
    })

    const missingZip = await prisma.provider.findMany({
      where: { eligibleForLeads: true, zipCodes: null },
      select: { id: true, name: true, email: true }
    })

    const totalIssues = missingState.length + missingEmail.length + missingRadius.length + notFeatured.length + missingZip.length

    // Get overall stats for summary
    const totalActive = await prisma.provider.count({ where: { eligibleForLeads: true } })
    const totalVerified = await prisma.provider.count({ where: { status: 'VERIFIED' } })
    const openLeads = await prisma.lead.count({ where: { status: 'OPEN' } })

    // Determine if today is the weekly summary day (Monday)
    const isMonday = new Date().getDay() === 1

    // Only email if there are issues OR it's the weekly summary day
    if (totalIssues === 0 && !isMonday) {
      console.log('[Audit] No issues found, skipping email (weekly summary on Mondays)')
      return NextResponse.json({
        ok: true,
        issues: 0,
        message: 'No issues found'
      })
    }

    // Build email
    let subject: string
    let body: string

    if (totalIssues > 0) {
      subject = `Provider audit: ${totalIssues} issue${totalIssues > 1 ? 's' : ''} found`

      const sections: string[] = []

      if (missingState.length > 0) {
        sections.push(`MISSING STATE (${missingState.length}):\n` +
          missingState.map(p => `  - ${p.name} (${p.email || 'no email'}) — ZIP: ${p.zipCodes || 'none'}`).join('\n'))
      }

      if (missingEmail.length > 0) {
        sections.push(`MISSING NOTIFICATION EMAIL (${missingEmail.length}):\n` +
          missingEmail.map(p => `  - ${p.name} (${p.email || 'no email'})`).join('\n'))
      }

      if (missingRadius.length > 0) {
        sections.push(`MISSING SERVICE RADIUS (${missingRadius.length}):\n` +
          missingRadius.map(p => `  - ${p.name} (${p.email || 'no email'})`).join('\n'))
      }

      if (notFeatured.length > 0) {
        sections.push(`ELIGIBLE BUT NOT FEATURED (${notFeatured.length}) — won't receive notifications:\n` +
          notFeatured.map(p => `  - ${p.name} (${p.email || 'no email'})`).join('\n'))
      }

      if (missingZip.length > 0) {
        sections.push(`MISSING ZIP CODE (${missingZip.length}) — can't match to leads:\n` +
          missingZip.map(p => `  - ${p.name} (${p.email || 'no email'})`).join('\n'))
      }

      body = `Provider Data Audit — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

${totalIssues} issue${totalIssues > 1 ? 's' : ''} found across ${new Set([...missingState, ...missingEmail, ...missingRadius, ...notFeatured, ...missingZip].map(p => p.id)).size} provider(s).

These providers are marked eligible for leads but are missing fields needed for lead routing:

${sections.join('\n\n')}

STATS:
  Active providers: ${totalActive}
  Total verified: ${totalVerified}
  Open leads: ${openLeads}

Fix these in the admin dashboard or database to ensure leads are routed correctly.`
    } else {
      // Weekly all-clear summary (Monday)
      subject = 'Provider audit: all clear'
      body = `Weekly Provider Audit — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

All systems healthy. No provider data issues found.

STATS:
  Active providers: ${totalActive}
  Total verified: ${totalVerified}
  Open leads: ${openLeads}

This is your weekly confirmation that the audit cron is running and all provider data is complete.`
    }

    // Send email
    await sg.send({
      to: 'hector@mobilephlebotomy.org',
      from: process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org',
      subject,
      text: body,
    })

    console.log(`[Audit] ${totalIssues > 0 ? `Found ${totalIssues} issues, email sent` : 'Weekly all-clear sent'}`)

    return NextResponse.json({
      ok: true,
      issues: totalIssues,
      stats: { totalActive, totalVerified, openLeads },
      emailSent: true,
    })

  } catch (error: any) {
    console.error('[Audit] Error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Audit failed' },
      { status: 500 }
    )
  }
}
