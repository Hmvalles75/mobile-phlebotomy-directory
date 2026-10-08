import sg from '@sendgrid/mail'
import { prisma } from './prisma'
import { emailAdmin } from './adminEmail'
import { findNewProvidersForLead } from './leadNotifications'
import { rematchLead } from './leadRematch'
import { generateOutcomeToken } from './patientOutcomeRequest'

if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

const SITE_URL = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org').replace(/\/+$/, '')

/**
 * Coverage waitlist, part two (2026-09-30): telling people when service
 * arrives.
 *
 * A requester with no provider in range can join the waitlist (PR #58). The
 * rematch already routes parked leads younger than MAX_REMATCH_AGE_DAYS the
 * moment a provider activates in their area; older ones were never looked at
 * again, and "I'll make sure you're first to know" was never kept.
 *
 * notifyWaitlistedLeadsWithCoverage(): every waitlisted lead still parked as
 * NEEDS_COVERAGE, younger than WAITLIST_MAX_AGE_DAYS and not yet told, is
 * checked against today's provider pool. If someone now covers the ZIP
 * inside their own radius (a fan-out floor pull from 55 miles out is not
 * "a provider now serves your city") the requester gets one email with a one-tap "send my request now" link
 * (/api/waitlist/[token]/go -> rematchLead, which reopens and routes with the
 * age cap bypassed) and a link to submit a fresh request if details changed.
 * Sent at most once per lead (coverageAvailableNotifiedAt).
 *
 * Runs from the daily coverage sweep and after every provider activation /
 * coverage change (rematchForProviderAfterChange), so it catches both the
 * hooked paths and providers activated by script.
 */
export const WAITLIST_MAX_AGE_DAYS = 180

export interface WaitlistNotifyResult {
  dryRun: boolean
  scanned: number
  covered: number
  emailed: number
  leads: { leadId: string; city: string; state: string; ageDays: number; providers: string[]; emailed: boolean; skipped?: string }[]
}

export async function notifyWaitlistedLeadsWithCoverage(opts: { dryRun?: boolean } = {}): Promise<WaitlistNotifyResult> {
  const since = new Date(Date.now() - WAITLIST_MAX_AGE_DAYS * 86400e3)
  const leads = await prisma.lead.findMany({
    where: { status: 'NEEDS_COVERAGE', waitlistedAt: { not: null }, coverageAvailableNotifiedAt: null, createdAt: { gte: since }, isHighValue: false },
    select: { id: true, fullName: true, email: true, city: true, state: true, createdAt: true, patientToken: true },
    orderBy: { createdAt: 'asc' },
  })
  const r: WaitlistNotifyResult = { dryRun: !!opts.dryRun, scanned: leads.length, covered: 0, emailed: 0, leads: [] }
  for (const lead of leads) {
    // In-radius only: widenedMiles is set when the fan-out floor pulled a
    // provider in from outside their own service area.
    const providers = (await findNewProvidersForLead(lead.id)).filter(p => p.widenedMiles === undefined)
    const row = { leadId: lead.id, city: lead.city, state: lead.state, ageDays: Math.round((Date.now() - lead.createdAt.getTime()) / 86400e3), providers: providers.map(p => p.name.trim()), emailed: false, skipped: undefined as string | undefined }
    r.leads.push(row)
    if (providers.length === 0) continue
    r.covered++
    if (!lead.email) { row.skipped = 'no email on lead'; continue }
    if (opts.dryRun) continue
    // Leads older than the status page (2026-09-29) have no token; mint one so
    // the "send my request now" link and the status page work for them too.
    let token = lead.patientToken
    if (!token) {
      token = generateOutcomeToken()
      await prisma.lead.update({ where: { id: lead.id }, data: { patientToken: token } })
    }
    // Stamp before sending so a crash mid-send cannot double-email on the next run.
    const stamped = await prisma.lead.updateMany({ where: { id: lead.id, coverageAvailableNotifiedAt: null }, data: { coverageAvailableNotifiedAt: new Date() } })
    if (stamped.count === 0) { row.skipped = 'already notified'; continue }
    try {
      await sendCoverageAvailableEmail({ to: lead.email, fullName: lead.fullName, city: lead.city, state: lead.state, requestedAt: lead.createdAt, token })
      row.emailed = true
      r.emailed++
    } catch (err: any) {
      row.skipped = `send failed: ${err?.message || err}`
      console.error(`[coverageWaitlist] email failed for ${lead.id}:`, err?.message || err)
    }
  }
  if (!opts.dryRun && r.emailed > 0) {
    emailAdmin(
      `Coverage arrived: ${r.emailed} waitlisted requester(s) told`,
      r.leads.filter(l => l.emailed).map(l => `${l.city}, ${l.state} (${l.ageDays}d old) -> ${l.providers.join(', ')}  ${SITE_URL}/admin/lead-diagnostic/${l.leadId}`).join('\n'),
    ).catch(() => {})
  }
  return r
}

/**
 * The requester tapped "send my request now". Reopens and routes the parked
 * lead (rematchLead bypasses the 4-day age cap). Returns how many providers
 * were sent, or null when the lead is not in a state that can be sent.
 */
export async function sendWaitlistedRequestNow(leadId: string): Promise<{ sent: number; reparked: boolean } | null> {
  const r = await rematchLead(leadId)
  if (!r) return null
  return { sent: r.sent, reparked: r.reparked }
}

async function sendCoverageAvailableEmail(p: { to: string; fullName: string; city: string; state: string; requestedAt: Date; token: string }): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY not set')
  const first = (p.fullName || '').trim().split(/\s+/)[0] || 'there'
  const when = p.requestedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const goUrl = `${SITE_URL}/api/waitlist/${p.token}/go`
  const newUrl = `${SITE_URL}/request-blood-draw`
  const subject = `A provider now covers ${p.city}, ${p.state}`
  const text = `Hi ${first},

When you asked for a mobile blood draw in ${p.city} on ${when}, we had nobody covering your area. That has changed: a provider now serves ${p.city}.

If you still need the draw, tap this link and we will send your original request to them right now:
${goUrl}

If anything has changed (a different address, date, or lab order), submit a fresh request instead:
${newUrl}

If you have already sorted it out, ignore this. We will not email you about it again.

Hector Valles
MobilePhlebotomy.org
`
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color:#1f2937;">
  <p>Hi ${first},</p>
  <p>When you asked for a mobile blood draw in <strong>${p.city}</strong> on ${when}, we had nobody covering your area. That has changed: a provider now serves ${p.city}.</p>
  <p style="background: #ecfdf5; padding: 15px; border-radius: 5px; border-left: 4px solid #059669;">
    If you still need the draw, one tap sends your original request to them right now:<br><br>
    <a href="${goUrl}" style="background: #059669; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Send my request now</a>
  </p>
  <p>If anything has changed (a different address, date, or lab order), <a href="${newUrl}">submit a fresh request</a> instead.</p>
  <p>If you have already sorted it out, ignore this. We will not email you about it again.</p>
  <p>Hector Valles<br><a href="${SITE_URL}">MobilePhlebotomy.org</a></p>
</div>`
  await sg.send({ to: p.to, from: 'hector@mobilephlebotomy.org', subject, text, html })
}
