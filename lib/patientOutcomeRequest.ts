import { nanoid } from 'nanoid'
import { sendTransactionalEmail } from './sendTransactionalEmail'

/**
 * Asks the patient whether their draw actually happened.
 *
 * Every completion number the business has is self-reported by the provider:
 * 45 leads marked APPOINTMENT_COMPLETED out of 784, with 56 claimed leads
 * carrying no outcome at all. Nothing checks any of it. The provider has no
 * reason to misreport today, and would have a direct one the moment a draw is
 * billable — which is exactly why this is being collected now, while the
 * answer is still disinterested. After money is attached to that field there
 * is no way to recover what the honest rate had been.
 *
 * The patient is the only other party to the draw and has nothing riding on
 * the answer. That is the whole design.
 *
 * Nothing here writes to lead status, routing, or any provider-facing field,
 * and no provider is named in the email. This is measurement, not enforcement.
 *
 * Build and send are split the way lib/patientClaimNotice.ts splits them, so
 * the copy can be rendered and read without a live SendGrid credential and
 * without sending to a real patient.
 */

const SITE = 'https://mobilephlebotomy.org'

/**
 * middleware.ts redirects any path containing "null" or "undefined" — case
 * insensitive, anywhere in the path — to the homepage with a 301. A nanoid
 * token draws from [A-Za-z0-9_-] and can contain either by chance, roughly one
 * token in 600,000.
 *
 * That failure is invisible from both ends: the patient taps, lands on the
 * homepage, and their answer is never recorded. No error, no log, nothing to
 * find later. Cheaper to make it impossible than to ever debug it.
 */
const MIDDLEWARE_TRAP = /null|undefined/i

export function generateOutcomeToken(): string {
  for (let i = 0; i < 10; i++) {
    const t = nanoid(32)
    if (!MIDDLEWARE_TRAP.test(t)) return t
  }
  // Ten consecutive hits is not reachable in practice; refuse rather than
  // return a token that will silently 301.
  throw new Error('could not generate a middleware-safe outcome token')
}

export interface OutcomeRequestInput {
  leadId: string
  fullName: string
  email: string
  /** When a provider claimed the lead — dates the ask so it is recognisable. */
  claimedAt: Date
  token: string
  /** Second ask. Only ever one, and it says so. */
  isReminder?: boolean
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildOutcomeRequest(input: OutcomeRequestInput): {
  subject: string
  text: string
  html: string
} {
  const firstName = (input.fullName || '').trim().split(/\s+/)[0] || 'there'
  const claimedDate = input.claimedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
  const url = `${SITE}/confirm/${input.token}`

  const subject = input.isReminder
    ? 'Quick check — did your blood draw happen?'
    : 'Did your blood draw happen?'

  const text = `Hi ${firstName},

A mobile phlebotomist accepted your request through MobilePhlebotomy.org on ${claimedDate}. We'd like to confirm how it went.

Yes, it was completed  —  or  —  No, it didn't happen:
${url}

One tap is all it takes. This helps us keep our provider network reliable.

— Hector
MobilePhlebotomy.org

Reply STOP to opt out.`

  // Both buttons point at the same URL and carry no answer. Email security
  // scanners follow links in messages before the recipient ever sees them, so
  // an outcome encoded in the href would be recorded as a real answer by a
  // machine. The choice has to happen on the page, behind a POST.
  const html = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; line-height: 1.6; color: #1f2937;">
  <p>Hi ${escapeHtml(firstName)},</p>

  <p>A mobile phlebotomist accepted your request through MobilePhlebotomy.org on
  <strong>${escapeHtml(claimedDate)}</strong>. We'd like to confirm how it went.</p>

  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
    <tr>
      <td style="padding-right: 12px;">
        <a href="${url}" style="display:inline-block; background:#059669; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:6px; font-weight:bold;">Yes, it was completed</a>
      </td>
      <td>
        <a href="${url}" style="display:inline-block; background:#ffffff; color:#374151; text-decoration:none; padding:12px 20px; border-radius:6px; font-weight:bold; border:1px solid #d1d5db;">No, it didn't happen</a>
      </td>
    </tr>
  </table>

  <p>One tap is all it takes. This helps us keep our provider network reliable.</p>

  <p style="margin-bottom:0;">— Hector<br>
  <a href="${SITE}" style="color:#2563eb;">MobilePhlebotomy.org</a></p>

  <p style="color:#9ca3af; font-size:12px; margin-top:24px;">Reply STOP to opt out.</p>
</div>`

  return { subject, text, html }
}

/**
 * Returns null on success, an error string otherwise.
 *
 * The caller records outcomeRequestSentAt only on null. A failure here must
 * leave the lead untouched so the next hourly run retries it — that is the
 * whole idempotency rule, and it is why this returns the helper's error
 * string rather than swallowing it.
 */
export async function sendOutcomeRequest(
  input: OutcomeRequestInput
): Promise<string | null> {
  const { subject, text, html } = buildOutcomeRequest(input)
  return sendTransactionalEmail({ to: input.email, subject, text, html })
}
