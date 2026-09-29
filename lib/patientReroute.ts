import sg from '@sendgrid/mail'
import { prisma } from './prisma'
import { emailAdmin } from './adminEmail'
import { notifyFeaturedProvidersForLead, renotifyOpenLead } from './leadNotifications'

if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org'
const SITE_URL = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org').replace(/\/+$/, '')

/**
 * Requester-triggered reroute (2026-09-29).
 *
 * A provider claimed the request and the patient says nobody has contacted
 * them. Until now that answer only emailed the admin (day-2 check-in) and the
 * lead sat with the silent provider until the stale-claim cron or Hector
 * moved it. Now the patient's word moves it: the claim is released, the
 * silent provider is told, and the request is re-offered at once, the same
 * pair of sends the hand-back and can't-serve paths use. The silent provider
 * is excluded from the re-offer but not stamped as having declined: they
 * can still re-claim from the dashboard if they really were in touch.
 *
 * Two entry points share this: the "I haven't heard from them" button on
 * /request/[token] (gated on hours since the claim, so a 9 pm claim is not
 * yanked at 11 pm) and the "no_contact" answer to the day-2 check-in (past
 * any gate by definition).
 *
 * Consumer requests only. Institutional leads never get a patient token and
 * never enter the check-in flow.
 */
export const REROUTE_AFTER_HOURS = { STAT: 1, STANDARD: 4 } as const
/** After this many patient reroutes the request goes to Hector instead of the pool. */
export const MAX_PATIENT_REROUTES = 2
export const PATIENT_REROUTE_REASON = 'patient_no_contact'

const BOOKED = new Set(['APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED'])

export interface RerouteLead {
  status: string
  outcome: string | null
  urgency: 'STAT' | 'STANDARD' | string
  claimedAt: Date | null
  routedToId: string | null
  appointmentDate: Date | null
  patientRerouteCount: number
}

export type RerouteEligibility =
  | { ok: true }
  | { ok: false; code: 'not_claimed' | 'booked' | 'too_early' | 'cap'; availableAt?: Date }

/**
 * Pure check used by the status page (to decide what to show) and the route
 * (to refuse). `ignoreGate` is for the check-in path, which is already two
 * days in.
 */
export function rerouteEligibility(lead: RerouteLead, opts: { ignoreGate?: boolean } = {}, now = new Date()): RerouteEligibility {
  // CLAIMED is the normal case. DELIVERED is what "complete" with a soft
  // outcome (no answer, voicemail, text sent) leaves behind: the provider
  // considers it done, the patient may not.
  if (!lead.routedToId || !lead.claimedAt || !['CLAIMED', 'DELIVERED'].includes(lead.status)) return { ok: false, code: 'not_claimed' }
  if (lead.appointmentDate || (lead.outcome && BOOKED.has(lead.outcome))) return { ok: false, code: 'booked' }
  if (lead.patientRerouteCount >= MAX_PATIENT_REROUTES) return { ok: false, code: 'cap' }
  if (!opts.ignoreGate) {
    const hours = lead.urgency === 'STAT' ? REROUTE_AFTER_HOURS.STAT : REROUTE_AFTER_HOURS.STANDARD
    const availableAt = new Date(lead.claimedAt.getTime() + hours * 3600e3)
    if (now < availableAt) return { ok: false, code: 'too_early', availableAt }
  }
  return { ok: true }
}

export interface RerouteResult {
  ok: boolean
  code?: 'not_found' | 'not_claimed' | 'booked' | 'too_early' | 'cap' | 'race'
  providerName?: string
  newProvidersNotified?: number
  remindersSent?: number
}

