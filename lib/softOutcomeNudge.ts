import sg from '@sendgrid/mail'
import { prisma } from './prisma'
import { SITE_URL } from './seo'
import { sendTransactionalEmail } from './sendTransactionalEmail'
import { generateOutcomeToken } from './patientOutcomeRequest'
import { quickOutcomeUrl } from './claimReminder'

/**
 * Soft-outcome nudges.
 *
 * A soft outcome (text sent, no answer, voicemail, email sent, working it,
 * callback scheduled) stops the stale-claim clock, which is right: a provider
 * who is genuinely working a lead must not lose it. But nothing restarts the
 * clock. If the patient never calls back, or the provider gets busy, the lead
 * sits on that account for good: never won, never lost, never re-offered, and
 * the patient is never checked on. 85 leads in the 90 days to 2026-09-21 were
 * in that state, 27 of them from the last 30 days, almost half of all claims.
 *
 * Two days after the soft outcome, two emails, each at most once per claim:
 *   1. Provider: "still working it, booked, or hand it back?" with one-tap
 *      links (the same route the pre-release reminder uses, plus handback).
 *   2. Patient: "has the provider reached you?" with two one-tap answers. A
 *      "no" emails the admin so the lead can be moved by hand.
 *
 * Auto-release on day 5 is deliberately NOT built yet. The window should be
 * set by the patient survey (how often "text sent" turns into a draw), not by
 * a guess. Nothing here changes lead status; both emails only inform.
 */

export const SOFT_OUTCOMES = ['TEXT_SENT', 'NO_ANSWER', 'VOICEMAIL', 'EMAIL_SENT', 'WORKING_IT', 'SCHEDULED_CALLBACK', 'BUSY_OR_DISCONNECTED'] as const
export const NUDGE_AFTER_HOURS = 48
/** Claims older than this are left alone; a check-in weeks late is noise. */
export const MAX_CLAIM_AGE_DAYS = 14
const BATCH_CAP = 100
const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || ''

export interface NudgeSweepResult {
  dryRun: boolean
  scanned: number
  providerNudges: number
  patientCheckins: number
  skippedNoProviderEmail: number
  skippedNoPatientEmail: number
  errors: { leadId: string; error: string }[]
}

export async function findSoftOutcomeCandidates(now = new Date()) {
  const dueBefore = new Date(now.getTime() - NUDGE_AFTER_HOURS * 3600e3)
  const oldest = new Date(now.getTime() - MAX_CLAIM_AGE_DAYS * 86400e3)
  const rows = await prisma.lead.findMany({
    where: {
      status: 'CLAIMED',
      routedToId: { not: null },
      outcome: { in: [...SOFT_OUTCOMES] },
      claimedAt: { gte: oldest },
      OR: [{ softNudgeSentAt: null }, { patientCheckinSentAt: null }],
    },
    select: {
      id: true, fullName: true, email: true, city: true, state: true, zip: true, outcome: true,
      claimedAt: true, outcomeUpdatedAt: true, softNudgeSentAt: true, patientCheckinSentAt: true, routedToId: true,
      provider: { select: { id: true, name: true, notificationEmail: true, claimEmail: true, email: true, phonePublic: true, phone: true, notifyEnabled: true, removedAt: true } },
    },
    orderBy: { claimedAt: 'asc' },
    take: BATCH_CAP,
  })
  // The nudge counts from when the outcome was logged; rows older than the
  // outcomeUpdatedAt column fall back to the claim time.
  return rows.filter(l => (l.outcomeUpdatedAt || l.claimedAt || now).getTime() <= dueBefore.getTime())
}

type Candidate = Awaited<ReturnType<typeof findSoftOutcomeCandidates>>[number]

function hoursAgo(d: Date | null, now: Date): string {
  if (!d) return 'a while'
  const h = Math.round((now.getTime() - d.getTime()) / 3600e3)
  return h >= 48 ? `${Math.round(h / 24)} days` : `${h} hours`
}

