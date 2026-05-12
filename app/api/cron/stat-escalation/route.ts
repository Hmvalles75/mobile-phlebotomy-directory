import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import sg from '@sendgrid/mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

/**
 * STAT-escalation cron.
 *
 * Scans for STAT-urgency leads that have been routed to providers but
 * remain unclaimed past the SLA threshold. Sends Hector an alert email
 * with the lead details so he can intervene (call the patient himself,
 * reach out to a provider directly, or release+reroute).
 *
 * Why: STAT requests are same-day urgency. The 30-day data showed STAT
 * leads claiming at 44% vs 50% for STANDARD — worse than the urgent ones
 * are supposed to do. Patient won't wait an hour for someone to claim.
 * Manual escalation when normal routing fails preserves the patient
 * experience and the next-time-they-need-something relationship.
 *
 * Schedule (vercel.json): every 10 minutes.
 * One-time alert per lead via `statEscalatedAt` flag on the Lead row.
 *
 * Security: requires `Authorization: Bearer ${CRON_SECRET}` header.
 */

const ESCALATION_THRESHOLD_MINUTES = 30  // alert if STAT lead has been routed but unclaimed for >30 min
const ESCALATION_MAX_AGE_MINUTES = 180   // don't alert on leads older than 3hr — they're already dead, no point waking Hector

const ADMIN_EMAIL = 'hector@mobilephlebotomy.org'
const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'

function fmtMinAgo(d: Date | null): string {
  if (!d) return '—'
  const min = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''} ago`
}

async function sendEscalationEmail(lead: any): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[stat-escalation] SENDGRID_API_KEY not set; cannot send alert')
    return false
  }

  const notifiedLines = (lead.leadNotifications || [])
    .filter((n: any) => n.status === 'SENT')
    .map((n: any) => `  - ${n.provider?.name?.trim() || '?'}  (${fmtMinAgo(n.sentAt)})`)
    .join('\n') || '  (none recorded)'

  const minAgo = Math.round((Date.now() - new Date(lead.routedAt).getTime()) / 60000)

  const subject = `🚨 STAT lead unclaimed ${minAgo}min — ${lead.city}, ${lead.state}`

  const body = `STAT lead has been routed but no provider has claimed it.

PATIENT
  Name:    ${lead.fullName}
  Phone:   ${lead.phone}
  Address: ${lead.address1 || '(none)'}
  City:    ${lead.city}, ${lead.state} ${lead.zip}
  Notes:   ${lead.notes || '(none)'}

TIMING
  Created: ${fmtMinAgo(lead.createdAt)}
  Routed:  ${fmtMinAgo(lead.routedAt)}
  Now:     ${minAgo} minutes unclaimed past routing

PROVIDERS NOTIFIED
${notifiedLines}

NEXT MOVES
  - Open the diagnostic: ${SITE_URL}/admin/lead-diagnostic/${lead.id}
  - Call the patient directly and place them with a provider manually
  - Or release the lead to re-fire to other providers

This is an automated escalation. The lead row's statEscalatedAt has been
stamped so you won't get another alert for this same lead.
`

  try {
    await sg.send({
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject,
      text: body,
      replyTo: ADMIN_EMAIL,
    })
    return true
  } catch (err: any) {
    console.error(`[stat-escalation] Send failed for lead ${lead.id}:`, err.response?.body || err.message)
    return false
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = Date.now()
    const thresholdCutoff = new Date(now - ESCALATION_THRESHOLD_MINUTES * 60 * 1000)
    const maxAgeCutoff = new Date(now - ESCALATION_MAX_AGE_MINUTES * 60 * 1000)

    const stale = await prisma.lead.findMany({
      where: {
        urgency: 'STAT',
        status: 'OPEN',
        statEscalatedAt: null,
        routedAt: {
          lte: thresholdCutoff,   // routed at least 30 min ago
          gte: maxAgeCutoff,      // but not older than 3 hours
        },
      },
      include: {
        leadNotifications: {
          include: { provider: { select: { name: true } } },
          orderBy: { sentAt: 'asc' },
        },
      },
    })

    console.log(`[stat-escalation] Found ${stale.length} STAT lead(s) requiring escalation`)

    let escalated = 0
    let failed = 0
    for (const lead of stale) {
      const ok = await sendEscalationEmail(lead)
      if (ok) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { statEscalatedAt: new Date() },
        })
        escalated++
        console.log(`[stat-escalation] ✅ Escalated lead ${lead.id} (${lead.city}, ${lead.state})`)
      } else {
        failed++
      }
    }

    return NextResponse.json({
      ok: true,
      scanned: stale.length,
      escalated,
      failed,
      thresholdMinutes: ESCALATION_THRESHOLD_MINUTES,
    })
  } catch (err: any) {
    console.error('[stat-escalation] Handler error:', err)
    return NextResponse.json({ ok: false, error: err.message || 'Unknown error' }, { status: 500 })
  }
}
