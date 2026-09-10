/**
 * Pre-SLA claim reminder.
 *
 * The stale-claim cron releases a CLAIMED lead with no logged outcome after
 * the SLA (STAT 2h, STANDARD 6h). Providers who did the work but never
 * touched the dashboard lost booked patients to it three times in four days
 * in September 2026: Pink Mobile Labs (Miami, patient upset by the extra
 * calls), FDP Phlebotomy (Anaheim, a paying Founding Partner who had replied
 * "booked" by email to an address nothing reads), and the Santa Clara event
 * lead. The "I'm working it" button existed the whole time; nobody knew it
 * was the thing keeping their claim.
 *
 * This sends one email, REMINDER_MINUTES_BEFORE_SLA before release, with two
 * one-tap links that need no login: "Still on it" (WORKING_IT) and "Booked"
 * (APPOINTMENT_BOOKED). Either stops the release. One reminder per claim;
 * claimReminderSentAt records it. Runs from the same 15-minute cron as the
 * release sweep, ahead of it, so a reminder always precedes a release.
 *
 * The links carry no secret, same as the pass link: the only thing they can
 * do is log an outcome on a lead the provider already holds, and the route
 * checks routedToId before writing.
 */
import sg from '@sendgrid/mail'
import { prisma } from './prisma'
import { SLA_MINUTES_STAT, SLA_MINUTES_STANDARD } from './staleClaimRelease'

export const REMINDER_MINUTES_BEFORE_SLA = 60

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://www.mobilephlebotomy.org').replace(/\/+$/, '')
const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org'

export interface ReminderCandidate {
  id: string
  fullName: string
  city: string
  state: string
  zip: string
  urgency: 'STAT' | 'STANDARD'
  claimedMinutesAgo: number
  minutesLeft: number
  providerId: string
  providerName: string
  providerEmail: string | null
}

export interface ReminderSweepResult {
  scanned: number
  sent: number
  skippedNoEmail: number
  errors: Array<{ leadId: string; error: string }>
}

export async function findClaimReminderCandidates(now: Date = new Date()): Promise<ReminderCandidate[]> {
  const nowMs = now.getTime()
  const win = (sla: number) => ({
    // Inside the reminder window: past (SLA - lead time), not yet past SLA.
    lte: new Date(nowMs - (sla - REMINDER_MINUTES_BEFORE_SLA) * 60_000),
    gt: new Date(nowMs - sla * 60_000),
  })
  const leads = await prisma.lead.findMany({
    where: {
      status: 'CLAIMED',
      outcome: null,
      appointmentDate: null,
      claimReminderSentAt: null,
      routedToId: { not: null },
      OR: [
        { urgency: 'STAT', claimedAt: win(SLA_MINUTES_STAT) },
        { urgency: 'STANDARD', claimedAt: win(SLA_MINUTES_STANDARD) },
      ],
    },
    include: { provider: { select: { id: true, name: true, email: true, claimEmail: true, notificationEmail: true } } },
    orderBy: { claimedAt: 'asc' },
  })
  return leads.map(l => {
    const sla = l.urgency === 'STAT' ? SLA_MINUTES_STAT : SLA_MINUTES_STANDARD
    const ago = l.claimedAt ? Math.round((nowMs - l.claimedAt.getTime()) / 60_000) : 0
    return {
      id: l.id, fullName: l.fullName, city: l.city, state: l.state, zip: l.zip, urgency: l.urgency,
      claimedMinutesAgo: ago, minutesLeft: Math.max(sla - ago, 0),
      providerId: l.routedToId!, providerName: l.provider?.name?.trim() || 'there',
      providerEmail: l.provider?.notificationEmail || l.provider?.claimEmail || l.provider?.email || null,
    }
  })
}

export function quickOutcomeUrl(leadId: string, providerId: string, action: 'working' | 'booked'): string {
  return `${SITE_URL}/api/lead/quick-outcome?lead=${leadId}&provider=${providerId}&do=${action}`
}