async function sendProviderNudge(c: Candidate, now: Date): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY not set')
  if (!FROM_EMAIL) throw new Error('LEAD_EMAIL_FROM not set')
  sg.setApiKey(process.env.SENDGRID_API_KEY)
  const to = c.provider?.notificationEmail || c.provider?.claimEmail || c.provider?.email
  if (!to || !c.provider) throw new Error('no provider email')
  const working = quickOutcomeUrl(c.id, c.provider.id, 'working')
  const booked = quickOutcomeUrl(c.id, c.provider.id, 'booked')
  const handback = quickOutcomeUrl(c.id, c.provider.id, 'handback')
  const logged = String(c.outcome).toLowerCase().replace(/_/g, ' ')
  const since = hoursAgo(c.outcomeUpdatedAt || c.claimedAt, now)
  const subject = `${c.fullName} (${c.city}, ${c.state}): still on? One tap either way`
  const text = `Hi ${c.provider.name},

You logged "${logged}" on ${c.fullName} in ${c.city}, ${c.state} about ${since} ago and nothing has changed since. No pressure, just checking which of these is true. One tap, no login:

  Still working it:  ${working}
  Appointment booked: ${booked}
  Hand it back:      ${handback}

"Hand it back" releases the request and offers it to other providers right away, so the patient isn't left waiting on a call that isn't coming. Nothing is held against you for it.

If the patient has gone quiet on you, that's worth knowing too. I'm checking in with them separately.

Lead ID: ${c.id}

Hector Valles
MobilePhlebotomy.org`
  const btn = (href: string, label: string, color: string) =>
    `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;margin:6px 8px 6px 0;">${label}</a>`
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.7;color:#1f2937;max-width:600px;margin:0 auto;padding:20px;">
<p>Hi ${c.provider.name},</p>
<p>You logged <strong>${logged}</strong> on <strong>${c.fullName}</strong> in ${c.city}, ${c.state} about ${since} ago and nothing has changed since. No pressure, just checking which of these is true. One tap, no login:</p>
<p>${btn(working, "I'm still working it", '#2563eb')} ${btn(booked, 'Appointment booked', '#16a34a')} ${btn(handback, 'Hand it back', '#b45309')}</p>
<p style="color:#4b5563;">"Hand it back" releases the request and offers it to other providers right away, so the patient isn't left waiting on a call that isn't coming. Nothing is held against you for it.</p>
<p style="color:#4b5563;">If the patient has gone quiet on you, that's worth knowing too. I'm checking in with them separately.</p>
<p style="color:#9ca3af;font-size:12px;">Lead ID: ${c.id}</p>
<p>Hector Valles<br>MobilePhlebotomy.org</p>
</body></html>`
  const payload: any = { to, from: FROM_EMAIL, subject, text, html }
  if (process.env.LEAD_REPLY_TO) payload.replyTo = process.env.LEAD_REPLY_TO
  await sg.send(payload)
}

export function buildPatientCheckin(c: Candidate, token: string): { subject: string; text: string; html: string } {
  const first = (c.fullName || '').trim().split(' ')[0] || 'there'
  const providerName = c.provider?.name?.trim() || 'the phlebotomist'
  const providerPhone = c.provider?.phonePublic || c.provider?.phone || null
  const yes = `${SITE_URL}/api/checkin/${token}?a=in_touch`
  const no = `${SITE_URL}/api/checkin/${token}?a=no_contact`
  const subject = `Has ${providerName} reached you about your blood draw?`
  const text = `Hi ${first},

A couple of days ago ${providerName} accepted your request for a mobile blood draw in ${c.city}, ${c.state}${providerPhone ? ` (their number is ${providerPhone})` : ''}. I'm checking that the two of you have connected.

One tap, no login:

  Yes, we're in touch:            ${yes}
  No, nobody has contacted me:    ${no}

If it's a no, I'll get your request to another phlebotomist myself. If you've already been scheduled or seen, the first link is all I need.

Hector Valles
MobilePhlebotomy.org`
  const btn = (href: string, label: string, color: string) =>
    `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;margin:6px 8px 6px 0;">${label}</a>`
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.7;color:#1f2937;max-width:600px;margin:0 auto;padding:20px;">
<p>Hi ${first},</p>
<p>A couple of days ago <strong>${providerName}</strong> accepted your request for a mobile blood draw in ${c.city}, ${c.state}${providerPhone ? ` (their number is ${providerPhone})` : ''}. I'm checking that the two of you have connected.</p>
<p>${btn(yes, "Yes, we're in touch", '#16a34a')} ${btn(no, 'No, nobody has contacted me', '#b45309')}</p>
<p style="color:#4b5563;">If it's a no, I'll get your request to another phlebotomist myself. If you've already been scheduled or seen, the first link is all I need.</p>
<p>Hector Valles<br>MobilePhlebotomy.org</p>
</body></html>`
  return { subject, text, html }
}

export async function runSoftOutcomeNudgeSweep(opts: { dryRun?: boolean } = {}): Promise<NudgeSweepResult> {
  const now = new Date()
  const cands = await findSoftOutcomeCandidates(now)
  const r: NudgeSweepResult = { dryRun: !!opts.dryRun, scanned: cands.length, providerNudges: 0, patientCheckins: 0, skippedNoProviderEmail: 0, skippedNoPatientEmail: 0, errors: [] }
  for (const c of cands) {
    // Provider nudge
    if (!c.softNudgeSentAt) {
      const providerOk = c.provider && !c.provider.removedAt && c.provider.notifyEnabled !== false && (c.provider.notificationEmail || c.provider.claimEmail || c.provider.email)
      if (!providerOk) r.skippedNoProviderEmail++
      else if (opts.dryRun) r.providerNudges++
      else {
        try {
          // Stamp first so a slow send cannot double-fire on the next tick.
          await prisma.lead.update({ where: { id: c.id }, data: { softNudgeSentAt: now } })
          await sendProviderNudge(c, now)
          r.providerNudges++
        } catch (err: any) {
          r.errors.push({ leadId: c.id, error: `provider: ${err?.message || err}` })
        }
      }
    }
    // Patient check-in
    if (!c.patientCheckinSentAt) {
      if (!c.email) r.skippedNoPatientEmail++
      else if (opts.dryRun) r.patientCheckins++
      else {
        try {
          const token = generateOutcomeToken()
          await prisma.lead.update({ where: { id: c.id }, data: { patientCheckinSentAt: now, patientCheckinToken: token } })
          const m = buildPatientCheckin(c, token)
          const err = await sendTransactionalEmail({ to: c.email, subject: m.subject, text: m.text, html: m.html })
          if (err) throw new Error(err)
          r.patientCheckins++
        } catch (err: any) {
          r.errors.push({ leadId: c.id, error: `patient: ${err?.message || err}` })
        }
      }
    }
  }
  if (cands.length > 0) console.log(`[soft-outcome-nudge] dry=${r.dryRun} scanned=${r.scanned} providerNudges=${r.providerNudges} patientCheckins=${r.patientCheckins} noProviderEmail=${r.skippedNoProviderEmail} noPatientEmail=${r.skippedNoPatientEmail} errors=${r.errors.length}`)
  return r
}
