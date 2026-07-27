import sg from '@sendgrid/mail'

// Set the key at send time, not module load. Elsewhere in the codebase this is
// a top-level side effect, which is fine under Next.js (process.env is
// populated before user modules evaluate) but silently breaks in tsx scripts:
// ES imports are hoisted above dotenv.config(), so the key reads as undefined,
// setApiKey never fires, and SendGrid rejects the empty auth header with
// "Permission denied, wrong credentials" — which looks exactly like a revoked
// key. Resolving it per-call keeps local verification honest.

/**
 * Patient-facing confirmation email, sent immediately after a lead is routed to
 * providers.
 *
 * Why this exists: in the 2026-06-02 → 2026-07-27 window, 27 of 118 claimed
 * leads died at NO_ANSWER / VOICEMAIL / UNABLE_TO_REACH — exactly as many as
 * were won. Patients submit a form, then get a cold call hours later from an
 * unknown mobile number and don't pick up. The SMS confirmation flow that was
 * meant to prevent this (Lead.confirmedAt / patientSmsCount / AWAITING_CONFIRM)
 * has never run — 0 rows populated — because provider A2P registration was
 * rejected. Email is the channel that still works: 245 of 264 leads in that
 * window had an address on file, and leads WITHOUT one converted at 0%.
 *
 * The single job of this email is to make the patient expect an unknown number
 * and pick up. Everything else is secondary.
 *
 * Deliberately NOT sent when no provider was notified — that case already gets
 * sendExpansionEmailToLead(), and promising a call nobody will make is worse
 * than saying nothing.
 */

const SITE = 'https://mobilephlebotomy.org'
const FROM = 'hector@mobilephlebotomy.org'

export interface LeadConfirmationInput {
  id: string
  fullName: string
  email?: string | null
  city: string
  state: string
  urgency: string
}

/** STAT leads are priced and routed for same-day; set the timing line accordingly. */
function timingLine(urgency: string): string {
  return urgency === 'STAT'
    ? 'Because you marked this as urgent, expect that call shortly — usually within the hour.'
    : 'Most people hear from someone within a few hours, sometimes sooner.'
}

/**
 * Build the message. Separated from sending so the copy can be rendered and
 * reviewed without a live SendGrid credential.
 */
export function buildLeadConfirmation(lead: LeadConfirmationInput): {
  subject: string
  text: string
  html: string
} {
  const firstName = (lead.fullName || '').trim().split(/\s+/)[0] || 'there'
  const timing = timingLine(lead.urgency)
  const subject = 'Your blood draw request — expect a call from an unknown number'

  const text = `Hi ${firstName},

We received your mobile phlebotomy request for ${lead.city}, ${lead.state}, and we've sent it to the certified phlebotomists who cover your area.

Here's the one thing that matters:

A phlebotomist will call you directly, and it will come from a mobile number you don't recognize. Please pick up. If you miss it, they'll usually leave a voicemail — call back and you'll be scheduled.

${timing}

Missed calls are the single most common reason a request stalls, so it's worth watching your phone for the next little while.

A few things worth knowing:

  - The phlebotomist calling you is an independent provider, not an employee of MobilePhlebotomy.org. They'll confirm the details and pricing with you directly.
  - Most mobile draws are paid out of pocket. If you were expecting to use insurance, ask about that on the call — coverage varies by provider.
  - Have your doctor's order or lab requisition handy if you have one.

If nobody reaches you today, reply to this email and I'll follow up personally.

Hector Valles
MobilePhlebotomy.org
${SITE}`

  const html = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1f2937;">
  <p>Hi ${escapeHtml(firstName)},</p>

  <p>We received your mobile phlebotomy request for <strong>${escapeHtml(lead.city)}, ${escapeHtml(lead.state)}</strong>, and we've sent it to the certified phlebotomists who cover your area.</p>

  <p style="background:#fef3c7; padding:16px; border-radius:6px; border-left:4px solid #f59e0b;">
    <strong>A phlebotomist will call you from a mobile number you don't recognize.</strong><br>
    Please pick up. If you miss it, they'll usually leave a voicemail — call back and you'll be scheduled.
  </p>

  <p>${escapeHtml(timing)}</p>

  <p>Missed calls are the single most common reason a request stalls, so it's worth watching your phone for the next little while.</p>

  <p style="margin-bottom:6px;"><strong>A few things worth knowing:</strong></p>
  <ul style="margin-top:0; padding-left:20px;">
    <li>The phlebotomist calling you is an independent provider, not an employee of MobilePhlebotomy.org. They'll confirm details and pricing with you directly.</li>
    <li>Most mobile draws are paid out of pocket. If you were expecting to use insurance, ask about that on the call — coverage varies by provider.</li>
    <li>Have your doctor's order or lab requisition handy if you have one.</li>
  </ul>

  <p>If nobody reaches you today, just reply to this email and I'll follow up personally.</p>

  <p style="margin-bottom:0;"><strong>Hector Valles</strong><br>
  <a href="${SITE}" style="color:#2563eb;">MobilePhlebotomy.org</a></p>
</div>`

  return { subject, text, html }
}

export async function sendLeadConfirmationToPatient(
  lead: LeadConfirmationInput
): Promise<boolean> {
  if (!lead.email) {
    console.log(`[Lead ${lead.id}] No email on file — cannot send patient confirmation`)
    return false
  }
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    console.error('[Lead confirmation] SendGrid not configured')
    return false
  }
  sg.setApiKey(apiKey)

  const { subject, text, html } = buildLeadConfirmation(lead)

  try {
    await sg.send({ to: lead.email, from: FROM, replyTo: FROM, subject, text, html })
    console.log(`[Lead ${lead.id}] ✅ Patient confirmation sent to ${lead.email}`)
    return true
  } catch (error: any) {
    console.error(
      `[Lead ${lead.id}] ❌ Patient confirmation FAILED:`,
      error?.response?.body || error?.message || error
    )
    return false
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