export async function patientReroute(input: { leadId: string; source: 'status_page' | 'checkin' }): Promise<RerouteResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: {
      id: true, status: true, outcome: true, urgency: true, claimedAt: true, routedToId: true, appointmentDate: true,
      patientRerouteCount: true, fullName: true, phone: true, email: true, city: true, state: true, zip: true, outcomeNotes: true,
      provider: { select: { id: true, name: true, email: true, claimEmail: true, notificationEmail: true, phone: true, phonePublic: true } },
    },
  })
  if (!lead) return { ok: false, code: 'not_found' }
  const elig = rerouteEligibility(lead, { ignoreGate: input.source === 'checkin' })
  if (!elig.ok) return { ok: false, code: elig.code }

  const now = new Date()
  const providerId = lead.routedToId as string
  const providerName = lead.provider?.name?.trim() || 'the provider'
  const hoursSinceClaim = Math.round(((now.getTime() - (lead.claimedAt as Date).getTime()) / 3600e3) * 10) / 10
  const via = input.source === 'checkin' ? 'the day-2 check-in' : 'their status page'
  const note = `Patient reported no contact from ${providerName} ${hoursSinceClaim}h after the claim (via ${via}); claim released and request re-offered.`

  // Conditional flip: only the claim we just read. Mirrors handBackLead /
  // releaseStaleLead. Provider gets a strike (same counter the stale cron
  // uses, reversible on re-claim) so a pattern shows in the roster.
  const released = await prisma.lead.updateMany({
    where: { id: lead.id, routedToId: providerId, status: { in: ['CLAIMED', 'DELIVERED'] } },
    data: {
      status: 'OPEN', routedToId: null, claimedAt: null, firstContactAt: null, callAttempts: 0,
      outcome: null, outcomeUpdatedAt: now,
      outcomeNotes: lead.outcomeNotes ? `${lead.outcomeNotes}\n${note}` : note,
      releasedFromProviderId: providerId, releasedAt: now, releaseReason: PATIENT_REROUTE_REASON,
      patientRerouteCount: { increment: 1 }, patientRerouteAt: now,
    },
  })
  if (released.count === 0) return { ok: false, code: 'race' }
  await prisma.provider.update({ where: { id: providerId }, data: { staleReleaseCount: { increment: 1 }, lastStaleReleaseAt: now } }).catch(err => console.error('[patientReroute] strike failed:', err?.message || err))
  console.log(`[patientReroute] ${lead.id} released from ${providerId} after ${hoursSinceClaim}h (${input.source}); re-offering`)

  const result: RerouteResult = { ok: true, providerName, newProvidersNotified: 0, remindersSent: 0 }
  // Awaited on purpose: Next 14 on Vercel has no waitUntil.
  try {
    result.newProvidersNotified = await notifyFeaturedProvidersForLead(lead.id, { onlyNewProviders: true })
    const r = await renotifyOpenLead(lead.id, { excludeProviderIds: [providerId] })
    result.remindersSent = r.sent
  } catch (err: any) {
    console.error(`[patientReroute] re-offer failed for ${lead.id}:`, err?.message || err)
  }

  const toEmail = lead.provider?.notificationEmail || lead.provider?.claimEmail || lead.provider?.email || null
  await sendPatientRerouteEmail({ toEmail, providerName, leadFullName: lead.fullName, leadCity: lead.city, leadState: lead.state, leadZip: lead.zip, hoursSinceClaim, leadId: lead.id })
    .catch(err => console.error('[patientReroute] provider email failed:', err?.message || err))

  emailAdmin(
    `Patient rerouted: ${lead.fullName} (${lead.city}, ${lead.state}) away from ${providerName}`,
    `${lead.fullName} said nobody contacted them ${hoursSinceClaim}h after ${providerName} claimed, via ${via}. The claim was released and the request re-offered: ${result.newProvidersNotified} new provider(s) notified, ${result.remindersSent} reminder(s) sent.\n\n` +
    `Lead ${lead.id}\nPatient: ${lead.fullName}, ${lead.phone}, ${lead.email || '-'}\nLocation: ${lead.city}, ${lead.state} ${lead.zip}\n` +
    `Provider: ${providerName} (${lead.provider?.phonePublic || lead.provider?.phone || '-'}, ${toEmail || '-'}); logged outcome before release: ${lead.outcome || '-'}\n` +
    `Patient reroutes on this lead: ${lead.patientRerouteCount + 1} of ${MAX_PATIENT_REROUTES}\n\n` +
    `${SITE_URL}/admin/lead-diagnostic/${lead.id}\n`
  ).catch(err => console.error('[patientReroute] admin alert failed:', err?.message || err))

  return result
}

/**
 * Tell the released provider. Not the SLA email: this one is the patient's
 * word, so it asks rather than accuses, and points at the re-claim path.
 */
async function sendPatientRerouteEmail(p: { toEmail: string | null; providerName: string; leadFullName: string; leadCity: string; leadState: string; leadZip: string; hoursSinceClaim: number; leadId: string }): Promise<void> {
  if (!p.toEmail || !process.env.SENDGRID_API_KEY) {
    console.warn(`[patientReroute] cannot email ${p.providerName}: ${!p.toEmail ? 'no address' : 'no SendGrid key'}`)
    return
  }
  const subject = `${p.leadFullName} (${p.leadCity}, ${p.leadState}) says they haven't heard from you — request re-offered`
  const text = `Hi ${p.providerName},

${p.leadFullName} in ${p.leadCity}, ${p.leadState} ${p.leadZip} told us nobody has contacted them since you accepted their request ${p.hoursSinceClaim} hours ago. We have released the claim and sent the request to other providers in the area.

If you did reach them, or you were about to, you can take it back from your dashboard: it is open again and you are still eligible to claim it. If you left a voicemail or sent a text they may not have seen, a second attempt from a different number often works.

If you no longer want it, nothing to do.

Dashboard: ${SITE_URL}/dashboard
Lead ID: ${p.leadId}

— Hector
MobilePhlebotomy.org
`
  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.7; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Hi ${p.providerName},</p>
<p><strong>${p.leadFullName}</strong> in ${p.leadCity}, ${p.leadState} ${p.leadZip} told us nobody has contacted them since you accepted their request ${p.hoursSinceClaim} hours ago. We have released the claim and sent the request to other providers in the area.</p>
<p>If you did reach them, or you were about to, you can take it back from your <a href="${SITE_URL}/dashboard" style="color:#0066cc;">dashboard</a>: it is open again and you are still eligible to claim it. If you left a voicemail or sent a text they may not have seen, a second attempt from a different number often works.</p>
<p>If you no longer want it, nothing to do.</p>
<p style="color:#6b7280;font-size:13px;">Lead ID: ${p.leadId}</p>
<p>— Hector<br>MobilePhlebotomy.org</p>
</body></html>`
  await sg.send({ to: p.toEmail, from: FROM_EMAIL, ...(process.env.LEAD_REPLY_TO ? { replyTo: process.env.LEAD_REPLY_TO } : {}), subject, text, html })
}
