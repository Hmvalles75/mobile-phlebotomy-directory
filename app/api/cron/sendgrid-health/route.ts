import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { alertAdminSMS } from '@/lib/alertAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SendGrid health watchdog.
 *
 * Runs on a schedule and alerts the admin OUT OF BAND (Twilio SMS, not email)
 * when outbound email is unhealthy. This exists because of the 2026-06 outage:
 * an unpaid-invoice SendGrid suspension silently dropped ~15 lead-notification
 * emails and NOTHING alerted, because every alert path also ran through
 * SendGrid. This watchdog is the missing dead-man's-switch.
 *
 * Two independent signals:
 *   A. Account/API-key health via GET /v3/scopes — catches auth/billing
 *      suspension (the actual outage: SendGrid returned 401 Unauthorized).
 *   B. A spike of FAILED LeadNotifications in the last hour — catches sends
 *      failing for any other reason while the key still validates.
 */

// FAILED notifications in the trailing hour that trip signal B.
const FAILED_ALERT_THRESHOLD = 3

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isTest = searchParams.get('test') === '1'

    // Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. For the
    // manual ?test=1 trigger from a browser (which can't set that header), we
    // also accept ?secret=<CRON_SECRET> in the query string.
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const querySecret = searchParams.get('secret')
    const authorized =
      !cronSecret ||                                   // fail-open only if unset (existing convention)
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Manual test: fire a single out-of-band SMS to prove the alert channel
    // actually reaches the admin's phone, without waiting for a real outage.
    if (isTest) {
      const alerted = await alertAdminSMS('✅ MobilePhlebotomy test alert — out-of-band SMS alerting is working. No action needed.')
      return NextResponse.json({
        ok: true,
        test: true,
        alerted,
        note: alerted
          ? 'Test SMS dispatched to ADMIN_ALERT_PHONE.'
          : 'Not sent — check ADMIN_ALERT_PHONE and Twilio env vars (see server logs).',
      })
    }

    const alerts: string[] = []

    // --- Signal A: SendGrid account / API-key health ---
    let scopesStatus = 0
    const key = process.env.SENDGRID_API_KEY
    if (!key) {
      alerts.push('SENDGRID_API_KEY is not set — outbound email cannot send.')
    } else {
      try {
        const res = await fetch('https://api.sendgrid.com/v3/scopes', {
          headers: { Authorization: `Bearer ${key}` },
        })
        scopesStatus = res.status
        if (res.status === 401) {
          alerts.push('SendGrid returned 401 Unauthorized — account likely SUSPENDED (check billing / unpaid invoice). Lead emails are FAILING.')
        } else if (!res.ok) {
          alerts.push(`SendGrid health check returned HTTP ${res.status} — outbound email may be affected.`)
        }
      } catch (err: any) {
        alerts.push(`SendGrid health check could not reach the API: ${err?.message || err}`)
      }
    }

    // --- Signal B: recent FAILED lead notifications ---
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentFailed = await prisma.leadNotification.count({
      where: { status: 'FAILED', createdAt: { gte: oneHourAgo } },
    })
    if (recentFailed >= FAILED_ALERT_THRESHOLD) {
      alerts.push(`${recentFailed} lead notifications FAILED in the last hour — providers are not being reached.`)
    }

    // --- Alert out-of-band (SMS) if anything is wrong ---
    let alerted = false
    if (alerts.length > 0) {
      const body = `⚠️ MobilePhlebotomy alert:\n${alerts.join('\n')}`
      alerted = await alertAdminSMS(body)
      console.error(`[sendgrid-health] UNHEALTHY: ${alerts.join(' | ')} (alerted=${alerted})`)
    }

    return NextResponse.json({
      ok: true,
      healthy: alerts.length === 0,
      sendgridScopesStatus: scopesStatus,
      recentFailedNotifications: recentFailed,
      alerts,
      alerted,
    })
  } catch (err: any) {
    console.error('[sendgrid-health] Handler error:', err?.message || err)
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
