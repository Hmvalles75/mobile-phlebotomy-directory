import { sendTransactionalEmail } from './sendTransactionalEmail'
import { SITE_URL } from './seo'
import { STATE_DATA, ABBR_TO_SLUG } from '@/data/states-full'

/**
 * "We couldn't find a provider" — sent once by the expire-stale-leads cron
 * when an OPEN lead ages out (4 days, 2026-09-29) after providers were
 * notified and nobody claimed it. Zero-match leads never come through here:
 * they are parked NEEDS_COVERAGE at submit and get the "we're expanding"
 * email instead. Copy approved by Hector 2026-09-28.
 */
export interface ExpiredNoticeInput {
  id: string
  fullName: string | null
  email: string | null
  city: string
  state: string
  providersNotified: number
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildLeadExpiredNotice(lead: ExpiredNoticeInput): { subject: string; text: string; html: string } {
  const first = (lead.fullName || '').trim().split(/\s+/)[0] || 'there'
  const abbr = lead.state.trim().toUpperCase()
  const stateSlug = ABBR_TO_SLUG[abbr] || lead.state.toLowerCase().replace(/\s+/g, '-')
  const stateName = STATE_DATA[stateSlug]?.name || lead.state
  const stateUrl = `${SITE_URL}/us/${stateSlug}`
  const n = Math.max(lead.providersNotified, 1)
  const providers = `${n} provider${n === 1 ? '' : 's'}`

  const subject = `Your blood draw request in ${lead.city} — we couldn't find a provider`

  const text = `Hi ${first},

I'm sorry. We sent your request for a mobile blood draw in ${lead.city}, ${abbr} to ${providers} in your area, and none of them was able to take it in the last four days. Rather than leave it sitting open, I've closed it so you're not waiting on a call that isn't coming.

Three things that usually work from here:

1. Widen the area. Reply to this email with the nearest larger city or a ZIP code you could travel to, and I'll send the request to the providers there.

2. Loosen the timing. If your draw can happen any weekday morning, say so in a reply; providers who passed on a specific time often say yes to a flexible one.

3. Check the state list. Every provider listed for ${stateName} is at ${stateUrl}, including the ones who travel further than their home city. You can call any of them directly.

If none of that works, reply here and tell me what you need; I read every one of these myself.

Hector Valles
MobilePhlebotomy.org

Not for emergencies — if this is a medical emergency, call 911.`

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1f2937;">
  <p>Hi ${escapeHtml(first)},</p>
  <p>I'm sorry. We sent your request for a mobile blood draw in <strong>${escapeHtml(lead.city)}, ${escapeHtml(abbr)}</strong> to ${providers} in your area, and none of them was able to take it in the last four days. Rather than leave it sitting open, I've closed it so you're not waiting on a call that isn't coming.</p>
  <p>Three things that usually work from here:</p>
  <ol>
    <li><strong>Widen the area.</strong> Reply to this email with the nearest larger city or a ZIP code you could travel to, and I'll send the request to the providers there.</li>
    <li><strong>Loosen the timing.</strong> If your draw can happen any weekday morning, say so in a reply; providers who passed on a specific time often say yes to a flexible one.</li>
    <li><strong>Check the state list.</strong> Every provider listed for ${escapeHtml(stateName)} is at <a href="${stateUrl}">${stateUrl}</a>, including the ones who travel further than their home city. You can call any of them directly.</li>
  </ol>
  <p>If none of that works, reply here and tell me what you need; I read every one of these myself.</p>
  <p>Hector Valles<br>MobilePhlebotomy.org</p>
  <p style="color: #6b7280; font-size: 13px;">Not for emergencies — if this is a medical emergency, call 911.</p>
</div>`

  return { subject, text, html }
}

/** Returns an error string, or null on hand-off to SendGrid. */
export async function sendLeadExpiredNotice(lead: ExpiredNoticeInput): Promise<string | null> {
  if (!lead.email) return 'no email on lead'
  const m = buildLeadExpiredNotice(lead)
  return sendTransactionalEmail({ to: lead.email, subject: m.subject, text: m.text, html: m.html, replyTo: 'hector@mobilephlebotomy.org' })
}