async function sendClaimReminderEmail(c: ReminderCandidate): Promise<void> {
  if (!c.providerEmail) throw new Error('no email')
  if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY not set')
  sg.setApiKey(process.env.SENDGRID_API_KEY)
  const working = quickOutcomeUrl(c.id, c.providerId, 'working')
  const booked = quickOutcomeUrl(c.id, c.providerId, 'booked')
  const mins = Math.round(c.minutesLeft)
  const subject = `${c.fullName} (${c.city}, ${c.state}): still yours? One tap keeps the claim`

  const text = `Hi ${c.providerName},

You claimed ${c.fullName} in ${c.city}, ${c.state} about ${Math.round(c.claimedMinutesAgo / 60 * 10) / 10} hours ago and nothing has been logged on it yet. In about ${mins} minutes the system will assume the request was abandoned and release it to other providers.

If you're on it, one tap keeps it yours. No login needed:

  Still working it:   ${working}
  Appointment booked: ${booked}

If you did reach the patient and it didn't go anywhere, log the outcome from your dashboard instead: ${SITE_URL}/dashboard

If you've moved on from this one, do nothing and it releases on schedule.

Lead ID: ${c.id}

Hector Valles
MobilePhlebotomy.org`

  const btn = (href: string, label: string, color: string) =>
    `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;margin:6px 8px 6px 0;">${label}</a>`
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.7;color:#1f2937;max-width:600px;margin:0 auto;padding:20px;">
<p>Hi ${c.providerName},</p>
<p>You claimed <strong>${c.fullName}</strong> in ${c.city}, ${c.state} about ${Math.round(c.claimedMinutesAgo / 60 * 10) / 10} hours ago and nothing has been logged on it yet. In about <strong>${mins} minutes</strong> the system will assume the request was abandoned and release it to other providers.</p>
<p>If you're on it, one tap keeps it yours. No login needed:</p>
<p>${btn(working, "I'm still working it", '#2563eb')} ${btn(booked, 'Appointment booked', '#16a34a')}</p>
<p style="color:#4b5563;">If you reached the patient and it didn't go anywhere, log that outcome from your <a href="${SITE_URL}/dashboard" style="color:#0066cc;">dashboard</a>. If you've moved on from this one, do nothing and it releases on schedule.</p>
<p style="color:#9ca3af;font-size:12px;">Lead ID: ${c.id}</p>
<p>Hector Valles<br>MobilePhlebotomy.org</p>
</body></html>`

  const payload: any = { to: c.providerEmail, from: FROM_EMAIL, subject, text, html }
  if (process.env.LEAD_REPLY_TO) payload.replyTo = process.env.LEAD_REPLY_TO
  await sg.send(payload)
}

export async function runClaimReminderSweep(opts: { dryRun?: boolean } = {}): Promise<ReminderSweepResult> {
  const cands = await findClaimReminderCandidates()
  const result: ReminderSweepResult = { scanned: cands.length, sent: 0, skippedNoEmail: 0, errors: [] }
  for (const c of cands) {
    if (!c.providerEmail) { result.skippedNoEmail++; continue }
    if (opts.dryRun) { result.sent++; continue }
    try {
      // Stamp first so a slow send cannot double-fire on the next tick.
      await prisma.lead.update({ where: { id: c.id }, data: { claimReminderSentAt: new Date() } })
      await sendClaimReminderEmail(c)
      result.sent++
    } catch (err: any) {
      result.errors.push({ leadId: c.id, error: err?.message || String(err) })
      console.error(`[claim-reminder] Lead ${c.id} (${c.providerName}) failed:`, err?.message || err)
    }
  }
  if (cands.length > 0) console.log(`[claim-reminder] dryRun=${!!opts.dryRun} scanned=${result.scanned} sent=${result.sent} noEmail=${result.skippedNoEmail} errors=${result.errors.length}`)
  return result
}
